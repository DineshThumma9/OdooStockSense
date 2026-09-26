import uuid
from datetime import date, datetime
from enum import Enum
from typing import List, Optional

from sqlmodel import Field, SQLModel

from app.core.utils import utcnow


class OperationStatus(str, Enum):
    draft = "draft"       # Created, not submitted
    waiting = "waiting"   # Waiting for goods / pick assigned
    ready = "ready"       # Ready to validate (goods confirmed / packed)
    done = "done"         # Validated — stock ledger written
    canceled = "canceled" # Canceled — no stock impact


# ═══════════════════════════════════════════════════════════════
# RECEIPTS  (Incoming Goods)
# Flow: draft → waiting → ready → done
# ═══════════════════════════════════════════════════════════════

class ReceiptLineBase(SQLModel):
    product_id: uuid.UUID = Field(foreign_key="products.id")
    expected_qty: float = Field(gt=0)
    done_qty: float = Field(default=0.0, ge=0)  # Filled in when goods arrive


class ReceiptLine(ReceiptLineBase, table=True):
    __tablename__ = "receipt_lines"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    receipt_id: uuid.UUID = Field(foreign_key="receipts.id", index=True)


class ReceiptLineCreate(SQLModel):
    product_id: uuid.UUID
    expected_qty: float = Field(gt=0)


class ReceiptLineRead(ReceiptLineBase):
    id: uuid.UUID
    receipt_id: uuid.UUID


class ReceiptBase(SQLModel):
    supplier_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="suppliers.id"
    )
    destination_location_id: uuid.UUID = Field(foreign_key="locations.id")
    scheduled_date: Optional[date] = None
    notes: Optional[str] = None


class Receipt(ReceiptBase, table=True):
    __tablename__ = "receipts"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    reference: str = Field(unique=True, index=True)  # Auto: REC/2024/0001
    status: OperationStatus = Field(default=OperationStatus.draft)
    created_by: uuid.UUID = Field(foreign_key="users.id")
    validated_by: Optional[uuid.UUID] = Field(
        default=None, foreign_key="users.id"
    )
    validated_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)


class ReceiptCreate(ReceiptBase):
    lines: List[ReceiptLineCreate] = []


class ReceiptRead(ReceiptBase):
    id: uuid.UUID
    reference: str
    status: OperationStatus
    created_by: uuid.UUID
    validated_by: Optional[uuid.UUID]
    validated_at: Optional[datetime]
    created_at: datetime
    lines: List[ReceiptLineRead] = []


class ReceiptUpdate(SQLModel):
    """Only editable while in draft/waiting status"""
    supplier_id: Optional[uuid.UUID] = None
    scheduled_date: Optional[date] = None
    notes: Optional[str] = None


class ReceiptValidate(SQLModel):
    """POST /operations/receipts/{id}/validate — submit actual done quantities"""
    lines: List[dict]  # [{line_id: uuid, done_qty: float}]


# ═══════════════════════════════════════════════════════════════
# DELIVERY ORDERS  (Outgoing Goods)
# Flow: draft → waiting (pick) → ready (pack) → done
# ═══════════════════════════════════════════════════════════════

class DeliveryLineBase(SQLModel):
    product_id: uuid.UUID = Field(foreign_key="products.id")
    qty: float = Field(gt=0)


class DeliveryLine(DeliveryLineBase, table=True):
    __tablename__ = "delivery_lines"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    delivery_id: uuid.UUID = Field(foreign_key="delivery_orders.id", index=True)


class DeliveryLineCreate(DeliveryLineBase):
    pass


class DeliveryLineRead(DeliveryLineBase):
    id: uuid.UUID
    delivery_id: uuid.UUID


class DeliveryOrderBase(SQLModel):
    source_location_id: uuid.UUID = Field(foreign_key="locations.id")
    scheduled_date: Optional[date] = None
    notes: Optional[str] = None


class DeliveryOrder(DeliveryOrderBase, table=True):
    __tablename__ = "delivery_orders"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    reference: str = Field(unique=True, index=True)  # Auto: DEL/2024/0001
    status: OperationStatus = Field(default=OperationStatus.draft)
    created_by: uuid.UUID = Field(foreign_key="users.id")
    validated_by: Optional[uuid.UUID] = Field(
        default=None, foreign_key="users.id"
    )
    validated_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)


class DeliveryOrderCreate(DeliveryOrderBase):
    lines: List[DeliveryLineCreate] = []


class DeliveryOrderRead(DeliveryOrderBase):
    id: uuid.UUID
    reference: str
    status: OperationStatus
    created_by: uuid.UUID
    validated_by: Optional[uuid.UUID]
    validated_at: Optional[datetime]
    created_at: datetime
    lines: List[DeliveryLineRead] = []


# ═══════════════════════════════════════════════════════════════
# INTERNAL TRANSFERS  (Location to Location)
# Flow: draft → ready → done
# ═══════════════════════════════════════════════════════════════

class TransferLineBase(SQLModel):
    product_id: uuid.UUID = Field(foreign_key="products.id")
    qty: float = Field(gt=0)


class TransferLine(TransferLineBase, table=True):
    __tablename__ = "transfer_lines"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    transfer_id: uuid.UUID = Field(
        foreign_key="internal_transfers.id", index=True
    )


class TransferLineCreate(TransferLineBase):
    pass


class TransferLineRead(TransferLineBase):
    id: uuid.UUID
    transfer_id: uuid.UUID


class InternalTransferBase(SQLModel):
    from_location_id: uuid.UUID = Field(foreign_key="locations.id")
    to_location_id: uuid.UUID = Field(foreign_key="locations.id")
    scheduled_date: Optional[date] = None
    notes: Optional[str] = None


class InternalTransfer(InternalTransferBase, table=True):
    __tablename__ = "internal_transfers"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    reference: str = Field(unique=True, index=True)  # Auto: INT/2024/0001
    status: OperationStatus = Field(default=OperationStatus.draft)
    created_by: uuid.UUID = Field(foreign_key="users.id")
    validated_by: Optional[uuid.UUID] = Field(
        default=None, foreign_key="users.id"
    )
    validated_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)


class InternalTransferCreate(InternalTransferBase):
    lines: List[TransferLineCreate] = []


class InternalTransferRead(InternalTransferBase):
    id: uuid.UUID
    reference: str
    status: OperationStatus
    created_by: uuid.UUID
    validated_by: Optional[uuid.UUID]
    validated_at: Optional[datetime]
    created_at: datetime
    lines: List[TransferLineRead] = []


# ═══════════════════════════════════════════════════════════════
# STOCK ADJUSTMENTS  (Physical Count Corrections)
# Flow: draft → done
# ═══════════════════════════════════════════════════════════════

class AdjustmentLineBase(SQLModel):
    product_id: uuid.UUID = Field(foreign_key="products.id")
    # Snapshotted from stock_quant at time of adjustment creation
    system_qty: float = Field(ge=0)
    # What the warehouse staff physically counted
    counted_qty: float = Field(ge=0)


class AdjustmentLine(AdjustmentLineBase, table=True):
    __tablename__ = "adjustment_lines"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    adjustment_id: uuid.UUID = Field(
        foreign_key="stock_adjustments.id", index=True
    )


class AdjustmentLineCreate(SQLModel):
    """Frontend only sends product + counted qty; system_qty is auto-filled"""
    product_id: uuid.UUID
    counted_qty: float = Field(ge=0)


class AdjustmentLineRead(AdjustmentLineBase):
    id: uuid.UUID
    adjustment_id: uuid.UUID

    @property
    def difference(self) -> float:
        """Positive = more than recorded, Negative = loss/damage"""
        return self.counted_qty - self.system_qty


class StockAdjustmentBase(SQLModel):
    location_id: uuid.UUID = Field(foreign_key="locations.id")
    notes: Optional[str] = None


class StockAdjustment(StockAdjustmentBase, table=True):
    __tablename__ = "stock_adjustments"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    reference: str = Field(unique=True, index=True)  # Auto: ADJ/2024/0001
    status: OperationStatus = Field(default=OperationStatus.draft)
    created_by: uuid.UUID = Field(foreign_key="users.id")
    validated_by: Optional[uuid.UUID] = Field(
        default=None, foreign_key="users.id"
    )
    validated_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=utcnow)


class StockAdjustmentCreate(StockAdjustmentBase):
    lines: List[AdjustmentLineCreate] = []


class StockAdjustmentRead(StockAdjustmentBase):
    id: uuid.UUID
    reference: str
    status: OperationStatus
    created_by: uuid.UUID
    validated_by: Optional[uuid.UUID]
    validated_at: Optional[datetime]
    created_at: datetime
    lines: List[AdjustmentLineRead] = []
