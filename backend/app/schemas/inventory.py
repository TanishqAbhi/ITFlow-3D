from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.inventory import TransactionTypeEnum


class StockAdjustmentRequest(BaseModel):
    product_id: int
    quantity_delta: int  # e.g., +20 for restock or -5 for damage/shrinkage
    transaction_type: TransactionTypeEnum
    reason: str = Field(min_length=3, max_length=255)
    reference_id: Optional[str] = None


class InventoryResponse(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    quantity_available: int
    quantity_reserved: int
    total_quantity: int
    reorder_threshold: int
    is_low_stock: bool
    is_out_of_stock: bool
    last_restocked_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class InventoryTransactionResponse(BaseModel):
    id: int
    inventory_id: int
    product_id: int
    product_name: Optional[str] = None
    user_id: Optional[int] = None
    user_email: Optional[str] = None
    transaction_type: TransactionTypeEnum
    quantity_delta: int
    previous_quantity: int
    new_quantity: int
    reason: str
    reference_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
