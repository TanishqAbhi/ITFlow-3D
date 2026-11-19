import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, Enum, Float
)
from sqlalchemy.orm import relationship
from app.core.database import Base, TimestampMixin


class PaymentMethodEnum(str, enum.Enum):
    RAZORPAY = "RAZORPAY"
    CARD = "CARD"
    UPI = "UPI"
    COD = "COD"


class PaymentStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"


class ShipmentStatusEnum(str, enum.Enum):
    LABEL_CREATED = "LABEL_CREATED"
    PICKED_UP = "PICKED_UP"
    IN_TRANSIT = "IN_TRANSIT"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    DELIVERED = "DELIVERED"


class Payment(Base, TimestampMixin):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    payment_method = Column(Enum(PaymentMethodEnum), default=PaymentMethodEnum.RAZORPAY, nullable=False)
    status = Column(Enum(PaymentStatusEnum), default=PaymentStatusEnum.PENDING, nullable=False, index=True)
    
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    
    transaction_id = Column(String(100), unique=True, index=True, nullable=True)
    gateway_order_id = Column(String(100), nullable=True)  # Razorpay order_id
    gateway_payment_id = Column(String(100), nullable=True)  # Razorpay payment_id
    gateway_signature = Column(String(255), nullable=True)  # Razorpay signature

    order = relationship("Order", back_populates="payment")


class Shipment(Base, TimestampMixin):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    carrier = Column(String(100), default="Bluedart Express", nullable=False)
    tracking_number = Column(String(100), unique=True, index=True, nullable=True)
    status = Column(Enum(ShipmentStatusEnum), default=ShipmentStatusEnum.LABEL_CREATED, nullable=False, index=True)
    
    estimated_delivery_at = Column(DateTime(timezone=True), nullable=True)
    shipped_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)

    order = relationship("Order", back_populates="shipment")
