import uuid
from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


# ── Product Category ─────────────────────────────────────────────────────────

class ProductCategoryBase(SQLModel):
    name: str = Field(min_length=1, max_length=100)
    # Self-referential for category hierarchy (e.g. Raw Materials > Metals)
    parent_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="product_categories.id"
    )


class ProductCategory(ProductCategoryBase, table=True):
    __tablename__ = "product_categories"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)


class ProductCategoryCreate(ProductCategoryBase):
    pass


class ProductCategoryRead(ProductCategoryBase):
    id: uuid.UUID


# ── Unit of Measure ──────────────────────────────────────────────────────────

class UnitOfMeasureBase(SQLModel):
    name: str = Field(min_length=1, max_length=50)
    abbreviation: str = Field(max_length=10)  # kg, pcs, ltr, m, etc.


class UnitOfMeasure(UnitOfMeasureBase, table=True):
    __tablename__ = "units_of_measure"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)


class UnitOfMeasureCreate(UnitOfMeasureBase):
    pass


class UnitOfMeasureRead(UnitOfMeasureBase):
    id: uuid.UUID


# ── Supplier ─────────────────────────────────────────────────────────────────

class SupplierBase(SQLModel):
    name: str = Field(min_length=1, max_length=100)
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class Supplier(SupplierBase, table=True):
    __tablename__ = "suppliers"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class SupplierCreate(SupplierBase):
    pass


class SupplierRead(SupplierBase):
    id: uuid.UUID
    created_at: datetime


class SupplierUpdate(SQLModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


# ── Product ──────────────────────────────────────────────────────────────────

class ProductBase(SQLModel):
    name: str = Field(min_length=1, max_length=200)
    sku: str = Field(unique=True, max_length=50, index=True)
    description: Optional[str] = None
    category_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="product_categories.id"
    )
    uom_id: uuid.UUID = Field(foreign_key="units_of_measure.id")
    # When total stock (across all locations) falls below this → alert
    reorder_point: float = Field(default=0.0, ge=0)


class Product(ProductBase, table=True):
    __tablename__ = "products"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ProductCreate(ProductBase):
    # Optional: seed initial stock on creation (creates a stock adjustment internally)
    initial_stock: Optional[float] = Field(default=None, ge=0)
    initial_location_id: Optional[uuid.UUID] = None


class ProductRead(ProductBase):
    id: uuid.UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ProductUpdate(SQLModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[uuid.UUID] = None
    uom_id: Optional[uuid.UUID] = None
    reorder_point: Optional[float] = None
    is_active: Optional[bool] = None


class ProductStockRead(SQLModel):
    """Response for GET /products/{id}/stock — stock per location"""
    product_id: uuid.UUID
    product_name: str
    sku: str
    locations: list[dict]  # [{location_id, location_name, warehouse_name, qty}]
    total_qty: float


# ── Reorder Rule ─────────────────────────────────────────────────────────────

class ReorderRuleBase(SQLModel):
    product_id: uuid.UUID = Field(foreign_key="products.id")
    location_id: uuid.UUID = Field(foreign_key="locations.id")
    min_qty: float = Field(ge=0)   # Alert threshold
    max_qty: float = Field(ge=0)   # Target restock level
    reorder_qty: float = Field(ge=0)  # Qty to order


class ReorderRule(ReorderRuleBase, table=True):
    __tablename__ = "reorder_rules"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)


class ReorderRuleCreate(ReorderRuleBase):
    pass


class ReorderRuleRead(ReorderRuleBase):
    id: uuid.UUID
