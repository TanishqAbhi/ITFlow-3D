import pytest
from fastapi.testclient import TestClient


def test_health_check(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "ITFlow" in data["service"]


def test_auth_login_admin(client: TestClient):
    response = client.post("/api/v1/auth/login", json={
        "email": "admin@itflow3d.com",
        "password": "Admin@123456",
        "portal": "ADMIN"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "ADMIN"
    assert data["email"] == "admin@itflow3d.com"


def test_auth_login_staff(client: TestClient):
    response = client.post("/api/v1/auth/login", json={
        "email": "staff.john@itflow3d.com",
        "password": "Staff@123456",
        "portal": "STAFF"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "STAFF"


def test_auth_portal_isolation(client: TestClient):
    # Customer trying to login through ADMIN portal should fail
    response = client.post("/api/v1/auth/login", json={
        "email": "customer.alex@example.com",
        "password": "Customer@123456",
        "portal": "ADMIN"
    })
    assert response.status_code == 403


def test_rbac_admin_endpoint_forbidden_for_staff(client: TestClient):
    # Get staff token
    staff_login = client.post("/api/v1/auth/login", json={
        "email": "staff.john@itflow3d.com",
        "password": "Staff@123456"
    }).json()
    staff_token = staff_login["access_token"]

    # Try accessing admin-only staff management
    response = client.get(
        "/api/v1/admin/staff",
        headers={"Authorization": f"Bearer {staff_token}"}
    )
    assert response.status_code == 403


def test_rbac_admin_endpoint_success_for_admin(client: TestClient):
    admin_login = client.post("/api/v1/auth/login", json={
        "email": "admin@itflow3d.com",
        "password": "Admin@123456"
    }).json()
    admin_token = admin_login["access_token"]

    response = client.get(
        "/api/v1/admin/dashboard/metrics",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total_products"] > 0
    assert data["total_staff"] >= 2


def test_public_store_products(client: TestClient):
    response = client.get("/api/v1/store/products")
    assert response.status_code == 200
    products = response.json()
    assert len(products) > 0
    # Every storefront product must be published
    for p in products:
        assert p["status"] == "PUBLISHED"


def test_public_store_product_detail(client: TestClient):
    response = client.get("/api/v1/store/products/razer-blade-18-ultra-gaming-rig")
    assert response.status_code == 200
    product = response.json()
    assert product["name"] == "Razer Blade 18 Ultra Gaming Rig"
    assert product["model_3d_url"] is not None
    assert len(product["specifications"]) > 0


def test_staff_inventory_adjustment(client: TestClient):
    staff_login = client.post("/api/v1/auth/login", json={
        "email": "staff.john@itflow3d.com",
        "password": "Staff@123456"
    }).json()
    staff_token = staff_login["access_token"]

    # Adjust inventory
    response = client.post(
        "/api/v1/staff/inventory/adjust",
        headers={"Authorization": f"Bearer {staff_token}"},
        json={
            "product_id": 1,
            "quantity_delta": 5,
            "transaction_type": "STOCK_IN",
            "reason": "Replenishment batch test"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["quantity_available"] >= 5


def test_customer_cart_and_coupon(client: TestClient):
    cust_login = client.post("/api/v1/auth/login", json={
        "email": "customer.alex@example.com",
        "password": "Customer@123456"
    }).json()
    cust_token = cust_login["access_token"]

    # Add item to cart
    add_resp = client.post(
        "/api/v1/cart/items",
        headers={"Authorization": f"Bearer {cust_token}"},
        json={"product_id": 1, "quantity": 1}
    )
    assert add_resp.status_code == 200
    cart_data = add_resp.json()
    assert len(cart_data["items"]) > 0

    # Apply Coupon TECH10
    coupon_resp = client.post(
        "/api/v1/cart/apply-coupon",
        headers={"Authorization": f"Bearer {cust_token}"},
        json={"code": "TECH10", "cart_total": cart_data["subtotal"]}
    )
    assert coupon_resp.status_code == 200
    c_data = coupon_resp.json()
    assert c_data["is_valid"] is True
    assert c_data["discount_amount"] > 0


def test_order_checkout_lifecycle(client: TestClient):
    cust_login = client.post("/api/v1/auth/login", json={
        "email": "customer.alex@example.com",
        "password": "Customer@123456"
    }).json()
    cust_token = cust_login["access_token"]

    # 1. Initialize checkout
    init_resp = client.post(
        "/api/v1/orders/checkout/initialize",
        headers={"Authorization": f"Bearer {cust_token}"},
        json={
            "address_id": 1,
            "coupon_code": "TECH10",
            "notes": "Test automated delivery"
        }
    )
    assert init_resp.status_code == 200
    order_data = init_resp.json()
    assert "order_number" in order_data
    assert "razorpay_order_id" in order_data

    # 2. Verify payment
    verify_resp = client.post(
        "/api/v1/orders/checkout/verify",
        headers={"Authorization": f"Bearer {cust_token}"},
        json={
            "order_id": order_data["order_id"],
            "razorpay_order_id": order_data["razorpay_order_id"],
            "razorpay_payment_id": "pay_mock_test_12345",
            "razorpay_signature": "sig_mock_verified"
        }
    )
    assert verify_resp.status_code == 200
    confirmed = verify_resp.json()
    assert confirmed["order_status"] == "CONFIRMED"
