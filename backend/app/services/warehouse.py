import uuid
from typing import List, Optional

from sqlmodel import Session, select

from ..models import (
    Location,
    LocationCreate,
    LocationUpdate,
    Warehouse,
    WarehouseCreate,
    WarehouseUpdate,
)
from ..models.warehouse import LocationType


# ── Warehouse CRUD ────────────────────────────────────────────────────────────

def get_warehouses(
    session: Session, include_inactive: bool = False
) -> List[Warehouse]:
    query = select(Warehouse)
    if not include_inactive:
        query = query.where(Warehouse.is_active == True)
    return session.exec(query.order_by(Warehouse.name)).all()


def get_warehouse(
    session: Session, warehouse_id: uuid.UUID
) -> Optional[Warehouse]:
    return session.get(Warehouse, warehouse_id)


def create_warehouse(session: Session, data: WarehouseCreate) -> Warehouse:
    # Check code uniqueness
    existing = session.exec(
        select(Warehouse).where(Warehouse.code == data.code)
    ).first()
    if existing:
        raise ValueError(f"Warehouse code '{data.code}' already exists")

    warehouse = Warehouse(**data.model_dump())
    session.add(warehouse)
    session.commit()
    session.refresh(warehouse)
    return warehouse


def update_warehouse(
    session: Session, warehouse: Warehouse, data: WarehouseUpdate
) -> Warehouse:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(warehouse, field, value)
    session.add(warehouse)
    session.commit()
    session.refresh(warehouse)
    return warehouse


# ── Location CRUD ─────────────────────────────────────────────────────────────

def get_locations(
    session: Session,
    warehouse_id: uuid.UUID,
    location_type: Optional[LocationType] = None,
    include_inactive: bool = False,
) -> List[Location]:
    query = select(Location).where(Location.warehouse_id == warehouse_id)
    if not include_inactive:
        query = query.where(Location.is_active == True)
    if location_type:
        query = query.where(Location.type == location_type)
    return session.exec(query.order_by(Location.name)).all()


def get_location(
    session: Session, location_id: uuid.UUID
) -> Optional[Location]:
    return session.get(Location, location_id)


def create_location(
    session: Session, warehouse_id: uuid.UUID, data: LocationCreate
) -> Location:
    location = Location(**data.model_dump(), warehouse_id=warehouse_id)
    session.add(location)
    session.commit()
    session.refresh(location)
    return location


def update_location(
    session: Session, location: Location, data: LocationUpdate
) -> Location:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(location, field, value)
    session.add(location)
    session.commit()
    session.refresh(location)
    return location
