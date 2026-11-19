from datetime import datetime, timezone
import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.models.user import User, UserRoleEnum
from app.models.product import (
    Product, ProductStatusEnum, ProductImage, ProductSpecification,
    ProductApproval, ApprovalStatusEnum, Category, Brand
)
from app.models.inventory import Inventory, InventoryTransaction, TransactionTypeEnum
from app.models.order import Order, OrderStatusEnum, OrderItem
from app.models.payment import Shipment, ShipmentStatusEnum
from app.models.audit import NotificationCategoryEnum
from app.schemas.product import (
    ProductCreate, ProductUpdate, ProductResponse, ProductSpecificationCreate
)
from app.schemas.inventory import (
    InventoryResponse, StockAdjustmentRequest, InventoryTransactionResponse
)
from app.schemas.order import OrderResponse, OrderStatusUpdateRequest
from app.services.audit_service import audit_service
from app.api.deps import require_staff, get_client_ip

router = APIRouter()


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    text = re.sub(r"^-+|-+$", "", text)
    return text


@router.get("/dashboard")
def get_staff_dashboard(
    db: Session = Depends(get_db),
    staff: User = Depends(require_staff)
):
    assigned_prods = db.query(Product).filter(Product.created_by_id == staff.id).count()
    published_prods = db.query(Product).filter(
        Product.created_by_id == staff.id,
        Product.status == ProductStatusEnum.PUBLISHED
    ).count()
    pending_approvals = db.query(Product).filter(
        Product.created_by_id == staff.id,
        Product.status == ProductStatusEnum.PENDING_APPROVAL
    ).count()

    # Stock alerts
    low_stock = db.query(Inventory).filter(
        Inventory.quantity_available > 0,
        Inventory.quantity_available <= Inventory.reorder_threshold
    ).count()
    out_of_stock = db.query(Inventory).filter(Inventory.quantity_available <= 0).count()

    # Orders requiring fulfillment
    pending_fulfillment = db.query(Order).filter(
        Order.order_status.in_([OrderStatusEnum.CONFIRMED, OrderStatusEnum.PROCESSING, OrderStatusEnum.PACKED])
    ).count()

    return {
        "assigned_products": assigned_prods,
        "published_products": published_prods,
        "pending_approvals": pending_approvals,
        "low_stock_products": low_stock,
        "out_of_stock_products": out_of_stock,
        "orders_requiring_processing": pending_fulfillment,
    }


# PRODUCT MANAGEMENT

@router.get("/products", response_model=List[ProductResponse])
def get_staff_products(
    status: Optional[ProductStatusEnum] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    staff: User = Depends(require_staff)
):
    query = db.query(Product)
    if status:
        query = query.filter(Product.status == status)
    products = query.order_by(desc(Product.created_at)).offset(offset).limit(limit).all()

    results = []
    for p in products:
        p_res = ProductResponse.model_validate(p)
        p_res.stock_quantity = p.inventory.quantity_available if p.inventory else 0
        results.append(p_res)
    return results


@router.post("/products", response_model=ProductResponse)
async def create_product(
    req: ProductCreate,
    request: Request,
    db: Session = Depends(get_db),
    staff: User = Depends(require_staff)
):
    # Check duplicate SKU
    existing_sku = db.query(Product).filter(Product.sku == req.sku.upper()).first()
    if existing_sku:
        raise HTTPException(
            status_code=400,
            detail=f"Product with SKU '{req.sku}' already exists."
        )

    # Generate slug
    base_slug = slugify(req.name)
    slug = base_slug
    counter = 1
    while db.query(Product).filter(Product.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    # Staff created products default to PENDING_APPROVAL unless Admin creates it
    initial_status = ProductStatusEnum.PUBLISHED if staff.role == UserRoleEnum.ADMIN else ProductStatusEnum.PENDING_APPROVAL

    product = Product(
        name=req.name,
        slug=slug,
        sku=req.sku.upper(),
        brand_id=req.brand_id,
        category_id=req.category_id,
        short_description=req.short_description,
        description=req.description,
        regular_price=req.regular_price,
        discount_price=req.discount_price,
        status=initial_status,
        model_3d_url=req.model_3d_url,
        is_featured=req.is_featured,
        is_trending=req.is_trending,
        warranty_info=req.warranty_info,
        shipping_info=req.shipping_info,
        created_by_id=staff.id
    )
    db.add(product)
    db.flush()

    # Images
    if req.images:
        for idx, img_data in enumerate(req.images):
            img = ProductImage(
                product_id=product.id,
                image_url=img_data.image_url,
                alt_text=img_data.alt_text or product.name,
                is_primary=img_data.is_primary or (idx == 0),
                sort_order=img_data.sort_order or idx
            )
            db.add(img)

    # Specifications
    if req.specifications:
        for spec_data in req.specifications:
            spec = ProductSpecification(
                product_id=product.id,
                spec_key=spec_data.spec_key,
                spec_value=spec_data.spec_value,
                group_name=spec_data.group_name
            )
            db.add(spec)

    # Initial Inventory
    inventory = Inventory(
        product_id=product.id,
        quantity_available=req.initial_stock,
        quantity_reserved=0,
        reorder_threshold=5,
        last_restocked_at=datetime.now(timezone.utc)
    )
    db.add(inventory)
    db.flush()

    # Initial Stock In Transaction
    tx = InventoryTransaction(
        inventory_id=inventory.id,
        product_id=product.id,
        user_id=staff.id,
        transaction_type=TransactionTypeEnum.STOCK_IN,
        quantity_delta=req.initial_stock,
        previous_quantity=0,
        new_quantity=req.initial_stock,
        reason="Initial Product Stock Ingest",
        reference_id=f"INITIAL-{product.sku}"
    )
    db.add(tx)

    # If submitted for approval, create approval ticket
    if initial_status == ProductStatusEnum.PENDING_APPROVAL:
        appr = ProductApproval(
            product_id=product.id,
            submitted_by_id=staff.id,
            status=ApprovalStatusEnum.PENDING,
            review_notes="New product submitted by staff for catalog approval."
        )
        db.add(appr)

    db.commit()
    db.refresh(product)

    ip = get_client_ip(request)
    audit_service.record_activity(
        db=db,
        user=staff,
        action="PRODUCT_CREATED",
        entity_type="Product",
        entity_id=str(product.id),
        new_state={"name": product.name, "sku": product.sku, "status": product.status.value},
        ip_address=ip
    )

    if initial_status == ProductStatusEnum.PENDING_APPROVAL:
        await audit_service.create_notification(
            db=db,
            title="Product Approval Required",
            message=f"Staff member {staff.first_name} submitted '{product.name}' for review.",
            category=NotificationCategoryEnum.APPROVAL,
            recipient_role=UserRoleEnum.ADMIN,
            link_url="/admin/approvals"
        )

    p_res = ProductResponse.model_validate(product)
    p_res.stock_quantity = inventory.quantity_available
    return p_res


@router.put("/products/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    req: ProductUpdate,
    request: Request,
    db: Session = Depends(get_db),
    staff: User = Depends(require_staff)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    prev_state = {"name": product.name, "price": product.regular_price, "status": product.status.value}

    if req.name:
        product.name = req.name
    if req.brand_id:
        product.brand_id = req.brand_id
    if req.category_id:
        product.category_id = req.category_id
    if req.short_description is not None:
        product.short_description = req.short_description
    if req.description is not None:
        product.description = req.description
    if req.regular_price is not None:
        product.regular_price = req.regular_price
    if req.discount_price is not None:
        product.discount_price = req.discount_price
    if req.model_3d_url is not None:
        product.model_3d_url = req.model_3d_url
    if req.is_featured is not None:
        product.is_featured = req.is_featured
    if req.is_trending is not None:
        product.is_trending = req.is_trending
    if req.warranty_info is not None:
        product.warranty_info = req.warranty_info
    if req.shipping_info is not None:
        product.shipping_info = req.shipping_info

    # If product was rejected and staff edits, set to pending approval again
    if req.status:
        product.status = req.status
    elif product.status == ProductStatusEnum.REJECTED:
        product.status = ProductStatusEnum.PENDING_APPROVAL

    db.commit()
    db.refresh(product)

    ip = get_client_ip(request)
    audit_service.record_activity(
        db=db,
        user=staff,
        action="PRODUCT_UPDATED",
        entity_type="Product",
        entity_id=str(product.id),
        previous_state=prev_state,
        new_state={"name": product.name, "price": product.regular_price, "status": product.status.value},
        ip_address=ip
    )

    p_res = ProductResponse.model_validate(product)
    p_res.stock_quantity = product.inventory.quantity_available if product.inventory else 0
    return p_res


# INVENTORY MANAGEMENT & ATOMIC TRANSACTIONS

@router.get("/inventory", response_model=List[InventoryResponse])
def get_inventory_status(
    low_stock_only: bool = False,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    staff: User = Depends(require_staff)
):
    query = db.query(Inventory).join(Product, Inventory.product_id == Product.id)
    if low_stock_only:
        query = query.filter(Inventory.quantity_available <= Inventory.reorder_threshold)
    
    inventories = query.offset(offset).limit(limit).all()
    results = []
    for inv in inventories:
        inv_res = InventoryResponse(
            id=inv.id,
            product_id=inv.product_id,
            product_name=inv.product.name,
            product_sku=inv.product.sku,
            quantity_available=inv.quantity_available,
            quantity_reserved=inv.quantity_reserved,
            total_quantity=inv.total_quantity,
            reorder_threshold=inv.reorder_threshold,
            is_low_stock=inv.is_low_stock,
            is_out_of_stock=inv.is_out_of_stock,
            last_restocked_at=inv.last_restocked_at
        )
        results.append(inv_res)
    return results


@router.post("/inventory/adjust", response_model=InventoryResponse)
async def adjust_inventory(
    req: StockAdjustmentRequest,
    request: Request,
    db: Session = Depends(get_db),
    staff: User = Depends(require_staff)
):
    inventory = db.query(Inventory).filter(Inventory.product_id == req.product_id).first()
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory record not found for this product.")

    prev_qty = inventory.quantity_available
    new_qty = prev_qty + req.quantity_delta

    if new_qty < 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot reduce stock below zero. Current available: {prev_qty}, Delta: {req.quantity_delta}"
        )

    inventory.quantity_available = new_qty
    if req.quantity_delta > 0:
        inventory.last_restocked_at = datetime.now(timezone.utc)

    # Record immutable transaction
    tx = InventoryTransaction(
        inventory_id=inventory.id,
        product_id=inventory.product_id,
        user_id=staff.id,
        transaction_type=req.transaction_type,
        quantity_delta=req.quantity_delta,
        previous_quantity=prev_qty,
        new_quantity=new_qty,
        reason=req.reason,
        reference_id=req.reference_id or f"ADJ-{staff.id}-{int(datetime.now(timezone.utc).timestamp())}"
    )
    db.add(tx)
    db.commit()
    db.refresh(inventory)

    # Record Activity Log
    ip = get_client_ip(request)
    audit_service.record_activity(
        db=db,
        user=staff,
        action="INVENTORY_ADJUSTED",
        entity_type="Inventory",
        entity_id=str(inventory.id),
        previous_state={"quantity": prev_qty},
        new_state={"quantity": new_qty, "delta": req.quantity_delta, "reason": req.reason},
        ip_address=ip
    )

    # If low stock reached, trigger alert
    if inventory.is_low_stock:
        await audit_service.create_notification(
            db=db,
            title="Low Stock Alert",
            message=f"Product '{inventory.product.name}' has dropped to {new_qty} units (Threshold: {inventory.reorder_threshold}).",
            category=NotificationCategoryEnum.INVENTORY,
            recipient_role=UserRoleEnum.STAFF,
            link_url="/staff/inventory"
        )

    return InventoryResponse(
        id=inventory.id,
        product_id=inventory.product_id,
        product_name=inventory.product.name,
        product_sku=inventory.product.sku,
        quantity_available=inventory.quantity_available,
        quantity_reserved=inventory.quantity_reserved,
        total_quantity=inventory.total_quantity,
        reorder_threshold=inventory.reorder_threshold,
        is_low_stock=inventory.is_low_stock,
        is_out_of_stock=inventory.is_out_of_stock,
        last_restocked_at=inventory.last_restocked_at
    )


@router.get("/inventory/history", response_model=List[InventoryTransactionResponse])
def get_inventory_history(
    product_id: Optional[int] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    staff: User = Depends(require_staff)
):
    query = db.query(InventoryTransaction)
    if product_id:
        query = query.filter(InventoryTransaction.product_id == product_id)
    
    txs = query.order_by(desc(InventoryTransaction.created_at)).offset(offset).limit(limit).all()
    results = []
    for t in txs:
        t_res = InventoryTransactionResponse(
            id=t.id,
            inventory_id=t.inventory_id,
            product_id=t.product_id,
            product_name=t.product.name if t.product else None,
            user_id=t.user_id,
            user_email=t.user.email if t.user else "System",
            transaction_type=t.transaction_type,
            quantity_delta=t.quantity_delta,
            previous_quantity=t.previous_quantity,
            new_quantity=t.new_quantity,
            reason=t.reason,
            reference_id=t.reference_id,
            created_at=t.created_at
        )
        results.append(t_res)
    return results


# STAFF ORDER FULFILLMENT

@router.get("/orders", response_model=List[OrderResponse])
def get_staff_orders(
    status: Optional[OrderStatusEnum] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    staff: User = Depends(require_staff)
):
    query = db.query(Order)
    if status:
        query = query.filter(Order.order_status == status)
    
    orders = query.order_by(desc(Order.created_at)).offset(offset).limit(limit).all()
    results = []
    for o in orders:
        o_res = OrderResponse.model_validate(o)
        o_res.customer_name = f"{o.customer.first_name} {o.customer.last_name}"
        o_res.customer_email = o.customer.email
        results.append(o_res)
    return results


@router.patch("/orders/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: int,
    req: OrderStatusUpdateRequest,
    request: Request,
    db: Session = Depends(get_db),
    staff: User = Depends(require_staff)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    prev_status = order.order_status.value
    order.order_status = req.status
    order.assigned_staff_id = staff.id
    if req.notes:
        order.notes = req.notes

    # Update shipment details if provided or progressing to SHIPPED
    if req.status == OrderStatusEnum.SHIPPED:
        if not order.shipment:
            shipment = Shipment(
                order_id=order.id,
                carrier=req.carrier or "Bluedart Apex Priority",
                tracking_number=req.tracking_number or f"BD-EXP-{order.id:06d}",
                status=ShipmentStatusEnum.IN_TRANSIT,
                shipped_at=datetime.now(timezone.utc)
            )
            db.add(shipment)
        else:
            if req.carrier:
                order.shipment.carrier = req.carrier
            if req.tracking_number:
                order.shipment.tracking_number = req.tracking_number
            order.shipment.status = ShipmentStatusEnum.IN_TRANSIT
            order.shipment.shipped_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(order)

    ip = get_client_ip(request)
    audit_service.record_activity(
        db=db,
        user=staff,
        action="ORDER_STATUS_UPDATED",
        entity_type="Order",
        entity_id=order.order_number,
        previous_state={"status": prev_status},
        new_state={"status": order.order_status.value, "tracking": req.tracking_number},
        ip_address=ip
    )

    # Notify customer in real-time
    await audit_service.create_notification(
        db=db,
        title=f"Order Status: {order.order_status.value}",
        message=f"Your order #{order.order_number} has progressed to {order.order_status.value}.",
        category=NotificationCategoryEnum.ORDER,
        recipient_id=order.customer_id,
        link_url=f"/customer/orders/{order.order_number}"
    )

    o_res = OrderResponse.model_validate(order)
    o_res.customer_name = f"{order.customer.first_name} {order.customer.last_name}"
    o_res.customer_email = order.customer.email
    return o_res
