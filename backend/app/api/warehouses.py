import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from ..core.db import get_session
from ..core.deps import get_current_user, require_manager
from ..models import (
    LocationCreate,
    LocationRead,
    LocationUpdate,
    WarehouseCreate,
    WarehouseRead,
    WarehouseUpdate,
)
from ..models.warehouse import LocationType
from ..services import warehouse as warehouse_service

router = APIRouter(prefix="/warehouses", tags=["Warehouses"])


@router.get("", response_model=list[WarehouseRead])
def list_warehouses(
    include_inactive: bool = Query(False),
    session: Session = Depends(get_session),
    _=Depends(get_current_user),
):
    return warehouse_service.get_warehouses(session, include_inactive=include_inactive)


@router.post("", response_model=WarehouseRead, status_code=201)
def create_warehouse(
    data: WarehouseCreate,
    session: Session = Depends(get_session),
    _=Depends(require_manager),
):
    try:
        return warehouse_service.create_warehouse(session, data)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.patch("/{warehouse_id}", response_model=WarehouseRead)
def update_warehouse(
    warehouse_id: uuid.UUID,
    data: WarehouseUpdate,
    session: Session = Depends(get_session),
    _=Depends(require_manager),
):
    wh = warehouse_service.get_warehouse(session, warehouse_id)
    if not wh:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    return warehouse_service.update_warehouse(session, wh, data)


# ── Locations ─────────────────────────────────────────────────────────────────

@router.get("/{warehouse_id}/locations", response_model=list[LocationRead])
def list_locations(
    warehouse_id: uuid.UUID,
    location_type: Optional[LocationType] = Query(None),
    include_inactive: bool = Query(False),
    session: Session = Depends(get_session),
    _=Depends(get_current_user),
):
    wh = warehouse_service.get_warehouse(session, warehouse_id)
    if not wh:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    return warehouse_service.get_locations(
        session, warehouse_id, location_type=location_type, include_inactive=include_inactive
    )


@router.post("/{warehouse_id}/locations", response_model=LocationRead, status_code=201)
def create_location(
    warehouse_id: uuid.UUID,
    data: LocationCreate,
    session: Session = Depends(get_session),
    _=Depends(require_manager),
):
    wh = warehouse_service.get_warehouse(session, warehouse_id)
    if not wh:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    return warehouse_service.create_location(session, warehouse_id, data)


@router.patch("/{warehouse_id}/locations/{location_id}", response_model=LocationRead)
def update_location(
    warehouse_id: uuid.UUID,
    location_id: uuid.UUID,
    data: LocationUpdate,
    session: Session = Depends(get_session),
    _=Depends(require_manager),
):
    loc = warehouse_service.get_location(session, location_id)
    if not loc or loc.warehouse_id != warehouse_id:
        raise HTTPException(status_code=404, detail="Location not found")
    return warehouse_service.update_location(session, loc, data)
