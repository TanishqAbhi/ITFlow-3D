from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, admin, staff, customer, orders, notifications, uploads
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & Profiles"])
api_router.include_router(admin.router, prefix="/admin", tags=["Super Admin Operations"])
api_router.include_router(staff.router, prefix="/staff", tags=["Staff Operations & Inventory"])
api_router.include_router(customer.router, prefix="", tags=["Customer Storefront"])
api_router.include_router(orders.router, prefix="/orders", tags=["Order Processing & Razorpay Checkout"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Real-Time Notifications"])
api_router.include_router(uploads.router, prefix="/upload", tags=["Media & 3D Model Storage"])
