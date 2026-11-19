from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_, func

from app.core.database import get_db
from app.models.user import User, UserRoleEnum
from app.models.product import (
    Product, ProductStatusEnum, Category, Brand, ProductImage, ProductSpecification
)
from app.models.order import (
    Cart, CartItem, Wishlist, Coupon, DiscountTypeEnum, Address, AddressTypeEnum,
    Order, OrderStatusEnum, OrderItem, Review
)
from app.models.inventory import Inventory
from app.schemas.product import ProductResponse, CategoryResponse, BrandResponse
from app.schemas.order import (
    CartResponse, CartItemResponse, CartItemAdd, CartItemUpdate,
    CouponValidateRequest, CouponResponse,
    AddressCreate, AddressUpdate, AddressResponse,
    OrderResponse, ReviewCreate, ReviewResponse
)
from app.api.deps import require_customer, get_current_user, get_client_ip
from app.services.audit_service import audit_service

router = APIRouter()


# PUBLIC STORE CATALOG ENDPOINTS

@router.get("/store/products", response_model=List[ProductResponse])
def get_store_products(
    category: Optional[str] = None,
    brand: Optional[str] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    has_3d: Optional[bool] = None,
    sort_by: str = Query("featured", pattern="^(featured|price_asc|price_desc|newest)$"),
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(Product).filter(Product.status == ProductStatusEnum.PUBLISHED)

    if category:
        query = query.join(Category, Product.category_id == Category.id).filter(
            or_(Category.slug == category.lower(), Category.name.ilike(f"%{category}%"))
        )
    if brand:
        query = query.join(Brand, Product.brand_id == Brand.id).filter(
            or_(Brand.slug == brand.lower(), Brand.name.ilike(f"%{brand}%"))
        )
    if search:
        query = query.filter(
            or_(
                Product.name.ilike(f"%{search}%"),
                Product.description.ilike(f"%{search}%"),
                Product.sku.ilike(f"%{search}%"),
            )
        )
    if min_price is not None:
        query = query.filter(Product.regular_price >= min_price)
    if max_price is not None:
        query = query.filter(Product.regular_price <= max_price)
    if has_3d is True:
        query = query.filter(Product.model_3d_url.isnot(None), Product.model_3d_url != "")

    # Sorting
    if sort_by == "price_asc":
        query = query.order_by(Product.regular_price.asc())
    elif sort_by == "price_desc":
        query = query.order_by(Product.regular_price.desc())
    elif sort_by == "newest":
        query = query.order_by(desc(Product.created_at))
    else:  # featured
        query = query.order_by(desc(Product.is_featured), desc(Product.is_trending))

    products = query.offset(offset).limit(limit).all()

    results = []
    for p in products:
        p_res = ProductResponse.model_validate(p)
        p_res.stock_quantity = p.inventory.quantity_available if p.inventory else 0
        results.append(p_res)
    return results


@router.get("/store/products/{slug}", response_model=ProductResponse)
def get_store_product_detail(
    slug: str,
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(
        Product.slug == slug,
        Product.status == ProductStatusEnum.PUBLISHED
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail=f"Product '{slug}' not found or not published.")

    p_res = ProductResponse.model_validate(product)
    p_res.stock_quantity = product.inventory.quantity_available if product.inventory else 0

    # Calculate review average
    reviews = db.query(Review).filter(Review.product_id == product.id, Review.is_approved == True).all()
    if reviews:
        p_res.rating = round(sum(r.rating for r in reviews) / len(reviews), 1)
        p_res.review_count = len(reviews)
    return p_res


@router.get("/store/featured", response_model=List[ProductResponse])
def get_featured_products(
    limit: int = 8,
    db: Session = Depends(get_db)
):
    products = db.query(Product).filter(
        Product.status == ProductStatusEnum.PUBLISHED,
        Product.is_featured == True
    ).limit(limit).all()

    results = []
    for p in products:
        p_res = ProductResponse.model_validate(p)
        p_res.stock_quantity = p.inventory.quantity_available if p.inventory else 0
        results.append(p_res)
    return results


@router.get("/store/trending", response_model=List[ProductResponse])
def get_trending_products(
    limit: int = 8,
    db: Session = Depends(get_db)
):
    products = db.query(Product).filter(
        Product.status == ProductStatusEnum.PUBLISHED,
        Product.is_trending == True
    ).limit(limit).all()

    results = []
    for p in products:
        p_res = ProductResponse.model_validate(p)
        p_res.stock_quantity = p.inventory.quantity_available if p.inventory else 0
        results.append(p_res)
    return results


@router.get("/store/categories", response_model=List[CategoryResponse])
def get_store_categories(db: Session = Depends(get_db)):
    return db.query(Category).filter(Category.is_active == True).all()


@router.get("/store/brands", response_model=List[BrandResponse])
def get_store_brands(db: Session = Depends(get_db)):
    return db.query(Brand).filter(Brand.is_active == True).all()


# CUSTOMER CART ENDPOINTS

def _build_cart_response(cart: Cart) -> CartResponse:
    item_responses = []
    subtotal = 0.0
    for item in cart.items:
        prod = item.product
        unit_p = prod.discount_price or prod.regular_price
        total_p = unit_p * item.quantity
        subtotal += total_p
        
        primary_img = None
        if prod.images:
            for img in prod.images:
                if img.is_primary:
                    primary_img = img.image_url
                    break
            if not primary_img:
                primary_img = prod.images[0].image_url

        item_responses.append(CartItemResponse(
            id=item.id,
            product_id=prod.id,
            product_name=prod.name,
            product_sku=prod.sku,
            product_image=primary_img,
            unit_price=unit_p,
            quantity=item.quantity,
            total_price=total_p
        ))

    tax = round(subtotal * 0.18, 2)  # 18% standard GST
    shipping = 0.0 if subtotal >= 10000.0 or len(item_responses) == 0 else 500.0
    total = round(subtotal + tax + shipping, 2)

    return CartResponse(
        id=cart.id,
        items=item_responses,
        subtotal=subtotal,
        tax=tax,
        shipping=shipping,
        discount=0.0,
        total=total
    )


@router.get("/cart", response_model=CartResponse)
def get_cart(
    customer: User = Depends(require_customer),
    db: Session = Depends(get_db)
):
    cart = db.query(Cart).filter(Cart.user_id == customer.id).first()
    if not cart:
        cart = Cart(user_id=customer.id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return _build_cart_response(cart)


@router.post("/cart/items", response_model=CartResponse)
def add_to_cart(
    req: CartItemAdd,
    customer: User = Depends(require_customer),
    db: Session = Depends(get_db)
):
    cart = db.query(Cart).filter(Cart.user_id == customer.id).first()
    if not cart:
        cart = Cart(user_id=customer.id)
        db.add(cart)
        db.flush()

    product = db.query(Product).filter(
        Product.id == req.product_id,
        Product.status == ProductStatusEnum.PUBLISHED
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found or unavailable.")

    # Check stock
    avail_stock = product.inventory.quantity_available if product.inventory else 0
    if avail_stock < req.quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Only {avail_stock} units available in stock for '{product.name}'."
        )

    # Check if already in cart
    existing_item = db.query(CartItem).filter(
        CartItem.cart_id == cart.id,
        CartItem.product_id == product.id
    ).first()

    unit_p = product.discount_price or product.regular_price
    if existing_item:
        if existing_item.quantity + req.quantity > avail_stock:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot add more. You have {existing_item.quantity} in cart and only {avail_stock} in stock."
            )
        existing_item.quantity += req.quantity
    else:
        new_item = CartItem(
            cart_id=cart.id,
            product_id=product.id,
            quantity=req.quantity,
            unit_price=unit_p
        )
        db.add(new_item)

    db.commit()
    db.refresh(cart)
    return _build_cart_response(cart)


@router.put("/cart/items/{item_id}", response_model=CartResponse)
def update_cart_item(
    item_id: int,
    req: CartItemUpdate,
    customer: User = Depends(require_customer),
    db: Session = Depends(get_db)
):
    cart = db.query(Cart).filter(Cart.user_id == customer.id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found.")

    item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.cart_id == cart.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found.")

    avail_stock = item.product.inventory.quantity_available if item.product.inventory else 0
    if req.quantity > avail_stock:
        raise HTTPException(
            status_code=400,
            detail=f"Requested quantity exceeds stock. Available: {avail_stock}."
        )

    item.quantity = req.quantity
    db.commit()
    db.refresh(cart)
    return _build_cart_response(cart)


@router.delete("/cart/items/{item_id}", response_model=CartResponse)
def remove_from_cart(
    item_id: int,
    customer: User = Depends(require_customer),
    db: Session = Depends(get_db)
):
    cart = db.query(Cart).filter(Cart.user_id == customer.id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found.")

    item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.cart_id == cart.id).first()
    if item:
        db.delete(item)
        db.commit()
        db.refresh(cart)

    return _build_cart_response(cart)


@router.post("/cart/apply-coupon", response_model=CouponResponse)
def apply_coupon(
    req: CouponValidateRequest,
    customer: User = Depends(require_customer),
    db: Session = Depends(get_db)
):
    coupon = db.query(Coupon).filter(
        Coupon.code == req.code.upper(),
        Coupon.is_active == True
    ).first()
    if not coupon:
        return CouponResponse(
            code=req.code,
            discount_type=DiscountTypeEnum.PERCENTAGE,
            discount_value=0.0,
            discount_amount=0.0,
            is_valid=False,
            message="Invalid or expired coupon code."
        )

    now = datetime.now(timezone.utc)
    # Handle timezone comparison
    c_from = coupon.valid_from if coupon.valid_from.tzinfo else coupon.valid_from.replace(tzinfo=timezone.utc)
    c_until = coupon.valid_until if coupon.valid_until.tzinfo else coupon.valid_until.replace(tzinfo=timezone.utc)
    if not (c_from <= now <= c_until):
        return CouponResponse(
            code=coupon.code,
            discount_type=coupon.discount_type,
            discount_value=coupon.discount_value,
            discount_amount=0.0,
            is_valid=False,
            message="Coupon is outside of valid date window."
        )

    if req.cart_total < coupon.min_order_amount:
        return CouponResponse(
            code=coupon.code,
            discount_type=coupon.discount_type,
            discount_value=coupon.discount_value,
            discount_amount=0.0,
            is_valid=False,
            message=f"Minimum order value of ₹{coupon.min_order_amount:,.2f} required for this code."
        )

    # Calculate discount amount
    if coupon.discount_type == DiscountTypeEnum.PERCENTAGE:
        disc = (req.cart_total * coupon.discount_value) / 100.0
        if coupon.max_discount_amount and disc > coupon.max_discount_amount:
            disc = coupon.max_discount_amount
    else:
        disc = coupon.discount_value

    return CouponResponse(
        code=coupon.code,
        discount_type=coupon.discount_type,
        discount_value=coupon.discount_value,
        discount_amount=round(disc, 2),
        is_valid=True,
        message=f"Coupon applied! You saved ₹{disc:,.2f}."
    )


# CUSTOMER ADDRESSES

@router.get("/addresses", response_model=List[AddressResponse])
def get_customer_addresses(
    customer: User = Depends(require_customer),
    db: Session = Depends(get_db)
):
    return db.query(Address).filter(Address.user_id == customer.id).all()


@router.post("/addresses", response_model=AddressResponse)
def create_customer_address(
    req: AddressCreate,
    customer: User = Depends(require_customer),
    db: Session = Depends(get_db)
):
    if req.is_default:
        db.query(Address).filter(Address.user_id == customer.id).update({"is_default": False})

    addr = Address(
        user_id=customer.id,
        full_name=req.full_name,
        phone=req.phone,
        street_address=req.street_address,
        city=req.city,
        state=req.state,
        postal_code=req.postal_code,
        country=req.country,
        is_default=req.is_default,
        address_type=req.address_type
    )
    db.add(addr)
    db.commit()
    db.refresh(addr)
    return addr


# CUSTOMER ORDER HISTORY

@router.get("/orders", response_model=List[OrderResponse])
def get_customer_orders(
    customer: User = Depends(require_customer),
    db: Session = Depends(get_db)
):
    orders = db.query(Order).filter(Order.customer_id == customer.id).order_by(desc(Order.created_at)).all()
    results = []
    for o in orders:
        o_res = OrderResponse.model_validate(o)
        o_res.customer_name = f"{customer.first_name} {customer.last_name}"
        o_res.customer_email = customer.email
        results.append(o_res)
    return results


@router.get("/orders/{order_number}", response_model=OrderResponse)
def get_customer_order_detail(
    order_number: str,
    customer: User = Depends(require_customer),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(
        Order.order_number == order_number,
        Order.customer_id == customer.id
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    o_res = OrderResponse.model_validate(order)
    o_res.customer_name = f"{customer.first_name} {customer.last_name}"
    o_res.customer_email = customer.email
    return o_res


# REVIEWS

@router.post("/reviews", response_model=ReviewResponse)
def submit_review(
    req: ReviewCreate,
    customer: User = Depends(require_customer),
    db: Session = Depends(get_db)
):
    # Check verified purchase
    verified = db.query(OrderItem).join(Order, OrderItem.order_id == Order.id).filter(
        Order.customer_id == customer.id,
        OrderItem.product_id == req.product_id,
        Order.order_status == OrderStatusEnum.DELIVERED
    ).first() is not None

    review = Review(
        product_id=req.product_id,
        customer_id=customer.id,
        rating=req.rating,
        title=req.title,
        comment=req.comment,
        is_verified_purchase=verified,
        is_approved=True
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    return ReviewResponse(
        id=review.id,
        product_id=review.product_id,
        customer_id=customer.id,
        customer_name=f"{customer.first_name} {customer.last_name}",
        rating=review.rating,
        title=review.title,
        comment=review.comment,
        is_verified_purchase=review.is_verified_purchase,
        created_at=review.created_at
    )
