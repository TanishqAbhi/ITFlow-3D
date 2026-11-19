from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models import User, Role, UserRoleEnum

db = SessionLocal()

try:
    email = "admin@itflow3d.com"

    existing_user = db.query(User).filter(User.email == email).first()

    if existing_user:
        print("Admin account already exists. No changes made.")
    else:
        admin_role = db.query(Role).filter(
            Role.name == UserRoleEnum.ADMIN.value
        ).first()

        if not admin_role:
            admin_role = Role(
                name=UserRoleEnum.ADMIN.value,
                description="Full Platform Owner & Super Administrator",
                is_system_role=True
            )
            db.add(admin_role)
            db.flush()

        admin_user = User(
            email=email,
            hashed_password=get_password_hash("Admin@123456"),
            first_name="Super",
            last_name="Admin",
            role=UserRoleEnum.ADMIN,
            role_id=admin_role.id,
            is_active=True,
            is_suspended=False
        )

        db.add(admin_user)
        db.commit()

        print("SUCCESS: Super Admin account created!")

except Exception as e:
    db.rollback()
    print("ERROR:", str(e))

finally:
    db.close()
