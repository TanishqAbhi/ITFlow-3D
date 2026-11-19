from datetime import datetime, timezone

from app.core.database import SessionLocal
from app.models import (
    User,
    UserRoleEnum,
    Category,
    Brand,
    Product,
    ProductImage,
    ProductSpecification,
    ProductApproval,
    ProductStatusEnum,
    ApprovalStatusEnum,
    Inventory,
    InventoryTransaction,
    TransactionTypeEnum,
)

# This script seeds only catalog data. It never creates, edits, or deletes users.
STAFF_EMAIL = "tanishqabhi627@gmail.com"

categories_data = [
    ("Laptops", "laptops", "High-performance ultrabooks,creator rigs, and gaming laptops", "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80", "Laptop"),
    ("Desktops", "desktops", "Enterprise workstations and custom liquid-cooled battlestations", "https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=600&q=80", "Monitor"),
    ("Smartphones", "smartphones", "Flagship titanium smartphones and foldable next-gen handsets", "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80", "Smartphone"),
    ("Monitors", "monitors", "Ultrawide OLED curved displays and color-accurate creator screens", "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80", "Tv"),
    ("Keyboards", "keyboards", "Custom mechanical keyboards with hot-swappable switches", "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80", "Keyboard"),
    ("Headphones", "headphones", "Audiophile studio headphones and wireless active noise-cancelling gear", "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80", "Headphones"),
    ("Gaming Accessories", "gaming-accessories", "Precision esports mice, flight sticks, and streaming controllers", "https://images.unsplash.com/photo-1612287232258-2940e4f3a4b9?auto=format&fit=crop&w=600&q=80", "Gamepad2"),
    ("Computer Components", "computer-components", "Next-gen GPUs, liquid coolers, and PCIe Gen5 NVMe drives", "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=600&q=80", "Cpu"),
    ("Networking Devices", "networking-devices", "Wi-Fi 7 mesh routers, 10GbE switches, and enterprise firewalls", "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80", "Wifi"),
    ("Tablets", "tablets", "Pro-grade stylus tablets fordigital artists and executives", "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80", "Tablet"),
    ("Smart Gadgets", "smart-gadgets", "Cyberpunk ambient lighting, smart rings, and home automation", "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=600&q=80", "Zap"),
]

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

products_seed = [
    {
        "name": "Razer Blade 18 Ultra Gaming Rig",
        "slug": "razer-blade-18-ultra-gaming-rig",
        "sku": "RZ-BLD18-2026",
        "brand": "razer", "category": "laptops",
        "short_description": "18-inch 4K 200Hz Dual-ModeMini-LED display with Intel Core i9-14900HX and RTX 4090.",
        "description": "Experience uncompromised desktop-grade performance engineered into a sleek anodized aluminum unibody. Featuring the revolutionary 18-inch 4K Dual-Mode display, per-key RGB Chroma keyboard, patented vapor chamber cooling, and audiophile THX spatial audio.",
        "regular_price": 389999.0, "discount_price": 359999.0,
        "status": ProductStatusEnum.PUBLISHED,
        "model_3d_url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb",
        "is_featured": True, "is_trending": True, "stock": 14, "reorder": 3,
        "images": [
            ("https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1000&q=80", True, 0),
            ("https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1000&q=80", False, 1),
        ],
        "specs": [
            ("Processor", "Intel Core i9-14900HX (24 Cores, 32 Threads, up to 5.8 GHz)", "Performance"),
            ("Graphics", "NVIDIA GeForce RTX 4090 (16GB GDDR6 VRAM, 175W TGP)", "Performance"),
            ("Memory", "64GB Dual-Channel DDR5 5600MHz", "Memory & Storage"),
            ("Storage", "4TB PCIe Gen4 NVMe M.2 SSD", "Memory & Storage"),
            ("Display", '18.0" UHD+ (3840 x 2400) 200HzMini-LED 100% DCI-P3', "Display"),
        ],
    },
    {
        "name": 'Apple MacBook Pro 16" M3 Max',
        "slug": "apple-macbook-pro-16-m3-max", "sku": "APL-MBP16-M3X",
        "brand": "apple", "category": "laptops",
        "short_description": "Liquid Retina XDR, Space Black, 16-Core CPU, 40-Core GPU, 128GB Unified Memory.",
        "description": "Mind-blowing performance for extreme creative workflows. With up to 22 hours of battery life, hardware-accelerated ray tracing, Studio-quality mics, and a breathtaking Extreme Dynamic Range Liquid Retina display.",
        "regular_price": 399900.0, "discount_price": 379900.0,
        "status": ProductStatusEnum.PUBLISHED,
        "model_3d_url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoomBox/glTF-Binary/BoomBox.glb",
        "is_featured": True, "is_trending": True, "stock": 8, "reorder": 2,
        "images": [
            ("https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80", True, 0),
            ("https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=1000&q=80", False, 1),
        ],
        "specs": [
            ("Processor", "Apple M3 Max chip (16-core CPU, 12 performance cores)", "Performance"),
            ("Graphics", "40-core GPU with hardware ray tracing", "Performance"),
            ("Unified Memory", "128GB Unified Memory", "Memory & Storage"),
            ("Storage", "2TB High-Speed SSD", "Memory & Storage"),
            ("Display", '16.2" Liquid Retina XDR display (3456 x 2234), 1600 nits peak', "Display"),
        ],
    },
    {
        "name": "Alienware Aurora R16 Liquid Cooled Battlestation",
        "slug": "alienware-aurora-r16-battlestation", "sku": "AW-AUR16-LQD",
        "brand": "alienware", "category": "desktops",
        "short_description": "Intel Core i9-14900KF, RTX4090 24GB, 64GB DDR5, 240mm Liquid Cooling.",
        "description": "Engineered with the Legend 3 design language, optimized acoustic performance, up to 20% quieter operation, and exceptional thermal airflow designed for elite 4K competitive gaming.",
        "regular_price": 329999.0, "discount_price": 299999.0,
        "status": ProductStatusEnum.PUBLISHED,
        "model_3d_url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Lantern/glTF-Binary/Lantern.glb",
        "is_featured": True, "is_trending": False, "stock": 5, "reorder": 2,
        "images": [("https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=1000&q=80", True, 0)],
        "specs": [
            ("Processor", "Intel Core i9-14900KF (LiquidCooled)", "Performance"),
            ("Graphics Card", "NVIDIA GeForce RTX 4090 24GB GDDR6X", "Performance"),
            ("Power Supply", "1000W Platinum Modular PSU", "Power"),
            ("Storage", "4TB (2x 2TB NVMe PCIe 4.0 SSD)", "Storage"),
        ],
    },
    {
        "name": 'Samsung Odyssey Neo G9 49" Curved Gaming Monitor',
        "slug": "samsung-odyssey-neo-g9-49", "sku": "SAM-ODYSSEY-G9-49",
        "brand": "samsung", "category": "monitors",
        "short_description": "Dual QHD (5120x1440), 240Hz, 1ms, 1000R Curvature, Quantum Mini-LED.",
        "description": "Spellbinding visual quality withQuantum Matrix technology, HDR2000 brightness, and a radical 1000R curved ultra-wide panoramic panel matching the human eye contour.",
        "regular_price": 179999.0, "discount_price": 154999.0,
        "status": ProductStatusEnum.PUBLISHED, "model_3d_url": None,
        "is_featured": True, "is_trending": True, "stock": 9, "reorder": 3,
        "images": [("https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1000&q=80", True, 0)],
        "specs": [
            ("Screen Size", "49 Inch Ultrawide 32:9", "Display"),
            ("Resolution", "Dual QHD (5,120 x 1,440)", "Display"),
            ("Refresh Rate", "240Hz with 1ms GtG Response", "Gaming"),
            ("HDR", "Quantum HDR 2000", "Display"),
        ],
    },
    {
        "name": "NVIDIA GeForce RTX 4090 Founders Edition",
        "slug": "nvidia-geforce-rtx-4090-fe", "sku": "NV-RTX4090-FE24",
        "brand": "nvidia", "category": "computer-components",
        "short_description": "24GB GDDR6X, Ada Lovelace Architecture, 3rd Gen RT Cores, DLSS 3.5.",
        "description": "The ultimate GeForce GPU delivering quantum leaps in performance, efficiency, and AI-powered graphics. Render hyper-realistic ray-traced virtual worlds with unprecedented frame rates.",
        "regular_price": 199999.0, "discount_price": 184999.0,
        "status": ProductStatusEnum.PUBLISHED,
        "model_3d_url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb",
        "is_featured": True, "is_trending": True, "stock": 6, "reorder": 2,
        "images": [("https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=1000&q=80", True, 0)],
        "specs": [
            ("CUDA Cores", "16,384", "Architecture"),
            ("Boost Clock", "2.52 GHz", "Performance"),
            ("Memory Config", "24 GB GDDR6X 384-bit", "Memory"),
        ],
    },
    {
        "name": "Sony WH-1000XM5 Wireless Studio Headphones",
        "slug": "sony-wh-1000xm5-wireless", "sku": "SNY-WH1000XM5-BLK",
        "brand": "sony", "category": "headphones",
        "short_description": "Industry Leading Noise Cancelling with Auto NC Optimizer, 30-Hour Battery.",
        "description": "Engineered with two processors and 8 microphones for unparalleled noise cancellation. Enjoy High-Resolution Audio wireless sound with newly developed 30mm precision drivers.",
        "regular_price": 34990.0, "discount_price": 28990.0,
        "status": ProductStatusEnum.PUBLISHED, "model_3d_url": None,
        "is_featured": False, "is_trending": True, "stock": 25, "reorder": 5,
        "images": [("https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80", True, 0)],
        "specs": [
            ("Battery Life", "Up to 30 Hours (ANC ON)", "Audio & Battery"),
            ("Driver Unit", "30mm Carbon Fiber CompositeDome", "Audio"),
            ("Bluetooth", "Version 5.2 with LDAC, AAC, SBC", "Connectivity"),
        ],
    },
    {
        "name": "Corsair K100 RGB Optical Mechanical Keyboard",
        "slug": "corsair-k100-rgb-optical", "sku": "COR-K100-OPX",
        "brand": "corsair", "category": "keyboards",
        "short_description": "CORSAIR OPX Optical-Mechanical Switches, 8,000Hz Hyper-Polling, iCUE Control Wheel.",
        "description": "Refined aluminum design with dynamic per-key RGB backlighting and a 44-zone three-sided LightEdge. Powered by CORSAIR AXON hyper-processing technology for 0.5ms ultra-low latency.",
        "regular_price": 24999.0, "discount_price": 21999.0,
        "status": ProductStatusEnum.PUBLISHED, "model_3d_url": None,
        "is_featured": False, "is_trending": True, "stock": 18, "reorder": 4,
        "images": [("https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1000&q=80", True, 0)],
        "specs": [
            ("Key Switches", "CORSAIR OPX Optical-Mechanical (1.0mm actuation)", "Hardware"),
            ("Polling Rate", "Up to 8,000Hz with AXON", "Performance"),
        ],
    },
    {
        "name": "Logitech G PRO X Superlight 2 Lightspeed",
        "slug": "logitech-g-pro-x-superlight-2", "sku": "LOG-GPROX-SL2-WHT",
        "brand": "logitech", "category": "gaming-accessories",
        "short_description": "60g Lightweight Design, HERO 2 Sensor, 32,000 DPI, LIGHTFORCE Hybrid Switches.",
        "description": "The undisputed weapon of choice for global esports champions. Upgraded with LIGHTFORCE optical-mechanical hybrid switches and ultra-precise HERO 2 tracking.",
        "regular_price": 16995.0, "discount_price": 14995.0,
        "status": ProductStatusEnum.PUBLISHED, "model_3d_url": None,
        "is_featured": False, "is_trending": False, "stock": 3, "reorder": 5,
        "images": [("https://images.unsplash.com/photo-1612287232258-2940e4f3a4b9?auto=format&fit=crop&w=1000&q=80", True, 0)],
        "specs": [
            ("Sensor", "HERO 2 32,000 DPI", "Sensor"),
            ("Weight", "60 grams", "Physical"),
            ("Battery Life", "95 Hours continuous motion", "Power"),
        ],
    },
    {
        "name": "ASUS ROG Swift OLED PG32UCDM 4K 240Hz",
        "slug": "asus-rog-swift-oled-pg32ucdm", "sku": "ASUS-PG32UCDM-32",
        "brand": "asus-rog", "category": "monitors",
        "short_description": "32-inch 4K QD-OLED, 240Hz,0.03ms response time, custom heatsink, Dolby Vision.",
        "description": "Third-generation QD-OLED technology with ultra-crisp text rendering, incredible peak 1000-nit luminance, graphene film panel protection, and USB-C 90W power delivery.",
        "regular_price": 149999.0, "discount_price": 139999.0,
        "status": ProductStatusEnum.PENDING_APPROVAL, "model_3d_url": None,
        "is_featured": False, "is_trending": False, "stock": 10, "reorder": 3,
        "images": [("https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1000&q=80", True, 0)],
        "specs": [
            ("Panel Type", '31.5" QD-OLED Gen 3', "Display"),
            ("Resolution", "3840 x 2160 (4K)", "Display"),
            ("Refresh Rate", "240Hz (0.03ms GtG)", "Performance"),
        ],
    },
]


def main():
    db = SessionLocal()
    try:
        staff = db.query(User).filter(User.email == STAFF_EMAIL).first()
        if not staff:
            raise RuntimeError(f"Staff account {STAFF_EMAIL} was not found. No catalog data was committed.")
        if staff.role != UserRoleEnum.STAFF:
            raise RuntimeError(f"{STAFF_EMAIL} is not a STAFF account. No catalog data was committed.")

        category_map = {}
        for name, slug, description, image_url, icon in categories_data:
            category = db.query(Category).filter(Category.slug == slug).first()
            if category is None:
                category = Category(
                    name=name, slug=slug, description=description,
                    image_url=image_url, icon=icon, is_active=True,
                )
                db.add(category)
                db.flush()
            category_map[slug] = category

        brand_map = {}
        for name, slug, logo_url, website in brands_data:
            brand = db.query(Brand).filter(Brand.slug == slug).first()
            if brand is None:
                brand = Brand(
                    name=name, slug=slug, logo_url=logo_url,
                    website=website, is_active=True,
                )
                db.add(brand)
                db.flush()
            brand_map[slug] = brand

        created_count = 0
        skipped_count = 0

        for data in products_seed:
            existing = (
                db.query(Product)
                .filter((Product.slug == data["slug"]) | (Product.sku == data["sku"]))
                .first()
            )
            if existing:
                print(f"SKIP existing product: {data['name']}")
                skipped_count += 1
                continue

            product = Product(
                name=data["name"],
                slug=data["slug"],
                sku=data["sku"],
                brand_id=brand_map[data["brand"]].id,
                category_id=category_map[data["category"]].id,
                short_description=data["short_description"],
                description=data["description"],
                regular_price=data["regular_price"],
                discount_price=data["discount_price"],
                status=data["status"],
                model_3d_url=data["model_3d_url"],
                is_featured=data["is_featured"],
                is_trending=data["is_trending"],
                created_by_id=staff.id,
            )
            db.add(product)
            db.flush()

            for image_url, is_primary, sort_order in data["images"]:
                db.add(ProductImage(
                    product_id=product.id,
                    image_url=image_url,
                    alt_text=product.name,
                    is_primary=is_primary,
                    sort_order=sort_order,
                ))

            for spec_key, spec_value, group_name in data["specs"]:
                db.add(ProductSpecification(
                    product_id=product.id,
                    spec_key=spec_key,
                    spec_value=spec_value,
                    group_name=group_name,
                ))

            inventory = Inventory(
                product_id=product.id,
                quantity_available=data["stock"],
                quantity_reserved=0,
                reorder_threshold=data["reorder"],
                last_restocked_at=datetime.now(timezone.utc),
            )
            db.add(inventory)
            db.flush()

            db.add(InventoryTransaction(
                inventory_id=inventory.id,
                product_id=product.id,
                user_id=staff.id,
                transaction_type=TransactionTypeEnum.STOCK_IN,
                quantity_delta=data["stock"],
                previous_quantity=0,
                new_quantity=data["stock"],
                reason="Initial Warehouse Stock Ingest",
                reference_id="PO-INIT-2026-001",
            ))

            if data["status"] == ProductStatusEnum.PENDING_APPROVAL:
                db.add(ProductApproval(
                    product_id=product.id,
                    submitted_by_id=staff.id,
                    status=ApprovalStatusEnum.PENDING,
                    review_notes="Submitted new QD-OLED product for Admin catalog approval.",
                ))

            created_count += 1
            print(f"CREATED: {product.name}")

        db.commit()

        print("\nCatalog seed completed successfully.")
        print(f"Categories: {db.query(Category).count()}")
        print(f"Brands: {db.query(Brand).count()}")
        print(f"Products: {db.query(Product).count()}")
        print(f"Inventory records: {db.query(Inventory).count()}")
        print(f"Created in this run: {created_count}")
        print(f"Skipped existing products: {skipped_count}")
        print("Existing user accounts were not changed.")

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
