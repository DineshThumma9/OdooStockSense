import asyncio
import json
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session
from sse_starlette.sse import EventSourceResponse

from ..core.db import get_session
from ..core.deps import get_current_user
from ..models import StockLedgerRead, StockQuantRead
from ..models.stock import DashboardKPIs, MovementType
from ..services import stock as stock_service

router = APIRouter(tags=["Stock"])


# ── Dashboard — REST snapshot ─────────────────────────────────────────────────

@router.get("/dashboard", response_model=DashboardKPIs)
def get_dashboard(
    session: Session = Depends(get_session),
    _=Depends(get_current_user),
):
    return stock_service.get_dashboard_kpis(session)


# ── Dashboard — SSE live stream ───────────────────────────────────────────────

@router.get("/dashboard/stream")
async def dashboard_stream(_=Depends(get_current_user)):
    """Server-Sent Events: pushes DashboardKPIs every 5 seconds."""

    async def event_generator():
        while True:
            # Each SSE push gets a fresh session
            from ..core.db import engine
            from sqlmodel import Session as SyncSession

            with SyncSession(engine) as session:
                kpis = stock_service.get_dashboard_kpis(session)
                # Serialize datetime for JSON
                data = kpis.model_dump()
                data["last_updated"] = data["last_updated"].isoformat()

            yield {"data": json.dumps(data), "event": "kpi_update"}
            await asyncio.sleep(5)

    return EventSourceResponse(event_generator())


# ── Notifications — SSE low-stock alerts ─────────────────────────────────────

@router.get("/notifications/stream")
async def notifications_stream(_=Depends(get_current_user)):
    """Server-Sent Events: pushes LowStockAlert for every product below reorder_point."""

    async def event_generator():
        while True:
            from ..core.db import engine
            from sqlmodel import Session as SyncSession

            with SyncSession(engine) as session:
                alerts = stock_service.get_low_stock_alerts(session)

            for alert in alerts:
                data = alert.model_dump()
                data["triggered_at"] = data["triggered_at"].isoformat()
                data["product_id"] = str(data["product_id"])
                data["location_id"] = str(data["location_id"])
                yield {"data": json.dumps(data), "event": "low_stock_alert"}

            await asyncio.sleep(30)  # Check every 30 seconds

    return EventSourceResponse(event_generator())


# ── Stock Quant — current stock ───────────────────────────────────────────────

@router.get("/stock/quant", response_model=list[StockQuantRead])
def get_stock_quant(
    product_id: Optional[uuid.UUID] = Query(None),
    location_id: Optional[uuid.UUID] = Query(None),
    warehouse_id: Optional[uuid.UUID] = Query(None),
    session: Session = Depends(get_session),
    _=Depends(get_current_user),
):
    return stock_service.get_stock_quants(
        session,
        product_id=product_id,
        location_id=location_id,
        warehouse_id=warehouse_id,
    )


# ── Stock Ledger — movement history ──────────────────────────────────────────

@router.get("/stock/ledger", response_model=dict)
def get_stock_ledger(
    product_id: Optional[uuid.UUID] = Query(None),
    movement_type: Optional[MovementType] = Query(None),
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    session: Session = Depends(get_session),
    _=Depends(get_current_user),
):
    items, total = stock_service.get_ledger(
        session,
        product_id=product_id,
        movement_type=movement_type,
        from_date=from_date,
        to_date=to_date,
        page=page,
        limit=limit,
    )
    return {
        "items": [StockLedgerRead.model_validate(l) for l in items],
        "total": total,
        "page": page,
        "limit": limit,
    }
