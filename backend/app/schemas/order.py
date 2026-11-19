from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.order import OrderStatusEnum, AddressTypeEnum, DiscountTypeEnum
from app.models.payment import PaymentMethodEnum, PaymentStatusEnum, ShipmentStatusEnum


class AddressCreate(BaseModel):
    full_name: str
    phone: str
    street_address: str
    city: str
    state: str
    postal_code: str
    country: str = "India"
    is_default: bool = False
    address_type: AddressTypeEnum = AddressTypeEnum.SHIPPING


class AddressUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    street_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    is_default: Optional[bool] = None


class AddressResponse(AddressCreate):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class CartItemAdd(BaseModel):
    product_id: int
    quantity: int = Field(default=1, gt=0)


class CartItemUpdate(BaseModel):
    quantity: int = Field(gt=0)


class CartItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_sku: str
    product_image: Optional[str] = None
    unit_price: float
    quantity: int
    total_price: float

    class Config:
        from_attributes = True


class CartResponse(BaseModel):
    id: int
    items: List[CartItemResponse] = []
    subtotal: float
    tax: float
    shipping: float
    discount: float = 0.0
    total: float


class CouponValidateRequest(BaseModel):
    code: str
    cart_total: float


class CouponResponse(BaseModel):
    code: str
    discount_type: DiscountTypeEnum
    discount_value: float
    discount_amount: float
    is_valid: bool
    message: str


class CheckoutInitializeRequest(BaseModel):
    address_id: int
    coupon_code: Optional[str] = None
    notes: Optional[str] = None


class CheckoutInitializeResponse(BaseModel):
    order_id: int
    order_number: str
    total_amount: float
    discount_amount: float
    tax_amount: float
    shipping_amount: float
    final_amount: float
    razorpay_order_id: str
    razorpay_key_id: str
    currency: str = "INR"


class PaymentVerifyRequest(BaseModel):
    order_id: int
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_sku: str
    unit_price: float
    quantity: int
    total_price: float

    class Config:
        from_attributes = True


class PaymentResponse(BaseModel):
    id: int
    payment_method: PaymentMethodEnum
    status: PaymentStatusEnum
    amount: float
    currency: str
    transaction_id: Optional[str] = None

    class Config:
        from_attributes = True


class ShipmentResponse(BaseModel):
    id: int
    carrier: str
    tracking_number: Optional[str] = None
    status: ShipmentStatusEnum
    estimated_delivery_at: Optional[datetime] = None
    shipped_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class OrderStatusUpdateRequest(BaseModel):
    status: OrderStatusEnum
    notes: Optional[str] = None
    carrier: Optional[str] = None
    tracking_number: Optional[str] = None


class OrderResponse(BaseModel):
    id: int
    order_number: str
    customer_id: int
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    total_amount: float
    discount_amount: float
    tax_amount: float
    shipping_amount: float
    final_amount: float
    order_status: OrderStatusEnum
    created_at: datetime
    items: List[OrderItemResponse] = []
    shipping_address: Optional[AddressResponse] = None
    payment: Optional[PaymentResponse] = None
    shipment: Optional[ShipmentResponse] = None

    class Config:
        from_attributes = True


class ReviewCreate(BaseModel):
    product_id: int
    rating: int = Field(ge=1, le=5)
    title: Optional[str] = None
    comment: str = Field(min_length=5)


class ReviewResponse(BaseModel):
    id: int
    product_id: int
    customer_id: int
    customer_name: str
    rating: int
    title: Optional[str]
    comment: str
    is_verified_purchase: bool
    created_at: datetime

    class Config:
        from_attributes = True
