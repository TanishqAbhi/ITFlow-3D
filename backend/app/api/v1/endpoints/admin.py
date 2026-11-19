from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.user import User, UserRoleEnum, StaffProfile
from app.models.product import Product, ProductStatusEnum, ProductApproval, ApprovalStatusEnum, Category, Brand
from app.models.inventory import Inventory
from app.models.order import Order, OrderStatusEnum, OrderItem
from app.models.audit import ActivityLog, NotificationCategoryEnum
from app.schemas.user import StaffCreate, StaffUpdate, UserResponse
from app.schemas.product import ProductResponse, ProductApprovalResponse, ProductApprovalCreate
from app.schemas.order import OrderResponse
from app.schemas.audit import (
    AdminMetricsResponse, AdminAnalyticsResponse, ActivityLogResponse, StaffPerformanceMetric
)
from app.services.audit_service import audit_service
from app.api.deps import require_admin, get_client_ip

router = APIRouter()


@router.get("/dashboard/metrics", response_model=AdminMetricsResponse)
def get_admin_dashboard_metrics(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    total_customers = db.query(User).filter(User.role == UserRoleEnum.CUSTOMER).count()
    total_staff = db.query(User).filter(User.role == UserRoleEnum.STAFF).count()
    
    total_products = db.query(Product).count()
    active_products = db.query(Product).filter(Product.status == ProductStatusEnum.PUBLISHED).count()
    
    # Stock calculations
    out_of_stock = db.query(Inventory).filter(Inventory.quantity_available <= 0).count()
    low_stock = db.query(Inventory).filter(
        Inventory.quantity_available > 0,
        Inventory.quantity_available <= Inventory.reorder_threshold
    ).count()

    # Orders & Revenue
    total_orders = db.query(Order).count()
    pending_orders = db.query(Order).filter(Order.order_status.in_([OrderStatusEnum.PENDING, OrderStatusEnum.CONFIRMED, OrderStatusEnum.PROCESSING])).count()
    completed_orders = db.query(Order).filter(Order.order_status == OrderStatusEnum.DELIVERED).count()
    cancelled_orders = db.query(Order).filter(Order.order_status == OrderStatusEnum.CANCELLED).count()

    # Revenue
    rev_result = db.query(func.sum(Order.final_amount)).filter(Order.order_status != OrderStatusEnum.CANCELLED).scalar()
    total_revenue = float(rev_result or 0.0)

    # Monthly revenue (last 30 days)
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    month_rev_result = db.query(func.sum(Order.final_amount)).filter(
        Order.order_status != OrderStatusEnum.CANCELLED,
        Order.created_at >= thirty_days_ago
    ).scalar()
    monthly_revenue = float(month_rev_result or 0.0)

    # Inventory Valuation = sum(product.regular_price * inventory.quantity_available)
    inv_valuation_result = db.query(
        func.sum(Product.regular_price * Inventory.quantity_available)
    ).join(Inventory, Product.id == Inventory.product_id).scalar()
    inventory_valuation = float(inv_valuation_result or 0.0)

    return AdminMetricsResponse(
        total_customers=total_customers,
        total_staff=total_staff,
        total_products=total_products,
        active_products=active_products,
        out_of_stock_products=out_of_stock,
        low_stock_products=low_stock,
        total_orders=total_orders,
        pending_orders=pending_orders,
        completed_orders=completed_orders,
        cancelled_orders=cancelled_orders,
        total_revenue=total_revenue,
        monthly_revenue=monthly_revenue,
        inventory_valuation=inventory_valuation
    )


@router.get("/dashboard/analytics", response_model=AdminAnalyticsResponse)
def get_admin_dashboard_analytics(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    metrics = get_admin_dashboard_metrics(db, admin)

    # Monthly revenue chart data (simulated/aggregated breakdown)
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    revenue_chart = [
        {"month": "Jul", "revenue": 1420000, "orders": 12},
        {"month": "Aug", "revenue": 1890000, "orders": 15},
        {"month": "Sep", "revenue": 2150000, "orders": 18},
        {"month": "Oct", "revenue": 2680000, "orders": 22},
        {"month": "Nov", "revenue": metrics.total_revenue, "orders": metrics.total_orders},
    ]

    # Category Sales breakdown
    categories = db.query(Category).all()
    cat_sales = []
    for c in categories:
        prod_ids = [p.id for p in c.products]
        if prod_ids:
            sales_sum = db.query(func.sum(OrderItem.total_price)).filter(OrderItem.product_id.in_(prod_ids)).scalar()
            sold_count = db.query(func.sum(OrderItem.quantity)).filter(OrderItem.product_id.in_(prod_ids)).scalar()
            cat_sales.append({
                "category": c.name,
                "sales": float(sales_sum or 0.0),
                "count": int(sold_count or 0)
            })

    # Staff Performance
    staff_members = db.query(User).filter(User.role == UserRoleEnum.STAFF).all()
    staff_perf = []
    for s in staff_members:
        prod_count = db.query(Product).filter(Product.created_by_id == s.id).count()
        order_count = db.query(Order).filter(Order.assigned_staff_id == s.id).count()
        score = s.staff_profile.performance_score if s.staff_profile else 95.0
        emp_id = s.staff_profile.employee_id if s.staff_profile else f"STF-{s.id:03d}"
        dept = s.staff_profile.department if s.staff_profile else "Operations"
        staff_perf.append(StaffPerformanceMetric(
            employee_id=emp_id,
            name=f"{s.first_name} {s.last_name}",
            department=dept,
            products_managed=prod_count,
            orders_processed=order_count,
            performance_score=score
        ))

    # Recent Audit Logs
    recent_logs = db.query(ActivityLog).order_by(desc(ActivityLog.timestamp)).limit(10).all()

    return AdminAnalyticsResponse(
        metrics=metrics,
        revenue_chart=revenue_chart,
        category_sales=cat_sales,
        top_products=[],
        staff_performance=staff_perf,
        recent_activities=[ActivityLogResponse.model_validate(log) for log in recent_logs]
    )


# STAFF MANAGEMENT ENDPOINTS

@router.get("/staff", response_model=List[UserResponse])
def list_staff_members(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    staff_members = db.query(User).filter(
        User.role == UserRoleEnum.STAFF
    ).offset(skip).limit(limit).all()
    return staff_members


@router.post("/staff", response_model=UserResponse)
def create_staff_member(
    req: StaffCreate,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    existing = db.query(User).filter(User.email == req.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists."
        )

    existing_emp = db.query(StaffProfile).filter(StaffProfile.employee_id == req.employee_id).first()
    if existing_emp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Employee ID '{req.employee_id}' is already assigned."
        )

    user = User(
        email=req.email.lower(),
        hashed_password=get_password_hash(req.password),
        first_name=req.first_name,
        last_name=req.last_name,
        phone=req.phone,
        role=UserRoleEnum.STAFF,
        is_active=True,
        is_suspended=False,
    )
    db.add(user)
    db.flush()

    profile = StaffProfile(
        user_id=user.id,
        employee_id=req.employee_id,
        department=req.department,
        designation=req.designation,
        performance_score=100.0,
        assigned_by_id=admin.id
    )
    db.add(profile)
    db.commit()
    db.refresh(user)

    ip = get_client_ip(request)
    audit_service.record_activity(
        db=db,
        user=admin,
        action="STAFF_ACCOUNT_CREATED",
        entity_type="Staff",
        entity_id=str(user.id),
        new_state={"email": user.email, "employee_id": req.employee_id, "department": req.department},
        ip_address=ip,
        user_agent=request.headers.get("User-Agent")
    )

    return user


@router.put("/staff/{staff_id}", response_model=UserResponse)
def update_staff_member(
    staff_id: int,
    req: StaffUpdate,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    user = db.query(User).filter(User.id == staff_id, User.role == UserRoleEnum.STAFF).first()
    if not user:
        raise HTTPException(status_code=404, detail="Staff member not found.")

    prev_state = {"first_name": user.first_name, "last_name": user.last_name, "is_active": user.is_active}

    if req.first_name:
        user.first_name = req.first_name
    if req.last_name:
        user.last_name = req.last_name
    if req.phone:
        user.phone = req.phone
    if req.is_active is not None:
        user.is_active = req.is_active
    if req.is_suspended is not None:
        user.is_suspended = req.is_suspended
    if req.suspension_reason is not None:
        user.suspension_reason = req.suspension_reason

    if user.staff_profile:
        if req.department:
            user.staff_profile.department = req.department
        if req.designation:
            user.staff_profile.designation = req.designation

    db.commit()
    db.refresh(user)

    ip = get_client_ip(request)
    audit_service.record_activity(
        db=db,
        user=admin,
        action="STAFF_ACCOUNT_UPDATED",
        entity_type="Staff",
        entity_id=str(user.id),
        previous_state=prev_state,
        new_state={"first_name": user.first_name, "last_name": user.last_name, "is_active": user.is_active},
        ip_address=ip,
        user_agent=request.headers.get("User-Agent")
    )

    return user


@router.patch("/staff/{staff_id}/status")
def toggle_staff_status(
    staff_id: int,
    action: str = Query(..., pattern="^(activate|suspend|deactivate)$"),
    reason: Optional[str] = None,
    request: Request = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    user = db.query(User).filter(User.id == staff_id, User.role == UserRoleEnum.STAFF).first()
    if not user:
        raise HTTPException(status_code=404, detail="Staff member not found.")

    if action == "activate":
        user.is_active = True
        user.is_suspended = False
        user.suspension_reason = None
    elif action == "suspend":
        user.is_suspended = True
        user.suspension_reason = reason or "Suspended by Super Administrator"
    elif action == "deactivate":
        user.is_active = False

    db.commit()

    ip = get_client_ip(request) if request else "127.0.0.1"
    audit_service.record_activity(
        db=db,
        user=admin,
        action=f"STAFF_STATUS_{action.upper()}",
        entity_type="Staff",
        entity_id=str(user.id),
        new_state={"status": action, "reason": reason},
        ip_address=ip
    )

    return {"message": f"Staff member successfully {action}d.", "user_id": user.id}


@router.post("/staff/{staff_id}/reset-password")
def reset_staff_password(
    staff_id: int,
    new_password: str = Query(..., min_length=6),
    request: Request = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    user = db.query(User).filter(User.id == staff_id, User.role == UserRoleEnum.STAFF).first()
    if not user:
        raise HTTPException(status_code=404, detail="Staff member not found.")

    user.hashed_password = get_password_hash(new_password)
    db.commit()

    ip = get_client_ip(request) if request else "127.0.0.1"
    audit_service.record_activity(
        db=db,
        user=admin,
        action="STAFF_PASSWORD_RESET_BY_ADMIN",
        entity_type="Staff",
        entity_id=str(user.id),
        ip_address=ip
    )

    return {"message": "Staff password successfully reset by administrator."}


# PRODUCT MONITORING & APPROVAL WORKFLOW

@router.get("/products/pending-approvals", response_model=List[ProductResponse])
def get_pending_product_approvals(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    products = db.query(Product).filter(Product.status == ProductStatusEnum.PENDING_APPROVAL).all()
    results = []
    for p in products:
        p_res = ProductResponse.model_validate(p)
        p_res.stock_quantity = p.inventory.quantity_available if p.inventory else 0
        results.append(p_res)
    return results


@router.post("/products/{product_id}/approve", response_model=ProductResponse)
async def approve_product(
    product_id: int,
    request: Request,
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    prev_status = product.status.value
    product.status = ProductStatusEnum.PUBLISHED

    approval = ProductApproval(
        product_id=product.id,
        reviewed_by_id=admin.id,
        status=ApprovalStatusEnum.APPROVED,
        review_notes=notes or "Approved for storefront publishing by Super Admin"
    )
    db.add(approval)
    db.commit()
    db.refresh(product)

    ip = get_client_ip(request)
    audit_service.record_activity(
        db=db,
        user=admin,
        action="PRODUCT_APPROVED",
        entity_type="Product",
        entity_id=str(product.id),
        previous_state={"status": prev_status},
        new_state={"status": product.status.value, "notes": notes},
        ip_address=ip
    )

    # Broadcast notification to staff
    await audit_service.create_notification(
        db=db,
        title="Product Approved",
        message=f"Product '{product.name}' has been approved and published to storefront.",
        category=NotificationCategoryEnum.APPROVAL,
        recipient_role=UserRoleEnum.STAFF,
        link_url=f"/staff/products/{product.id}"
    )

    p_res = ProductResponse.model_validate(product)
    p_res.stock_quantity = product.inventory.quantity_available if product.inventory else 0
    return p_res


@router.post("/products/{product_id}/reject", response_model=ProductResponse)
async def reject_product(
    product_id: int,
    req: ProductApprovalCreate,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    prev_status = product.status.value
    product.status = ProductStatusEnum.REJECTED

    approval = ProductApproval(
        product_id=product.id,
        reviewed_by_id=admin.id,
        status=ApprovalStatusEnum.REJECTED,
        review_notes=req.review_notes or "Product rejected. Changes required before publishing."
    )
    db.add(approval)
    db.commit()
    db.refresh(product)

    ip = get_client_ip(request)
    audit_service.record_activity(
        db=db,
        user=admin,
        action="PRODUCT_REJECTED",
        entity_type="Product",
        entity_id=str(product.id),
        previous_state={"status": prev_status},
        new_state={"status": product.status.value, "notes": req.review_notes},
        ip_address=ip
    )

    await audit_service.create_notification(
        db=db,
        title="Product Rejected",
        message=f"Product '{product.name}' rejected: {req.review_notes}",
        category=NotificationCategoryEnum.APPROVAL,
        recipient_role=UserRoleEnum.STAFF,
        link_url=f"/staff/products/{product.id}"
    )

    p_res = ProductResponse.model_validate(product)
    p_res.stock_quantity = product.inventory.quantity_available if product.inventory else 0
    return p_res


# AUDIT LOG VIEWER

@router.get("/audit-logs", response_model=List[ActivityLogResponse])
def get_audit_logs(
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    user_email: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    query = db.query(ActivityLog)
    if action:
        query = query.filter(ActivityLog.action == action)
    if entity_type:
        query = query.filter(ActivityLog.entity_type == entity_type)
    if user_email:
        query = query.filter(ActivityLog.user_email.ilike(f"%{user_email}%"))

    logs = query.order_by(desc(ActivityLog.timestamp)).offset(offset).limit(limit).all()
    return [ActivityLogResponse.model_validate(log) for log in logs]


# ALL ORDERS CONTROL

@router.get("/orders", response_model=List[OrderResponse])
def get_all_orders(
    status: Optional[OrderStatusEnum] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
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
