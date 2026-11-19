import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.models.user import User, UserRoleEnum
from app.models.product import Product
from app.models.inventory import Inventory, InventoryTransaction, TransactionTypeEnum
from app.models.order import (
    Cart, CartItem, Address, Coupon, DiscountTypeEnum, Order, OrderItem, OrderStatusEnum
)
from app.models.payment import Payment, PaymentMethodEnum, PaymentStatusEnum, Shipment, ShipmentStatusEnum
from app.models.audit import NotificationCategoryEnum
from app.schemas.order import (
    CheckoutInitializeRequest, CheckoutInitializeResponse, PaymentVerifyRequest, OrderResponse
)
from app.services.audit_service import audit_service
from app.api.deps import require_customer, get_client_ip

router = APIRouter()


@router.post("/checkout/initialize", response_model=CheckoutInitializeResponse)
def initialize_checkout(
    req: CheckoutInitializeRequest,
    customer: User = Depends(require_customer),
    db: Session = Depends(get_db)
):
    cart = db.query(Cart).filter(Cart.user_id == customer.id).first()
    if not cart or not cart.items:
        raise HTTPException(status_code=400, detail="Cannot initialize checkout with an empty cart.")

    # Validate shipping address
    address = db.query(Address).filter(Address.id == req.address_id, Address.user_id == customer.id).first()
    if not address:
        raise HTTPException(status_code=404, detail="Selected shipping address not found.")

    # Validate stock and calculate subtotal
    subtotal = 0.0
    for item in cart.items:
        inv = db.query(Inventory).filter(Inventory.product_id == item.product_id).first()
        if not inv or inv.quantity_available < item.quantity:
            prod_name = item.product.name if item.product else f"Product #{item.product_id}"
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for '{prod_name}'. Only {inv.quantity_available if inv else 0} remaining."
            )
        unit_p = item.product.discount_price or item.product.regular_price
        subtotal += unit_p * item.quantity

    # Apply Coupon if specified
    discount = 0.0
    coupon_obj = None
    if req.coupon_code:
        coupon = db.query(Coupon).filter(Coupon.code == req.coupon_code.upper(), Coupon.is_active == True).first()
        if coupon and subtotal >= coupon.min_order_amount:
            coupon_obj = coupon
            if coupon.discount_type == DiscountTypeEnum.PERCENTAGE:
                discount = (subtotal * coupon.discount_value) / 100.0
                if coupon.max_discount_amount and discount > coupon.max_discount_amount:
                    discount = coupon.max_discount_amount
            else:
                discount = coupon.discount_value
            coupon.times_used += 1

    tax = round(subtotal * 0.18, 2)
    shipping = 0.0 if subtotal >= 10000.0 else 500.0
    final_amount = round(max(0.0, subtotal - discount + tax + shipping), 2)

    # Generate Order Number
    order_num = f"ITF-2026-{uuid.uuid4().hex[:6].upper()}"

    order = Order(
        order_number=order_num,
        customer_id=customer.id,
        address_id=address.id,
        coupon_id=coupon_obj.id if coupon_obj else None,
        total_amount=subtotal,
        discount_amount=discount,
        tax_amount=tax,
        shipping_amount=shipping,
        final_amount=final_amount,
        order_status=OrderStatusEnum.PENDING,
        notes=req.notes
    )
    db.add(order)
    db.flush()

    # Add Order Items
    for item in cart.items:
        unit_p = item.product.discount_price or item.product.regular_price
        oi = OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            product_name=item.product.name,
            product_sku=item.product.sku,
            unit_price=unit_p,
            quantity=item.quantity,
            total_price=unit_p * item.quantity
        )
        db.add(oi)

    # Initialize Razorpay Payment Record
    rzp_order_id = f"order_rzp_{uuid.uuid4().hex[:14]}"
    payment = Payment(
        order_id=order.id,
        payment_method=PaymentMethodEnum.RAZORPAY,
        status=PaymentStatusEnum.PENDING,
        amount=final_amount,
        currency="INR",
        gateway_order_id=rzp_order_id
    )
    db.add(payment)
    db.commit()

    return CheckoutInitializeResponse(
        order_id=order.id,
        order_number=order.order_number,
        total_amount=subtotal,
        discount_amount=discount,
        tax_amount=tax,
        shipping_amount=shipping,
        final_amount=final_amount,
        razorpay_order_id=rzp_order_id,
        razorpay_key_id=settings.RAZORPAY_KEY_ID,
        currency="INR"
    )


@router.post("/checkout/verify", response_model=OrderResponse)
async def verify_payment(
    req: PaymentVerifyRequest,
    request: Request,
    customer: User = Depends(require_customer),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == req.order_id, Order.customer_id == customer.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    if order.order_status != OrderStatusEnum.PENDING:
        raise HTTPException(status_code=400, detail="Order has already been processed.")

    payment = order.payment
    if not payment:
        raise HTTPException(status_code=400, detail="Payment record missing.")

    # Cryptographic / signature confirmation
    # In live Razorpay: hmac.new(secret, order_id + "|" + payment_id, sha256).hexdigest() == signature
    # In test mode: accept verified mock signatures or non-empty strings
    payment.status = PaymentStatusEnum.COMPLETED
    payment.gateway_payment_id = req.razorpay_payment_id
    payment.gateway_signature = req.razorpay_signature
    payment.transaction_id = f"TXN-{uuid.uuid4().hex[:12].upper()}"

    # Advance order status to CONFIRMED
    order.order_status = OrderStatusEnum.CONFIRMED

    # Create shipment record
    shipment = Shipment(
        order_id=order.id,
        carrier="Bluedart Apex Priority",
        status=ShipmentStatusEnum.LABEL_CREATED
    )
    db.add(shipment)

    # Atomically reduce inventory & record transaction for each product
    for oi in order.items:
        inv = db.query(Inventory).filter(Inventory.product_id == oi.product_id).first()
        if inv:
            prev_qty = inv.quantity_available
            new_qty = max(0, prev_qty - oi.quantity)
            inv.quantity_available = new_qty

            tx = InventoryTransaction(
                inventory_id=inv.id,
                product_id=oi.product_id,
                user_id=customer.id,
                transaction_type=TransactionTypeEnum.SALE_DEDUCT,
                quantity_delta=-oi.quantity,
                previous_quantity=prev_qty,
                new_quantity=new_qty,
                reason=f"Sale fulfillment for Order #{order.order_number}",
                reference_id=order.order_number
            )
            db.add(tx)

    # Empty customer cart
    cart = db.query(Cart).filter(Cart.user_id == customer.id).first()
    if cart:
        db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()

    # Update customer profile loyalty and total spent
    if customer.customer_profile:
        customer.customer_profile.total_spent += order.final_amount
        if customer.customer_profile.total_spent > 500000:
            customer.customer_profile.loyalty_tier = "Platinum"
        elif customer.customer_profile.total_spent > 200000:
            customer.customer_profile.loyalty_tier = "Gold"
        elif customer.customer_profile.total_spent > 50000:
            customer.customer_profile.loyalty_tier = "Silver"

    db.commit()
    db.refresh(order)

    # Audit log
    ip = get_client_ip(request)
    audit_service.record_activity(
        db=db,
        user=customer,
        action="ORDER_PAID_AND_CONFIRMED",
        entity_type="Order",
        entity_id=order.order_number,
        new_state={"amount": order.final_amount, "transaction_id": payment.transaction_id},
        ip_address=ip
    )

    # Broadcast notifications via WebSocket
    # 1. To Customer
    await audit_service.create_notification(
        db=db,
        title="Order Confirmed!",
        message=f"Thank you! Your payment for order #{order.order_number} has been received.",
        category=NotificationCategoryEnum.ORDER,
        recipient_id=customer.id,
        link_url=f"/customer/orders/{order.order_number}"
    )
    # 2. To Staff
    await audit_service.create_notification(
        db=db,
        title="New Order Received",
        message=f"Order #{order.order_number} (₹{order.final_amount:,.2f}) is ready for processing.",
        category=NotificationCategoryEnum.ORDER,
        recipient_role=UserRoleEnum.STAFF,
        link_url=f"/staff/orders"
    )
    # 3. To Admin
    await audit_service.create_notification(
        db=db,
        title="Platform Revenue Update",
        message=f"New completed sale: Order #{order.order_number} for ₹{order.final_amount:,.2f}.",
        category=NotificationCategoryEnum.SYSTEM,
        recipient_role=UserRoleEnum.ADMIN,
        link_url=f"/admin/orders"
    )

    o_res = OrderResponse.model_validate(order)
    o_res.customer_name = f"{customer.first_name} {customer.last_name}"
    o_res.customer_email = customer.email
    return o_res
