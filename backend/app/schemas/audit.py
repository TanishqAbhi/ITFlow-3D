from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from app.models.user import UserRoleEnum
from app.models.audit import NotificationCategoryEnum


class ActivityLogResponse(BaseModel):
    id: int
    user_id: Optional[int]
    user_email: str
    user_role: UserRoleEnum
    action: str
    entity_type: str
    entity_id: Optional[str]
    previous_state: Optional[str]
    new_state: Optional[str]
    ip_address: Optional[str]
    user_agent: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True


class NotificationResponse(BaseModel):
    id: int
    recipient_id: Optional[int]
    recipient_role: Optional[UserRoleEnum]
    title: str
    message: str
    category: NotificationCategoryEnum
    link_url: Optional[str]
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AdminMetricsResponse(BaseModel):
    total_customers: int
    total_staff: int
    total_products: int
    active_products: int
    out_of_stock_products: int
    low_stock_products: int
    total_orders: int
    pending_orders: int
    completed_orders: int
    cancelled_orders: int
    total_revenue: float
    monthly_revenue: float
    inventory_valuation: float


class StaffPerformanceMetric(BaseModel):
    employee_id: str
    name: str
    department: str
    products_managed: int
    orders_processed: int
    performance_score: float


class AdminAnalyticsResponse(BaseModel):
    metrics: AdminMetricsResponse
    revenue_chart: List[Dict[str, Any]]  # month, revenue, orders
    category_sales: List[Dict[str, Any]] # category, sales, count
    top_products: List[Dict[str, Any]]   # name, sold_count, revenue
    staff_performance: List[StaffPerformanceMetric]
    recent_activities: List[ActivityLogResponse]
