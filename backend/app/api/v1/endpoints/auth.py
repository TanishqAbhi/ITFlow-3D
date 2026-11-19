from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token
from app.core.config import settings
from app.models.user import User, UserRoleEnum, CustomerProfile, RefreshToken
from app.models.order import Cart
from app.schemas.auth import LoginRequest, TokenResponse, TokenRefreshRequest, PasswordResetRequest, PasswordResetConfirm
from app.schemas.user import CustomerRegister, UserResponse
from app.services.audit_service import audit_service
from app.api.deps import get_current_user, get_client_ip

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(
    req: LoginRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been deactivated. Please contact support.",
        )

    if user.is_suspended:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account is suspended: {user.suspension_reason or 'Contact administrator.'}",
        )

    # Portal isolation enforcement
    if req.portal:
        portal_upper = req.portal.upper()
        if portal_upper == "ADMIN" and user.role != UserRoleEnum.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Admin credentials required for Super Admin Portal."
            )
        elif portal_upper == "STAFF" and user.role not in (UserRoleEnum.STAFF, UserRoleEnum.ADMIN):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Staff credentials required for Operations Portal."
            )

    # Generate Tokens
    token_data = {"sub": str(user.id), "email": user.email, "role": user.role.value}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    # Update last login
    user.last_login = datetime.now(timezone.utc)
    
    # Store refresh token record
    ref_record = RefreshToken(
        token=refresh_token,
        user_id=user.id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db.add(ref_record)
    db.commit()

    # Record Audit Log
    ip = get_client_ip(request)
    audit_service.record_activity(
        db=db,
        user=user,
        action="USER_LOGIN",
        entity_type="User",
        entity_id=str(user.id),
        new_state={"portal": req.portal, "role": user.role.value},
        ip_address=ip,
        user_agent=request.headers.get("User-Agent")
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role,
        is_active=user.is_active
    )


@router.post("/register", response_model=TokenResponse)
def register_customer(
    req: CustomerRegister,
    request: Request,
    db: Session = Depends(get_db)
):
    existing = db.query(User).filter(User.email == req.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    user = User(
        email=req.email.lower(),
        hashed_password=get_password_hash(req.password),
        first_name=req.first_name,
        last_name=req.last_name,
        phone=req.phone,
        role=UserRoleEnum.CUSTOMER,
        is_active=True,
        is_suspended=False,
    )
    db.add(user)
    db.flush()

    # Create customer profile and empty cart
    profile = CustomerProfile(user_id=user.id, loyalty_tier="Bronze")
    cart = Cart(user_id=user.id)
    db.add(profile)
    db.add(cart)

    token_data = {"sub": str(user.id), "email": user.email, "role": user.role.value}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    db.commit()

    # Audit log
    ip = get_client_ip(request)
    audit_service.record_activity(
        db=db,
        user=user,
        action="CUSTOMER_REGISTERED",
        entity_type="User",
        entity_id=str(user.id),
        new_state={"email": user.email, "name": f"{user.first_name} {user.last_name}"},
        ip_address=ip,
        user_agent=request.headers.get("User-Agent")
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role,
        is_active=user.is_active
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(
    req: TokenRefreshRequest,
    db: Session = Depends(get_db)
):
    payload = decode_token(req.refresh_token, secret_key=settings.REFRESH_SECRET_KEY)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active or user.is_suspended:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive or suspended",
        )

    # Issue new token pair
    token_data = {"sub": str(user.id), "email": user.email, "role": user.role.value}
    new_access_token = create_access_token(token_data)
    new_refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role,
        is_active=user.is_active
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    return current_user


@router.post("/logout")
def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ip = get_client_ip(request)
    audit_service.record_activity(
        db=db,
        user=current_user,
        action="USER_LOGOUT",
        entity_type="User",
        entity_id=str(current_user.id),
        ip_address=ip,
        user_agent=request.headers.get("User-Agent")
    )
    return {"message": "Successfully logged out"}
