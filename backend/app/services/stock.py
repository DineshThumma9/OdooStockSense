import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Tuple

from sqlmodel import Session, func, select

from ..models import (
    DeliveryOrder,
    InternalTransfer,
    LowStockAlert,
    Product,
    Receipt,
    ReorderRule,
    StockAdjustment,
    StockLedger,
    StockLedgerRead,
    StockQuant,
    StockQuantRead,
    Location,
    Warehouse,
)
from ..models.operation import OperationStatus
from ..models.stock import DashboardKPIs, MovementType


# ═══════════════════════════════════════════════════════
# STOCK QUANT — current stock queries
# ═══════════════════════════════════════════════════════

def get_stock_quants(
    session: Session,
    product_id: Optional[uuid.UUID] = None,
    location_id: Optional[uuid.UUID] = None,
    warehouse_id: Optional[uuid.UUID] = None,
) -> List[StockQuant]:
    query = select(StockQuant).where(StockQuant.qty > 0)

    if product_id:
        query = query.where(StockQuant.product_id == product_id)
    if location_id:
        query = query.where(StockQuant.location_id == location_id)
    if warehouse_id:
        # Filter by warehouse via join on location
        query = (
            query.join(Location, StockQuant.location_id == Location.id)
            .where(Location.warehouse_id == warehouse_id)
        )

    return session.exec(query).all()


# ═══════════════════════════════════════════════════════
# STOCK LEDGER — movement history
# ═══════════════════════════════════════════════════════

def get_ledger(
    session: Session,
    product_id: Optional[uuid.UUID] = None,
    movement_type: Optional[MovementType] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    page: int = 1,
    limit: int = 50,
) -> Tuple[List[StockLedger], int]:
    query = select(StockLedger)

    if product_id:
        query = query.where(StockLedger.product_id == product_id)
    if movement_type:
        query = query.where(StockLedger.movement_type == movement_type)
    if from_date:
        query = query.where(StockLedger.created_at >= from_date)
    if to_date:
        query = query.where(StockLedger.created_at <= to_date)

    total = session.exec(select(func.count()).select_from(query.subquery())).one()
    items = session.exec(
        query.order_by(StockLedger.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    ).all()
    return list(items), total


# ═══════════════════════════════════════════════════════
# DASHBOARD KPIs — aggregated snapshot
# ═══════════════════════════════════════════════════════

def get_dashboard_kpis(session: Session) -> DashboardKPIs:
    # Total active products
    total_products = session.exec(
        select(func.count(Product.id)).where(Product.is_active == True)
    ).one()

    # Total stock value (sum of all quant qtys)
    total_stock_value = session.exec(
        select(func.coalesce(func.sum(StockQuant.qty), 0))
    ).one()

    # Products below their reorder_point (low stock)
    all_products = session.exec(
        select(Product).where(Product.is_active == True).where(Product.reorder_point > 0)
    ).all()

    low_stock_count = 0
    out_of_stock_count = 0

    for product in all_products:
        total_qty = session.exec(
            select(func.coalesce(func.sum(StockQuant.qty), 0))
            .where(StockQuant.product_id == product.id)
        ).one()

        if total_qty == 0:
            out_of_stock_count += 1
        elif total_qty <= product.reorder_point:
            low_stock_count += 1

    # Pending operations (not done, not canceled)
    active_statuses = [
        OperationStatus.draft, OperationStatus.waiting, OperationStatus.ready
    ]

    pending_receipts = session.exec(
        select(func.count(Receipt.id)).where(Receipt.status.in_(active_statuses))
    ).one()

    pending_deliveries = session.exec(
        select(func.count(DeliveryOrder.id)).where(
            DeliveryOrder.status.in_(active_statuses)
        )
    ).one()

    scheduled_transfers = session.exec(
        select(func.count(InternalTransfer.id)).where(
            InternalTransfer.status.in_(
                [OperationStatus.draft, OperationStatus.ready]
            )
        )
    ).one()

    # Movements in last 24h
    since = datetime.utcnow() - timedelta(hours=24)
    recent_movements = session.exec(
        select(func.count(StockLedger.id)).where(StockLedger.created_at >= since)
    ).one()

    return DashboardKPIs(
        total_products=total_products,
        total_stock_value=float(total_stock_value),
        low_stock_count=low_stock_count,
        out_of_stock_count=out_of_stock_count,
        pending_receipts=pending_receipts,
        pending_deliveries=pending_deliveries,
        scheduled_transfers=scheduled_transfers,
        recent_movements=recent_movements,
        last_updated=datetime.utcnow(),
    )


# ═══════════════════════════════════════════════════════
# LOW STOCK ALERTS — used by SSE notification stream
# ═══════════════════════════════════════════════════════

def get_low_stock_alerts(session: Session) -> List[LowStockAlert]:
    """Returns all products currently below their reorder_point."""
    alerts = []

    rules = session.exec(select(ReorderRule)).all()
    for rule in rules:
        quant = session.exec(
            select(StockQuant)
            .where(StockQuant.product_id == rule.product_id)
            .where(StockQuant.location_id == rule.location_id)
        ).first()

        current_qty = quant.qty if quant else 0.0

        if current_qty <= rule.min_qty:
            product = session.get(Product, rule.product_id)
            location = session.get(Location, rule.location_id)
            if product and location:
                alerts.append(
                    LowStockAlert(
                        product_id=rule.product_id,
                        product_name=product.name,
                        sku=product.sku,
                        current_qty=current_qty,
                        reorder_point=rule.min_qty,
                        location_id=rule.location_id,
                        location_name=location.name,
                        triggered_at=datetime.utcnow(),
                    )
                )

    return alerts
