import os
import sys
from datetime import datetime, timezone, timedelta

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import engine, Base, SessionLocal
from app.core.security import get_password_hash
from app.models import (
    User, Role, Permission, UserRoleEnum, StaffProfile, CustomerProfile,
    Category, Brand, Product, ProductImage, ProductSpecification, ProductApproval,
    ProductStatusEnum, ApprovalStatusEnum,
    Inventory, InventoryTransaction, TransactionTypeEnum,
    Address, AddressTypeEnum, Cart, CartItem, Wishlist, Coupon, DiscountTypeEnum,
    Order, OrderItem, OrderStatusEnum, Payment, PaymentMethodEnum, PaymentStatusEnum,
    Shipment, ShipmentStatusEnum, Review, ActivityLog, Notification, NotificationCategoryEnum
)


def seed_database():
    print("🚀 Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).filter(User.email == "admin@itflow3d.com").first():
            print("ℹ️ Database is already seeded. Skipping initial seed.")
            return

        print("📦 Seeding Roles & Permissions...")
        roles_dict = {}
        for role_name, desc in [
            (UserRoleEnum.ADMIN, "Full Platform Owner & Super Administrator"),
            (UserRoleEnum.STAFF, "Operations & Catalog Specialist"),
            (UserRoleEnum.CUSTOMER, "Verified Storefront Consumer"),
        ]:
            role = Role(name=role_name.value, description=desc, is_system_role=True)
            db.add(role)
            db.flush()
            roles_dict[role_name] = role

        permissions_list = [
            ("product:create", "Product", "Add new products"),
            ("product:edit", "Product", "Edit existing products"),
            ("product:delete", "Product", "Delete or archive products"),
            ("product:approve", "Product", "Approve or reject staff product submissions"),
            ("inventory:adjust", "Inventory", "Perform stock-in/out adjustments"),
            ("order:process", "Order", "Update order workflow and tracking"),
            ("staff:manage", "Staff", "Create and manage staff accounts"),
            ("audit:view", "Audit", "View immutable audit logs"),
        ]
        created_perms = []
        for code, cat, desc in permissions_list:
            perm = Permission(code=code, category=cat, description=desc)
            db.add(perm)
            db.flush()
            created_perms.append(perm)

        # Grant all to Admin, operational to Staff
        roles_dict[UserRoleEnum.ADMIN].permissions.extend(created_perms)
        staff_perms = [p for p in created_perms if not p.code.startswith(("product:approve", "staff:manage", "audit:view"))]
        roles_dict[UserRoleEnum.STAFF].permissions.extend(staff_perms)
        db.commit()

        print("👤 Seeding System Users (Admin, Staff, Customers)...")
        # Super Admin
        admin_user = User(
            email="admin@itflow3d.com",
            hashed_password=get_password_hash("Admin@123456"),
            first_name="Super",
            last_name="Admin",
            phone="+91 9876543210",
            role=UserRoleEnum.ADMIN,
            role_id=roles_dict[UserRoleEnum.ADMIN].id,
            is_active=True,
            is_suspended=False,
            last_login=datetime.now(timezone.utc)
        )
        db.add(admin_user)
        db.flush()

        # Staff 1: John (Catalog)
        staff_john = User(
            email="staff.john@itflow3d.com",
            hashed_password=get_password_hash("Staff@123456"),
            first_name="John",
            last_name="Doe",
            phone="+91 9876543211",
            role=UserRoleEnum.STAFF,
            role_id=roles_dict[UserRoleEnum.STAFF].id,
            is_active=True,
            is_suspended=False,
            last_login=datetime.now(timezone.utc)
        )
        db.add(staff_john)
        db.flush()
        staff_john_profile = StaffProfile(
            user_id=staff_john.id,
            employee_id="ITF-STF-001",
            department="Hardware & Systems",
            designation="Senior Catalog Specialist",
            performance_score=98.5,
            assigned_by_id=admin_user.id
        )
        db.add(staff_john_profile)

        # Staff 2: Sarah (Inventory & Logistics)
        staff_sarah = User(
            email="staff.sarah@itflow3d.com",
            hashed_password=get_password_hash("Staff@123456"),
            first_name="Sarah",
            last_name="Connor",
            phone="+91 9876543212",
            role=UserRoleEnum.STAFF,
            role_id=roles_dict[UserRoleEnum.STAFF].id,
            is_active=True,
            is_suspended=False,
            last_login=datetime.now(timezone.utc)
        )
        db.add(staff_sarah)
        db.flush()
        staff_sarah_profile = StaffProfile(
            user_id=staff_sarah.id,
            employee_id="ITF-STF-002",
            department="Fulfillment & Operations",
            designation="Logistics Supervisor",
            performance_score=96.0,
            assigned_by_id=admin_user.id
        )
        db.add(staff_sarah_profile)

        # Customer 1: Alex
        customer_alex = User(
            email="customer.alex@example.com",
            hashed_password=get_password_hash("Customer@123456"),
            first_name="Alex",
            last_name="Vance",
            phone="+91 9123456789",
            role=UserRoleEnum.CUSTOMER,
            role_id=roles_dict[UserRoleEnum.CUSTOMER].id,
            is_active=True,
            is_suspended=False,
            last_login=datetime.now(timezone.utc)
        )
        db.add(customer_alex)
        db.flush()
        cust_alex_profile = CustomerProfile(
            user_id=customer_alex.id,
            loyalty_tier="Gold",
            total_spent=579998.0,
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
        )
        db.add(cust_alex_profile)

        # Customer 2: Maya
        customer_maya = User(
            email="customer.maya@example.com",
            hashed_password=get_password_hash("Customer@123456"),
            first_name="Maya",
            last_name="Lin",
            phone="+91 9123456790",
            role=UserRoleEnum.CUSTOMER,
            role_id=roles_dict[UserRoleEnum.CUSTOMER].id,
            is_active=True,
            is_suspended=False,
            last_login=datetime.now(timezone.utc)
        )
        db.add(customer_maya)
        db.flush()
        cust_maya_profile = CustomerProfile(
            user_id=customer_maya.id,
            loyalty_tier="Platinum",
            total_spent=724890.0,
            avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
        )
        db.add(cust_maya_profile)

        # Addresses for customer Alex
        addr_alex = Address(
            user_id=customer_alex.id,
            full_name="Alex Vance",
            phone="+91 9123456789",
            street_address="402 Cyber Heights, Tech Boulevard, BKC",
            city="Mumbai",
            state="Maharashtra",
            postal_code="400051",
            country="India",
            is_default=True,
            address_type=AddressTypeEnum.SHIPPING
        )
        db.add(addr_alex)
        db.flush()

        print("🏷️ Seeding Categories & Brands...")
        categories_data = [
            ("Laptops", "laptops", "High-performance ultrabooks, creator rigs, and gaming laptops", "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80", "Laptop"),
            ("Desktops", "desktops", "Enterprise workstations and custom liquid-cooled battlestations", "https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=600&q=80", "Monitor"),
            ("Smartphones", "smartphones", "Flagship titanium smartphones and foldable next-gen handsets", "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80", "Smartphone"),
            ("Monitors", "monitors", "Ultrawide OLED curved displays and color-accurate creator screens", "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80", "Tv"),
            ("Keyboards", "keyboards", "Custom mechanical keyboards with hot-swappable switches", "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80", "Keyboard"),
            ("Headphones", "headphones", "Audiophile studio headphones and wireless active noise-cancelling gear", "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80", "Headphones"),
            ("Gaming Accessories", "gaming-accessories", "Precision esports mice, flight sticks, and streaming controllers", "https://images.unsplash.com/photo-1612287232258-2940e4f3a4b9?auto=format&fit=crop&w=600&q=80", "Gamepad2"),
            ("Computer Components", "computer-components", "Next-gen GPUs, liquid coolers, and PCIe Gen5 NVMe drives", "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=600&q=80", "Cpu"),
            ("Networking Devices", "networking-devices", "Wi-Fi 7 mesh routers, 10GbE switches, and enterprise firewalls", "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80", "Wifi"),
            ("Tablets", "tablets", "Pro-grade stylus tablets for digital artists and executives", "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80", "Tablet"),
            ("Smart Gadgets", "smart-gadgets", "Cyberpunk ambient lighting, smart rings, and home automation", "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=600&q=80", "Zap"),
        ]
        cat_map = {}
        for name, slug, desc, img, icon in categories_data:
            cat = Category(name=name, slug=slug, description=desc, image_url=img, icon=icon, is_active=True)
            db.add(cat)
            db.flush()
            cat_map[slug] = cat

        brands_data = [
            ("Razer", "razer", "https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Razer_Inc_logo.svg/300px-Razer_Inc_logo.svg.png", "https://www.razer.com"),
            ("Apple", "apple", "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/200px-Apple_logo_black.svg.png", "https://www.apple.com"),
            ("ASUS ROG", "asus-rog", "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/ASUS_Logo.svg/300px-ASUS_Logo.svg.png", "https://rog.asus.com"),
            ("Dell Alienware", "alienware", "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Alienware_logo.svg/300px-Alienware_logo.svg.png", "https://www.alienware.com"),
            ("Corsair", "corsair", "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Corsair_Components_logo.svg/300px-Corsair_Components_logo.svg.png", "https://www.corsair.com"),
            ("Logitech", "logitech", "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Logitech_logo.svg/300px-Logitech_logo.svg.png", "https://www.logitech.com"),
            ("Samsung", "samsung", "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Samsung_Logo.svg/300px-Samsung_Logo.svg.png", "https://www.samsung.com"),
            ("Sony", "sony", "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Sony_logo.svg/300px-Sony_logo.svg.png", "https://www.sony.com"),
            ("NVIDIA", "nvidia", "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Nvidia_logo.svg/300px-Nvidia_logo.svg.png", "https://www.nvidia.com"),
        ]
        brand_map = {}
        for name, slug, logo, web in brands_data:
            brand = Brand(name=name, slug=slug, logo_url=logo, website=web, is_active=True)
            db.add(brand)
            db.flush()
            brand_map[slug] = brand

        print("💻 Seeding Products, 3D Assets, Specs & Inventory...")
        products_seed = [
            {
                "name": "Razer Blade 18 Ultra Gaming Rig",
                "slug": "razer-blade-18-ultra-gaming-rig",
                "sku": "RZ-BLD18-2026",
                "brand": "razer",
                "category": "laptops",
                "short_description": "18-inch 4K 200Hz Dual-Mode Mini-LED display with Intel Core i9-14900HX and RTX 4090.",
                "description": "Experience uncompromised desktop-grade performance engineered into a sleek anodized aluminum unibody. Featuring the revolutionary 18-inch 4K Dual-Mode display, per-key RGB Chroma keyboard, patented vapor chamber cooling, and audiophile THX spatial audio.",
                "regular_price": 389999.0,
                "discount_price": 359999.0,
                "status": ProductStatusEnum.PUBLISHED,
                "model_3d_url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb",
                "is_featured": True,
                "is_trending": True,
                "stock": 14,
                "reorder": 3,
                "images": [
                    ("https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1000&q=80", True, 0),
                    ("https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1000&q=80", False, 1),
                ],
                "specs": [
                    ("Processor", "Intel Core i9-14900HX (24 Cores, 32 Threads, up to 5.8 GHz)", "Performance"),
                    ("Graphics", "NVIDIA GeForce RTX 4090 (16GB GDDR6 VRAM, 175W TGP)", "Performance"),
                    ("Memory", "64GB Dual-Channel DDR5 5600MHz", "Memory & Storage"),
                    ("Storage", "4TB PCIe Gen4 NVMe M.2 SSD", "Memory & Storage"),
                    ("Display", "18.0\" UHD+ (3840 x 2400) 200Hz Mini-LED 100% DCI-P3", "Display"),
                ]
            },
            {
                "name": "Apple MacBook Pro 16\" M3 Max",
                "slug": "apple-macbook-pro-16-m3-max",
                "sku": "APL-MBP16-M3X",
                "brand": "apple",
                "category": "laptops",
                "short_description": "Liquid Retina XDR, Space Black, 16-Core CPU, 40-Core GPU, 128GB Unified Memory.",
                "description": "Mind-blowing performance for extreme creative workflows. With up to 22 hours of battery life, hardware-accelerated ray tracing, Studio-quality mics, and a breathtaking Extreme Dynamic Range Liquid Retina display.",
                "regular_price": 399900.0,
                "discount_price": 379900.0,
                "status": ProductStatusEnum.PUBLISHED,
                "model_3d_url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoomBox/glTF-Binary/BoomBox.glb",
                "is_featured": True,
                "is_trending": True,
                "stock": 8,
                "reorder": 2,
                "images": [
                    ("https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80", True, 0),
                    ("https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=1000&q=80", False, 1),
                ],
                "specs": [
                    ("Processor", "Apple M3 Max chip (16-core CPU, 12 performance cores)", "Performance"),
                    ("Graphics", "40-core GPU with hardware ray tracing", "Performance"),
                    ("Unified Memory", "128GB Unified Memory", "Memory & Storage"),
                    ("Storage", "2TB High-Speed SSD", "Memory & Storage"),
                    ("Display", "16.2\" Liquid Retina XDR display (3456 x 2234), 1600 nits peak", "Display"),
                ]
            },
            {
                "name": "Alienware Aurora R16 Liquid Cooled Battlestation",
                "slug": "alienware-aurora-r16-battlestation",
                "sku": "AW-AUR16-LQD",
                "brand": "alienware",
                "category": "desktops",
                "short_description": "Intel Core i9-14900KF, RTX 4090 24GB, 64GB DDR5, 240mm Liquid Cooling.",
                "description": "Engineered with the Legend 3 design language, optimized acoustic performance, up to 20% quieter operation, and exceptional thermal airflow designed for elite 4K competitive gaming.",
                "regular_price": 329999.0,
                "discount_price": 299999.0,
                "status": ProductStatusEnum.PUBLISHED,
                "model_3d_url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Lantern/glTF-Binary/Lantern.glb",
                "is_featured": True,
                "is_trending": False,
                "stock": 5,
                "reorder": 2,
                "images": [
                    ("https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=1000&q=80", True, 0),
                ],
                "specs": [
                    ("Processor", "Intel Core i9-14900KF (Liquid Cooled)", "Performance"),
                    ("Graphics Card", "NVIDIA GeForce RTX 4090 24GB GDDR6X", "Performance"),
                    ("Power Supply", "1000W Platinum Modular PSU", "Power"),
                    ("Storage", "4TB (2x 2TB NVMe PCIe 4.0 SSD)", "Storage"),
                ]
            },
            {
                "name": "Samsung Odyssey Neo G9 49\" Curved Gaming Monitor",
                "slug": "samsung-odyssey-neo-g9-49",
                "sku": "SAM-ODYSSEY-G9-49",
                "brand": "samsung",
                "category": "monitors",
                "short_description": "Dual QHD (5120x1440), 240Hz, 1ms, 1000R Curvature, Quantum Mini-LED.",
                "description": "Spellbinding visual quality with Quantum Matrix technology, HDR2000 brightness, and a radical 1000R curved ultra-wide panoramic panel matching the human eye contour.",
                "regular_price": 179999.0,
                "discount_price": 154999.0,
                "status": ProductStatusEnum.PUBLISHED,
                "model_3d_url": None,
                "is_featured": True,
                "is_trending": True,
                "stock": 9,
                "reorder": 3,
                "images": [
                    ("https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1000&q=80", True, 0),
                ],
                "specs": [
                    ("Screen Size", "49 Inch Ultrawide 32:9", "Display"),
                    ("Resolution", "Dual QHD (5,120 x 1,440)", "Display"),
                    ("Refresh Rate", "240Hz with 1ms GtG Response", "Gaming"),
                    ("HDR", "Quantum HDR 2000", "Display"),
                ]
            },
            {
                "name": "NVIDIA GeForce RTX 4090 Founders Edition",
                "slug": "nvidia-geforce-rtx-4090-fe",
                "sku": "NV-RTX4090-FE24",
                "brand": "nvidia",
                "category": "computer-components",
                "short_description": "24GB GDDR6X, Ada Lovelace Architecture, 3rd Gen RT Cores, DLSS 3.5.",
                "description": "The ultimate GeForce GPU delivering quantum leaps in performance, efficiency, and AI-powered graphics. Render hyper-realistic ray-traced virtual worlds with unprecedented frame rates.",
                "regular_price": 199999.0,
                "discount_price": 184999.0,
                "status": ProductStatusEnum.PUBLISHED,
                "model_3d_url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb",
                "is_featured": True,
                "is_trending": True,
                "stock": 6,
                "reorder": 2,
                "images": [
                    ("https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=1000&q=80", True, 0),
                ],
                "specs": [
                    ("CUDA Cores", "16,384", "Architecture"),
                    ("Boost Clock", "2.52 GHz", "Performance"),
                    ("Memory Config", "24 GB GDDR6X 384-bit", "Memory"),
                ]
            },
            {
                "name": "Sony WH-1000XM5 Wireless Studio Headphones",
                "slug": "sony-wh-1000xm5-wireless",
                "sku": "SNY-WH1000XM5-BLK",
                "brand": "sony",
                "category": "headphones",
                "short_description": "Industry Leading Noise Cancelling with Auto NC Optimizer, 30-Hour Battery.",
                "description": "Engineered with two processors and 8 microphones for unparalleled noise cancellation. Enjoy High-Resolution Audio wireless sound with newly developed 30mm precision drivers.",
                "regular_price": 34990.0,
                "discount_price": 28990.0,
                "status": ProductStatusEnum.PUBLISHED,
                "model_3d_url": None,
                "is_featured": False,
                "is_trending": True,
                "stock": 25,
                "reorder": 5,
                "images": [
                    ("https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80", True, 0),
                ],
                "specs": [
                    ("Battery Life", "Up to 30 Hours (ANC ON)", "Audio & Battery"),
                    ("Driver Unit", "30mm Carbon Fiber Composite Dome", "Audio"),
                    ("Bluetooth", "Version 5.2 with LDAC, AAC, SBC", "Connectivity"),
                ]
            },
            {
                "name": "Corsair K100 RGB Optical Mechanical Keyboard",
                "slug": "corsair-k100-rgb-optical",
                "sku": "COR-K100-OPX",
                "brand": "corsair",
                "category": "keyboards",
                "short_description": "CORSAIR OPX Optical-Mechanical Switches, 8,000Hz Hyper-Polling, iCUE Control Wheel.",
                "description": "Refined aluminum design with dynamic per-key RGB backlighting and a 44-zone three-sided LightEdge. Powered by CORSAIR AXON hyper-processing technology for 0.5ms ultra-low latency.",
                "regular_price": 24999.0,
                "discount_price": 21999.0,
                "status": ProductStatusEnum.PUBLISHED,
                "model_3d_url": None,
                "is_featured": False,
                "is_trending": True,
                "stock": 18,
                "reorder": 4,
                "images": [
                    ("https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1000&q=80", True, 0),
                ],
                "specs": [
                    ("Key Switches", "CORSAIR OPX Optical-Mechanical (1.0mm actuation)", "Hardware"),
                    ("Polling Rate", "Up to 8,000Hz with AXON", "Performance"),
                ]
            },
            {
                "name": "Logitech G PRO X Superlight 2 Lightspeed",
                "slug": "logitech-g-pro-x-superlight-2",
                "sku": "LOG-GPROX-SL2-WHT",
                "brand": "logitech",
                "category": "gaming-accessories",
                "short_description": "60g Lightweight Design, HERO 2 Sensor, 32,000 DPI, LIGHTFORCE Hybrid Switches.",
                "description": "The undisputed weapon of choice for global esports champions. Upgraded with LIGHTFORCE optical-mechanical hybrid switches and ultra-precise HERO 2 tracking.",
                "regular_price": 16995.0,
                "discount_price": 14995.0,
                "status": ProductStatusEnum.PUBLISHED,
                "model_3d_url": None,
                "is_featured": False,
                "is_trending": False,
                "stock": 3,  # Set low to test low-stock alerts!
                "reorder": 5,
                "images": [
                    ("https://images.unsplash.com/photo-1612287232258-2940e4f3a4b9?auto=format&fit=crop&w=1000&q=80", True, 0),
                ],
                "specs": [
                    ("Sensor", "HERO 2 32,000 DPI", "Sensor"),
                    ("Weight", "60 grams", "Physical"),
                    ("Battery Life", "95 Hours continuous motion", "Power"),
                ]
            },
            # Pending Product submitted by staff John to test Super Admin approval workflow!
            {
                "name": "ASUS ROG Swift OLED PG32UCDM 4K 240Hz",
                "slug": "asus-rog-swift-oled-pg32ucdm",
                "sku": "ASUS-PG32UCDM-32",
                "brand": "asus-rog",
                "category": "monitors",
                "short_description": "32-inch 4K QD-OLED, 240Hz, 0.03ms response time, custom heatsink, Dolby Vision.",
                "description": "Third-generation QD-OLED technology with ultra-crisp text rendering, incredible peak 1000-nit luminance, graphene film panel protection, and USB-C 90W power delivery.",
                "regular_price": 149999.0,
                "discount_price": 139999.0,
                "status": ProductStatusEnum.PENDING_APPROVAL,
                "model_3d_url": None,
                "is_featured": False,
                "is_trending": False,
                "stock": 10,
                "reorder": 3,
                "images": [
                    ("https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1000&q=80", True, 0),
                ],
                "specs": [
                    ("Panel Type", "31.5\" QD-OLED Gen 3", "Display"),
                    ("Resolution", "3840 x 2160 (4K)", "Display"),
                    ("Refresh Rate", "240Hz (0.03ms GtG)", "Performance"),
                ]
            }
        ]

        created_products = []
        for pdata in products_seed:
            prod = Product(
                name=pdata["name"],
                slug=pdata["slug"],
                sku=pdata["sku"],
                brand_id=brand_map[pdata["brand"]].id,
                category_id=cat_map[pdata["category"]].id,
                short_description=pdata["short_description"],
                description=pdata["description"],
                regular_price=pdata["regular_price"],
                discount_price=pdata["discount_price"],
                status=pdata["status"],
                model_3d_url=pdata["model_3d_url"],
                is_featured=pdata["is_featured"],
                is_trending=pdata["is_trending"],
                created_by_id=staff_john.id
            )
            db.add(prod)
            db.flush()
            created_products.append(prod)

            # Images
            for img_url, is_prim, s_order in pdata["images"]:
                img = ProductImage(
                    product_id=prod.id,
                    image_url=img_url,
                    alt_text=prod.name,
                    is_primary=is_prim,
                    sort_order=s_order
                )
                db.add(img)

            # Specs
            for skey, sval, sgrp in pdata["specs"]:
                spec = ProductSpecification(
                    product_id=prod.id,
                    spec_key=skey,
                    spec_value=sval,
                    group_name=sgrp
                )
                db.add(spec)

            # Inventory & Initial Transaction
            inv = Inventory(
                product_id=prod.id,
                quantity_available=pdata["stock"],
                quantity_reserved=0,
                reorder_threshold=pdata["reorder"],
                last_restocked_at=datetime.now(timezone.utc)
            )
            db.add(inv)
            db.flush()

            tx = InventoryTransaction(
                inventory_id=inv.id,
                product_id=prod.id,
                user_id=staff_john.id,
                transaction_type=TransactionTypeEnum.STOCK_IN,
                quantity_delta=pdata["stock"],
                previous_quantity=0,
                new_quantity=pdata["stock"],
                reason="Initial Warehouse Stock Ingest",
                reference_id="PO-INIT-2026-001"
            )
            db.add(tx)

            # If pending approval, create approval ticket
            if pdata["status"] == ProductStatusEnum.PENDING_APPROVAL:
                appr = ProductApproval(
                    product_id=prod.id,
                    submitted_by_id=staff_john.id,
                    status=ApprovalStatusEnum.PENDING,
                    review_notes="Submitted new QD-OLED product for Admin catalog approval."
                )
                db.add(appr)

        db.commit()

        print("🎟️ Seeding Promo Coupons...")
        coupons_data = [
            ("TECH10", "10% Instant Discount on High-End Tech", DiscountTypeEnum.PERCENTAGE, 10.0, 50000.0, 15000.0),
            ("PROMO5000", "Flat ₹5,000 Off on orders above ₹1,00,000", DiscountTypeEnum.FIXED, 5000.0, 100000.0, 5000.0),
            ("ITFLOW20", "20% Exclusive Member Discount", DiscountTypeEnum.PERCENTAGE, 20.0, 200000.0, 30000.0),
        ]
        coupon_map = {}
        for code, desc, dtype, val, min_amt, max_amt in coupons_data:
            c = Coupon(
                code=code,
                description=desc,
                discount_type=dtype,
                discount_value=val,
                min_order_amount=min_amt,
                max_discount_amount=max_amt,
                valid_from=datetime.now(timezone.utc) - timedelta(days=10),
                valid_until=datetime.now(timezone.utc) + timedelta(days=90),
                usage_limit=500,
                times_used=3,
                is_active=True
            )
            db.add(c)
            db.flush()
            coupon_map[code] = c

        print("🛒 Seeding Active Orders, Payments & Shipments...")
        # Order 1: Delivered High-Value Order for Alex
        p1 = created_products[0]  # Razer Blade 18
        order1 = Order(
            order_number="ITF-2026-9042",
            customer_id=customer_alex.id,
            address_id=addr_alex.id,
            coupon_id=coupon_map["TECH10"].id,
            total_amount=359999.0,
            discount_amount=15000.0,
            tax_amount=62099.0,
            shipping_amount=0.0,
            final_amount=407098.0,
            order_status=OrderStatusEnum.DELIVERED,
            assigned_staff_id=staff_sarah.id,
            notes="Signature verified delivery completed."
        )
        db.add(order1)
        db.flush()

        item1 = OrderItem(
            order_id=order1.id,
            product_id=p1.id,
            product_name=p1.name,
            product_sku=p1.sku,
            unit_price=p1.discount_price or p1.regular_price,
            quantity=1,
            total_price=p1.discount_price or p1.regular_price
        )
        db.add(item1)

        pay1 = Payment(
            order_id=order1.id,
            payment_method=PaymentMethodEnum.RAZORPAY,
            status=PaymentStatusEnum.COMPLETED,
            amount=407098.0,
            currency="INR",
            transaction_id="txn_rzp_live_904281239",
            gateway_order_id="order_rzp_904281239",
            gateway_payment_id="pay_rzp_904281239",
            gateway_signature="sig_verified_mock_9042"
        )
        db.add(pay1)

        ship1 = Shipment(
            order_id=order1.id,
            carrier="Bluedart Apex Priority",
            tracking_number="BD-EXP-8899231",
            status=ShipmentStatusEnum.DELIVERED,
            estimated_delivery_at=datetime.now(timezone.utc) - timedelta(days=2),
            shipped_at=datetime.now(timezone.utc) - timedelta(days=4),
            delivered_at=datetime.now(timezone.utc) - timedelta(days=2)
        )
        db.add(ship1)

        # Order 2: In-Transit Order for Alex
        p2 = created_products[2] # Alienware Battlestation
        order2 = Order(
            order_number="ITF-2026-9043",
            customer_id=customer_alex.id,
            address_id=addr_alex.id,
            coupon_id=coupon_map["PROMO5000"].id,
            total_amount=299999.0,
            discount_amount=5000.0,
            tax_amount=53099.0,
            shipping_amount=0.0,
            final_amount=347998.0,
            order_status=OrderStatusEnum.SHIPPED,
            assigned_staff_id=staff_sarah.id,
            notes="Air express dispatched."
        )
        db.add(order2)
        db.flush()

        item2 = OrderItem(
            order_id=order2.id,
            product_id=p2.id,
            product_name=p2.name,
            product_sku=p2.sku,
            unit_price=p2.discount_price or p2.regular_price,
            quantity=1,
            total_price=p2.discount_price or p2.regular_price
        )
        db.add(item2)

        pay2 = Payment(
            order_id=order2.id,
            payment_method=PaymentMethodEnum.RAZORPAY,
            status=PaymentStatusEnum.COMPLETED,
            amount=347998.0,
            currency="INR",
            transaction_id="txn_rzp_live_904391240",
            gateway_order_id="order_rzp_904391240",
            gateway_payment_id="pay_rzp_904391240",
            gateway_signature="sig_verified_mock_9043"
        )
        db.add(pay2)

        ship2 = Shipment(
            order_id=order2.id,
            carrier="Bluedart Apex Priority",
            tracking_number="BD-EXP-8899232",
            status=ShipmentStatusEnum.IN_TRANSIT,
            estimated_delivery_at=datetime.now(timezone.utc) + timedelta(days=1),
            shipped_at=datetime.now(timezone.utc) - timedelta(days=1),
        )
        db.add(ship2)

        # Customer Cart & Wishlist
        cart_alex = Cart(user_id=customer_alex.id)
        db.add(cart_alex)
        db.flush()

        # Add Razer Blade to Alex's cart
        cart_item1 = CartItem(
            cart_id=cart_alex.id,
            product_id=created_products[4].id, # RTX 4090
            quantity=1,
            unit_price=created_products[4].discount_price or created_products[4].regular_price
        )
        db.add(cart_item1)

        # Reviews
        rev1 = Review(
            product_id=p1.id,
            customer_id=customer_alex.id,
            rating=5,
            title="Unbelievable 4K Screen & Raw Processing Power",
            comment="The dual-mode Mini-LED screen is mindblowing for both coding and 4K gaming. Excellent thermals under sustained workloads.",
            is_verified_purchase=True,
            is_approved=True
        )
        db.add(rev1)

        print("📜 Seeding Immutable Audit & Activity Logs...")
        audit_records = [
            (admin_user.id, admin_user.email, UserRoleEnum.ADMIN, "SYSTEM_BOOTSTRAP", "System", "1", None, '{"status": "initialized"}'),
            (staff_john.id, staff_john.email, UserRoleEnum.STAFF, "PRODUCT_CREATE", "Product", str(p1.id), None, f'{{"name": "{p1.name}", "sku": "{p1.sku}"}}'),
            (staff_sarah.id, staff_sarah.email, UserRoleEnum.STAFF, "INVENTORY_RESTOCK", "Inventory", str(p1.id), '{"qty": 0}', '{"qty": 14}'),
            (customer_alex.id, customer_alex.email, UserRoleEnum.CUSTOMER, "ORDER_PLACED", "Order", "ITF-2026-9042", None, '{"final_amount": 407098.0}'),
            (staff_sarah.id, staff_sarah.email, UserRoleEnum.STAFF, "ORDER_FULFILLMENT", "Order", "ITF-2026-9042", '{"status": "PACKED"}', '{"status": "DELIVERED", "tracking": "BD-EXP-8899231"}'),
        ]
        for uid, uemail, urole, act, etype, eid, pstate, nstate in audit_records:
            log = ActivityLog(
                user_id=uid,
                user_email=uemail,
                user_role=urole,
                action=act,
                entity_type=etype,
                entity_id=eid,
                previous_state=pstate,
                new_state=nstate,
                ip_address="127.0.0.1",
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) ITFlow3D/1.0"
            )
            db.add(log)

        # Notifications
        notifs = [
            (admin_user.id, UserRoleEnum.ADMIN, "Pending Product Approval", "Staff John submitted 'ASUS ROG Swift OLED PG32UCDM' for catalog review.", NotificationCategoryEnum.APPROVAL, "/admin/approvals"),
            (staff_sarah.id, UserRoleEnum.STAFF, "Low Stock Warning", "Product 'Logitech G PRO X Superlight 2' has reached 3 units (reorder threshold 5).", NotificationCategoryEnum.INVENTORY, "/staff/inventory"),
            (customer_alex.id, UserRoleEnum.CUSTOMER, "Order Shipped", "Your order #ITF-2026-9043 is on its way via Bluedart Apex (BD-EXP-8899232).", NotificationCategoryEnum.ORDER, "/customer/orders/ITF-2026-9043"),
        ]
        for rid, rrole, title, msg, cat, link in notifs:
            n = Notification(
                recipient_id=rid,
                recipient_role=rrole,
                title=title,
                message=msg,
                category=cat,
                link_url=link,
                is_read=False
            )
            db.add(n)

        db.commit()
        print("✅ Database seeding successfully completed with realistic enterprise data!")

    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
