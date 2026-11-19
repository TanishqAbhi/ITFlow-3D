from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.product import ProductStatusEnum, ApprovalStatusEnum


class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    icon: Optional[str] = None
    is_active: bool = True


class CategoryCreate(CategoryBase):
    pass


class CategoryResponse(CategoryBase):
    id: int
    slug: str
    created_at: datetime

    class Config:
        from_attributes = True


class BrandBase(BaseModel):
    name: str
    logo_url: Optional[str] = None
    website: Optional[str] = None
    is_active: bool = True


class BrandCreate(BrandBase):
    pass


class BrandResponse(BrandBase):
    id: int
    slug: str
    created_at: datetime

    class Config:
        from_attributes = True


class ProductImageBase(BaseModel):
    image_url: str
    alt_text: Optional[str] = None
    is_primary: bool = False
    sort_order: int = 0


class ProductImageCreate(ProductImageBase):
    pass


class ProductImageResponse(ProductImageBase):
    id: int
    product_id: int

    class Config:
        from_attributes = True


class ProductSpecificationBase(BaseModel):
    spec_key: str
    spec_value: str
    group_name: str = "General"


class ProductSpecificationCreate(ProductSpecificationBase):
    pass


class ProductSpecificationResponse(ProductSpecificationBase):
    id: int
    product_id: int

    class Config:
        from_attributes = True


class ProductCreate(BaseModel):
    model_config = {"protected_namespaces": ()}
    name: str
    sku: str
    brand_id: int
    category_id: int
    short_description: Optional[str] = None
    description: str
    regular_price: float = Field(gt=0)
    discount_price: Optional[float] = None
    model_3d_url: Optional[str] = None
    is_featured: bool = False
    is_trending: bool = False
    warranty_info: Optional[str] = "2 Year Limited Manufacturer Warranty"
    shipping_info: Optional[str] = "Free Express Shipping"
    images: Optional[List[ProductImageCreate]] = []
    specifications: Optional[List[ProductSpecificationCreate]] = []
    initial_stock: int = 10


class ProductUpdate(BaseModel):
    model_config = {"protected_namespaces": ()}
    name: Optional[str] = None
    brand_id: Optional[int] = None
    category_id: Optional[int] = None
    short_description: Optional[str] = None
    description: Optional[str] = None
    regular_price: Optional[float] = None
    discount_price: Optional[float] = None
    status: Optional[ProductStatusEnum] = None
    model_3d_url: Optional[str] = None
    is_featured: Optional[bool] = None
    is_trending: Optional[bool] = None
    warranty_info: Optional[str] = None
    shipping_info: Optional[str] = None


class ProductApprovalCreate(BaseModel):
    status: ApprovalStatusEnum
    review_notes: Optional[str] = None


class ProductApprovalResponse(BaseModel):
    id: int
    product_id: int
    submitted_by_id: Optional[int]
    reviewed_by_id: Optional[int]
    status: ApprovalStatusEnum
    review_notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ProductResponse(BaseModel):
    model_config = {"from_attributes": True, "protected_namespaces": ()}
    id: int
    name: str
    slug: str
    sku: str
    brand_id: int
    category_id: int
    brand: Optional[BrandResponse] = None
    category: Optional[CategoryResponse] = None
    short_description: Optional[str] = None
    description: str
    regular_price: float
    discount_price: Optional[float] = None
    status: ProductStatusEnum
    model_3d_url: Optional[str] = None
    is_featured: bool
    is_trending: bool
    warranty_info: Optional[str] = None
    shipping_info: Optional[str] = None
    created_at: datetime
    images: List[ProductImageResponse] = []
    specifications: List[ProductSpecificationResponse] = []
    stock_quantity: int = 0
    rating: float = 4.8
    review_count: int = 0
