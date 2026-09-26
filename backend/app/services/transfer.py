import uuid
from datetime import datetime
from typing import List, Optional, Tuple

from sqlmodel import Session, func, select

from ..models import (
    InternalTransfer,
    InternalTransferCreate,
    StockLedger,
    StockQuant,
    TransferLine,
)
from ..models.operation import OperationStatus
from ..models.stock import MovementType
from ..core.utils import make_reference


def _next_transfer_ref(session: Session) -> str:
    count = session.exec(select(func.count(InternalTransfer.id))).one()
    return make_reference("INT", datetime.utcnow().year, count)


# ═══════════════════════════════════════════════════════
# READ
# ═══════════════════════════════════════════════════════

def get_transfers(
    session: Session,
    status: Optional[OperationStatus] = None,
    from_location_id: Optional[uuid.UUID] = None,
    to_location_id: Optional[uuid.UUID] = None,
    page: int = 1,
    limit: int = 20,
) -> Tuple[List[InternalTransfer], int]:
    query = select(InternalTransfer)
    if status:
        query = query.where(InternalTransfer.status == status)
    if from_location_id:
        query = query.where(InternalTransfer.from_location_id == from_location_id)
    if to_location_id:
        query = query.where(InternalTransfer.to_location_id == to_location_id)

    total = session.exec(select(func.count()).select_from(query.subquery())).one()
    items = session.exec(
        query.order_by(InternalTransfer.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    ).all()
    return list(items), total


def get_transfer(
    session: Session, transfer_id: uuid.UUID
) -> Optional[InternalTransfer]:
    return session.get(InternalTransfer, transfer_id)


def get_transfer_lines(
    session: Session, transfer_id: uuid.UUID
) -> List[TransferLine]:
    return session.exec(
        select(TransferLine).where(TransferLine.transfer_id == transfer_id)
    ).all()


# ═══════════════════════════════════════════════════════
# CREATE
# ═══════════════════════════════════════════════════════

def create_transfer(
    session: Session, data: InternalTransferCreate, created_by: uuid.UUID
) -> InternalTransfer:
    if data.from_location_id == data.to_location_id:
        raise ValueError("Source and destination locations must be different")

    transfer = InternalTransfer(
        **data.model_dump(exclude={"lines"}),
        reference=_next_transfer_ref(session),
        status=OperationStatus.draft,
        created_by=created_by,
    )
    session.add(transfer)
    session.flush()

    for line_data in data.lines:
        line = TransferLine(transfer_id=transfer.id, **line_data.model_dump())
        session.add(line)

    session.commit()
    session.refresh(transfer)
    return transfer


# ═══════════════════════════════════════════════════════
# VALIDATE  →  stock MOVES from→to (2 ledger entries per line)
# ═══════════════════════════════════════════════════════

def validate_transfer(
    session: Session, transfer: InternalTransfer, validated_by: uuid.UUID
) -> InternalTransfer:
    if transfer.status == OperationStatus.done:
        raise ValueError("Transfer already validated")
    if transfer.status == OperationStatus.canceled:
        raise ValueError("Cannot validate a canceled transfer")

    lines = get_transfer_lines(session, transfer.id)

    for line in lines:
        # Check stock at source
        src_quant = session.exec(
            select(StockQuant)
            .where(StockQuant.product_id == line.product_id)
            .where(StockQuant.location_id == transfer.from_location_id)
        ).first()

        available = src_quant.qty if src_quant else 0
        if available < line.qty:
            raise ValueError(
                f"Insufficient stock at source for product {line.product_id}: "
                f"need {line.qty}, have {available}"
            )

        # Single ledger entry captures the move (from → to, both set)
        ledger = StockLedger(
            product_id=line.product_id,
            from_location_id=transfer.from_location_id,
            to_location_id=transfer.to_location_id,
            qty=line.qty,
            movement_type=MovementType.transfer,
            reference_id=transfer.id,
            reference_ref=transfer.reference,
            created_by=validated_by,
        )
        session.add(ledger)

        # Decrease source quant
        src_quant.qty -= line.qty
        src_quant.updated_at = datetime.utcnow()
        session.add(src_quant)

        # Increase (or create) destination quant
        dst_quant = session.exec(
            select(StockQuant)
            .where(StockQuant.product_id == line.product_id)
            .where(StockQuant.location_id == transfer.to_location_id)
        ).first()

        if dst_quant:
            dst_quant.qty += line.qty
            dst_quant.updated_at = datetime.utcnow()
        else:
            dst_quant = StockQuant(
                product_id=line.product_id,
                location_id=transfer.to_location_id,
                qty=line.qty,
            )
        session.add(dst_quant)

    transfer.status = OperationStatus.done
    transfer.validated_by = validated_by
    transfer.validated_at = datetime.utcnow()
    transfer.updated_at = datetime.utcnow()
    session.add(transfer)
    session.commit()
    session.refresh(transfer)
    return transfer


# ═══════════════════════════════════════════════════════
# CANCEL
# ═══════════════════════════════════════════════════════

def cancel_transfer(
    session: Session, transfer: InternalTransfer
) -> InternalTransfer:
    if transfer.status == OperationStatus.done:
        raise ValueError("Cannot cancel a completed transfer")
    transfer.status = OperationStatus.canceled
    transfer.updated_at = datetime.utcnow()
    session.add(transfer)
    session.commit()
    session.refresh(transfer)
    return transfer
