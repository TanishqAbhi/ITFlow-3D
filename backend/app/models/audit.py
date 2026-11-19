import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, Text
)
from sqlalchemy.orm import relationship
from app.core.database import Base, TimestampMixin
from app.models.user import UserRoleEnum


class NotificationCategoryEnum(str, enum.Enum):
    ORDER = "ORDER"
    INVENTORY = "INVENTORY"
    APPROVAL = "APPROVAL"
    SYSTEM = "SYSTEM"


class ActivityLog(Base):
    """
    Append-only audit trail tracking administrative, staff, and customer actions.
    Records who did what, when, to which entity, along with before and after state diffs.
    """
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    user_email = Column(String(255), nullable=False)
    user_role = Column(Enum(UserRoleEnum), nullable=False, index=True)
    
    action = Column(String(100), nullable=False, index=True)  # e.g., "STAFF_CREATED", "STOCK_ADJUSTED", "PRODUCT_APPROVED"
    entity_type = Column(String(50), nullable=False, index=True)  # e.g., "Product", "User", "Inventory", "Order"
    entity_id = Column(String(100), nullable=True)
    
    previous_state = Column(Text, nullable=True)  # JSON serialized previous attributes
    new_state = Column(Text, nullable=True)       # JSON serialized new attributes
    
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(255), nullable=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    user = relationship("User", back_populates="activity_logs")


class Notification(Base, TimestampMixin):
    """Real-time user & role-targeted notification alerts."""
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    recipient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)  # Null = Broadcast to role
    recipient_role = Column(Enum(UserRoleEnum), nullable=True, index=True)                      # Role target if recipient_id is None
    
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    category = Column(Enum(NotificationCategoryEnum), default=NotificationCategoryEnum.SYSTEM, nullable=False)
    link_url = Column(String(255), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False, index=True)

    recipient = relationship("User", back_populates="notifications")
