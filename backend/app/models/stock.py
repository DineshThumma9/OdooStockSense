import uuid
from datetime import datetime
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel

from app.core.utils import utcnow


class MovementType(str, Enum):
    receipt = "receipt"
    delivery = "delivery"
    transfer = "transfer"
    adjustment = "adjustment"


# ═══════════════════════════════════════════════════════════════
# STOCK LEDGER — Source of Truth, Append-Only
#
# RULE: Never UPDATE or DELETE rows here.
# Every validated operation writes entries here.
# Current stock = SUM(to_location entries) - SUM(from_location entries)
# ═══════════════════════════════════════════════════════════════

class StockLedger(SQLModel, table=True):
    __tablename__ = "stock_ledger"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    product_id: uuid.UUID = Field(foreign_key="products.id", index=True)

    # Receipts: from_location_id = None (goods come from outside)
    from_location_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="locations.id", index=True
    )
    # Deliveries: to_location_id = None (goods leave the system)
    to_location_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="locations.id", index=True
    )

    qty: float = Field(gt=0)  # Always positive; direction determined by from/to
    movement_type: MovementType

    # Traceability back to the source operation
    reference_id: uuid.UUID       # UUID of the receipt/delivery/transfer/adjustment
    reference_ref: str            # Human ref e.g. "REC/2024/0001"

    created_by: uuid.UUID = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=utcnow)


class StockLedgerRead(SQLModel):
    id: uuid.UUID
    product_id: uuid.UUID
    from_location_id: Optional[uuid.UUID]
    to_location_id: Optional[uuid.UUID]
    qty: float
    movement_type: MovementType
    reference_ref: str
    created_by: uuid.UUID
    created_at: datetime


# ═══════════════════════════════════════════════════════════════
# STOCK QUANT — Materialized Current Stock Cache
#
# Updated atomically inside a DB transaction on every validate.
# Unique per (product_id, location_id) pair.
# Use this for dashboard reads — O(1) lookup vs scanning the ledger.
# ═══════════════════════════════════════════════════════════════

class StockQuant(SQLModel, table=True):
    __tablename__ = "stock_quant"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    product_id: uuid.UUID = Field(foreign_key="products.id", index=True)
    location_id: uuid.UUID = Field(foreign_key="locations.id", index=True)
    qty: float = Field(default=0.0)
    updated_at: datetime = Field(default_factory=utcnow)

    # DB-level unique constraint enforced via Alembic migration:
    # UniqueConstraint("product_id", "location_id", name="uq_stock_quant")


class StockQuantRead(SQLModel):
    id: uuid.UUID
    product_id: uuid.UUID
    location_id: uuid.UUID
    qty: float
    updated_at: datetime


# ═══════════════════════════════════════════════════════════════
# DASHBOARD  — Aggregated KPI Schema
# Used by both GET /dashboard (JSON) and GET /dashboard/stream (SSE)
# ═══════════════════════════════════════════════════════════════

class DashboardKPIs(SQLModel):
    total_products: int
    total_stock_value: float         # Sum of all stock_quant.qty (unit count)
    low_stock_count: int             # Products below reorder_point
    out_of_stock_count: int          # Products with 0 total stock
    pending_receipts: int            # Receipts in draft/waiting/ready
    pending_deliveries: int          # Deliveries in draft/waiting/ready
    scheduled_transfers: int         # Transfers in draft/ready
    recent_movements: int            # Ledger entries in last 24h
    last_updated: datetime


class LowStockAlert(SQLModel):
    """Pushed via SSE /notifications/stream when stock hits reorder_point"""
    product_id: uuid.UUID
    product_name: str
    sku: str
    current_qty: float
    reorder_point: float
    location_id: uuid.UUID
    location_name: str
    triggered_at: datetime
