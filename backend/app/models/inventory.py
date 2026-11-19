import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, Enum, Text
)
from sqlalchemy.orm import relationship
from app.core.database import Base, TimestampMixin


class TransactionTypeEnum(str, enum.Enum):
    STOCK_IN = "STOCK_IN"
    STOCK_OUT = "STOCK_OUT"
    SALE_DEDUCT = "SALE_DEDUCT"
    RETURN_ADD = "RETURN_ADD"
    ADJUSTMENT = "ADJUSTMENT"


class Inventory(Base, TimestampMixin):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    quantity_available = Column(Integer, default=0, nullable=False)
    quantity_reserved = Column(Integer, default=0, nullable=False)
    reorder_threshold = Column(Integer, default=5, nullable=False)
    last_restocked_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    product = relationship("Product", back_populates="inventory")
    transactions = relationship("InventoryTransaction", back_populates="inventory", cascade="all, delete-orphan", order_by="desc(InventoryTransaction.created_at)")

    @property
    def total_quantity(self) -> int:
        return self.quantity_available + self.quantity_reserved

    @property
    def is_low_stock(self) -> bool:
        return self.quantity_available <= self.reorder_threshold

    @property
    def is_out_of_stock(self) -> bool:
        return self.quantity_available <= 0


class InventoryTransaction(Base, TimestampMixin):
    __tablename__ = "inventory_transactions"

    id = Column(Integer, primary_key=True, index=True)
    inventory_id = Column(Integer, ForeignKey("inventory.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    transaction_type = Column(Enum(TransactionTypeEnum), nullable=False, index=True)
    quantity_delta = Column(Integer, nullable=False)  # e.g., +10 or -3
    previous_quantity = Column(Integer, nullable=False)
    new_quantity = Column(Integer, nullable=False)
    reason = Column(String(255), nullable=False)
    reference_id = Column(String(100), nullable=True)  # Order ID, Purchase Order, etc.

    inventory = relationship("Inventory", back_populates="transactions")
    product = relationship("Product")
    user = relationship("User")
