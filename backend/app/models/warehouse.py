import uuid
from datetime import datetime
from enum import Enum
from typing import List, Optional

from sqlmodel import Field, Relationship, SQLModel


class LocationType(str, Enum):
    input = "input"       # Where goods arrive (receiving dock)
    output = "output"     # Where goods leave (shipping dock)
    internal = "internal" # Regular stock location (racks, shelves)
    view = "view"         # Virtual parent location (no physical stock)


# ── Warehouse ────────────────────────────────────────────────────────────────

class WarehouseBase(SQLModel):
    name: str = Field(min_length=1, max_length=100)
    code: str = Field(unique=True, max_length=10, index=True)
    address: Optional[str] = None


class Warehouse(WarehouseBase, table=True):
    __tablename__ = "warehouses"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    locations: List["Location"] = Relationship(back_populates="warehouse")


class WarehouseCreate(WarehouseBase):
    pass


class WarehouseRead(WarehouseBase):
    id: uuid.UUID
    is_active: bool
    created_at: datetime


class WarehouseUpdate(SQLModel):
    name: Optional[str] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None


# ── Location ─────────────────────────────────────────────────────────────────

class LocationBase(SQLModel):
    name: str = Field(min_length=1, max_length=100)
    code: str = Field(max_length=20)
    type: LocationType = Field(default=LocationType.internal)
    warehouse_id: uuid.UUID = Field(foreign_key="warehouses.id")
    # Optional parent for nested locations (e.g. Shelf > Row > Bin)
    parent_id: Optional[uuid.UUID] = Field(default=None, foreign_key="locations.id")


class Location(LocationBase, table=True):
    __tablename__ = "locations"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    is_active: bool = Field(default=True)

    warehouse: Optional[Warehouse] = Relationship(back_populates="locations")


class LocationCreate(LocationBase):
    pass


class LocationRead(LocationBase):
    id: uuid.UUID
    is_active: bool


class LocationUpdate(SQLModel):
    name: Optional[str] = None
    code: Optional[str] = None
    type: Optional[LocationType] = None
    parent_id: Optional[uuid.UUID] = None
    is_active: Optional[bool] = None
