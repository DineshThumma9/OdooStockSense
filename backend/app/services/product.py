import uuid
from datetime import datetime
from typing import List, Optional, Tuple

from sqlmodel import Session, func, or_, select

from ..models import (
    Location,
    Product,
    ProductCategory,
    ProductCategoryCreate,
    ProductCreate,
    ProductUpdate,
    ReorderRule,
    ReorderRuleCreate,
    StockLedger,
    StockQuant,
    Supplier,
    SupplierCreate,
    SupplierUpdate,
    UnitOfMeasure,
    UnitOfMeasureCreate,
    Warehouse,
)
from ..models.stock import MovementType


# ═══════════════════════════════════════════════════════
# PRODUCT CATEGORIES
# ═══════════════════════════════════════════════════════

def get_categories(session: Session) -> List[ProductCategory]:
    return session.exec(select(ProductCategory).order_by(ProductCategory.name)).all()


def get_category(
    session: Session, category_id: uuid.UUID
) -> Optional[ProductCategory]:
    return session.get(ProductCategory, category_id)


def create_category(
    session: Session, data: ProductCategoryCreate
) -> ProductCategory:
    category = ProductCategory(**data.model_dump())
    session.add(category)
    session.commit()
    session.refresh(category)
    return category


# ═══════════════════════════════════════════════════════
# UNITS OF MEASURE
# ═══════════════════════════════════════════════════════

def get_uoms(session: Session) -> List[UnitOfMeasure]:
    return session.exec(select(UnitOfMeasure).order_by(UnitOfMeasure.name)).all()


def get_uom(session: Session, uom_id: uuid.UUID) -> Optional[UnitOfMeasure]:
    return session.get(UnitOfMeasure, uom_id)


def create_uom(session: Session, data: UnitOfMeasureCreate) -> UnitOfMeasure:
    uom = UnitOfMeasure(**data.model_dump())
    session.add(uom)
    session.commit()
    session.refresh(uom)
    return uom


# ═══════════════════════════════════════════════════════
# SUPPLIERS
# ═══════════════════════════════════════════════════════

def get_suppliers(
    session: Session, search: Optional[str] = None
) -> List[Supplier]:
    query = select(Supplier)
    if search:
        query = query.where(Supplier.name.ilike(f"%{search}%"))
    return session.exec(query.order_by(Supplier.name)).all()


def get_supplier(
    session: Session, supplier_id: uuid.UUID
) -> Optional[Supplier]:
    return session.get(Supplier, supplier_id)


def create_supplier(session: Session, data: SupplierCreate) -> Supplier:
    supplier = Supplier(**data.model_dump())
    session.add(supplier)
    session.commit()
    session.refresh(supplier)
    return supplier


def update_supplier(
    session: Session, supplier: Supplier, data: SupplierUpdate
) -> Supplier:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(supplier, field, value)
    session.add(supplier)
    session.commit()
    session.refresh(supplier)
    return supplier


# ═══════════════════════════════════════════════════════
# PRODUCTS — CRUD
# ═══════════════════════════════════════════════════════

def get_product_by_sku(session: Session, sku: str) -> Optional[Product]:
    return session.exec(select(Product).where(Product.sku == sku)).first()


def get_product(session: Session, product_id: uuid.UUID) -> Optional[Product]:
    return session.get(Product, product_id)


def get_products(
    session: Session,
    search: Optional[str] = None,
    category_id: Optional[uuid.UUID] = None,
    is_active: Optional[bool] = True,
    page: int = 1,
    limit: int = 20,
) -> Tuple[List[Product], int]:
    """List products with search, category filter, and pagination."""
    query = select(Product)

    if is_active is not None:
        query = query.where(Product.is_active == is_active)
    if category_id:
        query = query.where(Product.category_id == category_id)
    if search:
        query = query.where(
            or_(
                Product.name.ilike(f"%{search}%"),
                Product.sku.ilike(f"%{search}%"),
            )
        )

    count_query = select(func.count()).select_from(query.subquery())
    total = session.exec(count_query).one()

    items = session.exec(
        query.order_by(Product.name).offset((page - 1) * limit).limit(limit)
    ).all()

    return list(items), total


def create_product(
    session: Session, data: ProductCreate, created_by: uuid.UUID
) -> Product:
    if get_product_by_sku(session, data.sku):
        raise ValueError(f"SKU '{data.sku}' already exists")

    product_data = data.model_dump(exclude={"initial_stock", "initial_location_id"})
    product = Product(**product_data)
    session.add(product)
    session.flush()  # Assigns product.id without full commit

    # Seed initial stock if provided
    if data.initial_stock and data.initial_stock > 0 and data.initial_location_id:
        _seed_initial_stock(
            session, product, data.initial_location_id, data.initial_stock, created_by
        )

    session.commit()
    session.refresh(product)
    return product


def _seed_initial_stock(
    session: Session,
    product: Product,
    location_id: uuid.UUID,
    qty: float,
    created_by: uuid.UUID,
) -> None:
    """Creates the opening stock entry (quant + ledger) when a product is first created."""
    quant = StockQuant(
        product_id=product.id,
        location_id=location_id,
        qty=qty,
    )
    ledger = StockLedger(
        product_id=product.id,
        from_location_id=None,  # Goods from outside the system
        to_location_id=location_id,
        qty=qty,
        movement_type=MovementType.adjustment,
        reference_id=product.id,
        reference_ref=f"INIT/{product.sku}",
        created_by=created_by,
    )
    session.add(quant)
    session.add(ledger)


def update_product(
    session: Session, product: Product, data: ProductUpdate
) -> Product:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    product.updated_at = datetime.utcnow()
    session.add(product)
    session.commit()
    session.refresh(product)
    return product


# ═══════════════════════════════════════════════════════
# PRODUCT STOCK — per location breakdown
# ═══════════════════════════════════════════════════════

def get_product_stock(session: Session, product_id: uuid.UUID) -> dict:
    """Returns current stock qty broken down by location."""
    rows = session.exec(
        select(StockQuant, Location, Warehouse)
        .join(Location, StockQuant.location_id == Location.id)
        .join(Warehouse, Location.warehouse_id == Warehouse.id)
        .where(StockQuant.product_id == product_id)
        .where(StockQuant.qty > 0)
    ).all()

    product = session.get(Product, product_id)
    locations = [
        {
            "location_id": str(q.location_id),
            "location_name": loc.name,
            "warehouse_name": wh.name,
            "qty": q.qty,
        }
        for q, loc, wh in rows
    ]
    return {
        "product_id": str(product_id),
        "product_name": product.name,
        "sku": product.sku,
        "total_qty": sum(item["qty"] for item in locations),
        "locations": locations,
    }


# ═══════════════════════════════════════════════════════
# REORDER RULES
# ═══════════════════════════════════════════════════════

def get_reorder_rules(
    session: Session, product_id: Optional[uuid.UUID] = None
) -> List[ReorderRule]:
    query = select(ReorderRule)
    if product_id:
        query = query.where(ReorderRule.product_id == product_id)
    return session.exec(query).all()


def create_reorder_rule(
    session: Session, data: ReorderRuleCreate
) -> ReorderRule:
    rule = ReorderRule(**data.model_dump())
    session.add(rule)
    session.commit()
    session.refresh(rule)
    return rule


def delete_reorder_rule(session: Session, rule_id: uuid.UUID) -> bool:
    rule = session.get(ReorderRule, rule_id)
    if not rule:
        return False
    session.delete(rule)
    session.commit()
    return True
