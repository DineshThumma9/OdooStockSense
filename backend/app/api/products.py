import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session

from ..core.db import get_session
from ..core.deps import get_current_user, require_manager
from ..models import (
    ProductCategoryCreate,
    ProductCategoryRead,
    ProductCreate,
    ProductRead,
    ProductUpdate,
    ReorderRuleCreate,
    ReorderRuleRead,
    SupplierCreate,
    SupplierRead,
    SupplierUpdate,
    UnitOfMeasureCreate,
    UnitOfMeasureRead,
    User,
)
from ..services import product as product_service

router = APIRouter(prefix="/products", tags=["Products"])


# ── Categories ────────────────────────────────────────────────────────────────

@router.get("/categories", response_model=list[ProductCategoryRead])
def list_categories(session: Session = Depends(get_session), _=Depends(get_current_user)):
    return product_service.get_categories(session)


@router.post("/categories", response_model=ProductCategoryRead, status_code=201)
def create_category(
    data: ProductCategoryCreate,
    session: Session = Depends(get_session),
    _=Depends(require_manager),
):
    return product_service.create_category(session, data)


# ── Units of Measure ──────────────────────────────────────────────────────────

@router.get("/uom", response_model=list[UnitOfMeasureRead])
def list_uoms(session: Session = Depends(get_session), _=Depends(get_current_user)):
    return product_service.get_uoms(session)


@router.post("/uom", response_model=UnitOfMeasureRead, status_code=201)
def create_uom(
    data: UnitOfMeasureCreate,
    session: Session = Depends(get_session),
    _=Depends(require_manager),
):
    return product_service.create_uom(session, data)


# ── Suppliers ─────────────────────────────────────────────────────────────────

@router.get("/suppliers", response_model=list[SupplierRead])
def list_suppliers(
    search: Optional[str] = Query(None),
    session: Session = Depends(get_session),
    _=Depends(get_current_user),
):
    return product_service.get_suppliers(session, search=search)


@router.post("/suppliers", response_model=SupplierRead, status_code=201)
def create_supplier(
    data: SupplierCreate,
    session: Session = Depends(get_session),
    _=Depends(require_manager),
):
    return product_service.create_supplier(session, data)


@router.patch("/suppliers/{supplier_id}", response_model=SupplierRead)
def update_supplier(
    supplier_id: uuid.UUID,
    data: SupplierUpdate,
    session: Session = Depends(get_session),
    _=Depends(require_manager),
):
    supplier = product_service.get_supplier(session, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return product_service.update_supplier(session, supplier, data)


# ── Products ──────────────────────────────────────────────────────────────────

@router.get("", response_model=dict)
def list_products(
    search: Optional[str] = Query(None, description="Search by name or SKU"),
    category_id: Optional[uuid.UUID] = Query(None),
    is_active: Optional[bool] = Query(True),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    session: Session = Depends(get_session),
    _=Depends(get_current_user),
):
    items, total = product_service.get_products(
        session,
        search=search,
        category_id=category_id,
        is_active=is_active,
        page=page,
        limit=limit,
    )
    return {
        "items": [ProductRead.model_validate(p) for p in items],
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.post("", response_model=ProductRead, status_code=201)
def create_product(
    data: ProductCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    try:
        product = product_service.create_product(session, data, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    return ProductRead.model_validate(product)


@router.get("/{product_id}", response_model=ProductRead)
def get_product(
    product_id: uuid.UUID,
    session: Session = Depends(get_session),
    _=Depends(get_current_user),
):
    product = product_service.get_product(session, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return ProductRead.model_validate(product)


@router.put("/{product_id}", response_model=ProductRead)
def update_product(
    product_id: uuid.UUID,
    data: ProductUpdate,
    session: Session = Depends(get_session),
    _=Depends(require_manager),
):
    product = product_service.get_product(session, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return ProductRead.model_validate(product_service.update_product(session, product, data))


@router.get("/{product_id}/stock")
def get_product_stock(
    product_id: uuid.UUID,
    session: Session = Depends(get_session),
    _=Depends(get_current_user),
):
    product = product_service.get_product(session, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product_service.get_product_stock(session, product_id)


# ── Reorder Rules ─────────────────────────────────────────────────────────────

@router.get("/reorder-rules", response_model=list[ReorderRuleRead])
def list_reorder_rules(
    product_id: Optional[uuid.UUID] = Query(None),
    session: Session = Depends(get_session),
    _=Depends(get_current_user),
):
    return product_service.get_reorder_rules(session, product_id=product_id)


@router.post("/reorder-rules", response_model=ReorderRuleRead, status_code=201)
def create_reorder_rule(
    data: ReorderRuleCreate,
    session: Session = Depends(get_session),
    _=Depends(require_manager),
):
    return product_service.create_reorder_rule(session, data)


@router.delete("/reorder-rules/{rule_id}", status_code=204)
def delete_reorder_rule(
    rule_id: uuid.UUID,
    session: Session = Depends(get_session),
    _=Depends(require_manager),
):
    deleted = product_service.delete_reorder_rule(session, rule_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Rule not found")
