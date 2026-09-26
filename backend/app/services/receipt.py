import uuid
from datetime import datetime
from typing import List, Optional, Tuple

from sqlmodel import Session, func, select

from ..models import Receipt, ReceiptLine, ReceiptCreate, ReceiptUpdate, StockLedger, StockQuant
from ..models.operation import OperationStatus, ReceiptLineCreate
from ..models.stock import MovementType
from ..core.utils import make_reference


def _next_receipt_ref(session: Session) -> str:
    count = session.exec(select(func.count(Receipt.id))).one()
    return make_reference("REC", datetime.utcnow().year, count)


# ═══════════════════════════════════════════════════════
# READ
# ═══════════════════════════════════════════════════════

def get_receipts(
    session: Session,
    status: Optional[OperationStatus] = None,
    supplier_id: Optional[uuid.UUID] = None,
    page: int = 1,
    limit: int = 20,
) -> Tuple[List[Receipt], int]:
    query = select(Receipt)
    if status:
        query = query.where(Receipt.status == status)
    if supplier_id:
        query = query.where(Receipt.supplier_id == supplier_id)

    total = session.exec(select(func.count()).select_from(query.subquery())).one()
    items = session.exec(
        query.order_by(Receipt.created_at.desc()).offset((page - 1) * limit).limit(limit)
    ).all()
    return list(items), total


def get_receipt(session: Session, receipt_id: uuid.UUID) -> Optional[Receipt]:
    return session.get(Receipt, receipt_id)


def get_receipt_lines(session: Session, receipt_id: uuid.UUID) -> List[ReceiptLine]:
    return session.exec(
        select(ReceiptLine).where(ReceiptLine.receipt_id == receipt_id)
    ).all()


# ═══════════════════════════════════════════════════════
# CREATE
# ═══════════════════════════════════════════════════════

def create_receipt(
    session: Session, data: ReceiptCreate, created_by: uuid.UUID
) -> Receipt:
    receipt = Receipt(
        **data.model_dump(exclude={"lines"}),
        reference=_next_receipt_ref(session),
        status=OperationStatus.draft,
        created_by=created_by,
    )
    session.add(receipt)
    session.flush()  # Get receipt.id before inserting lines

    for line_data in data.lines:
        line = ReceiptLine(receipt_id=receipt.id, **line_data.model_dump())
        session.add(line)

    session.commit()
    session.refresh(receipt)
    return receipt


# ═══════════════════════════════════════════════════════
# UPDATE (only draft/waiting)
# ═══════════════════════════════════════════════════════

def update_receipt(
    session: Session, receipt: Receipt, data: ReceiptUpdate
) -> Receipt:
    if receipt.status not in (OperationStatus.draft, OperationStatus.waiting):
        raise ValueError("Can only edit receipts in draft or waiting status")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(receipt, field, value)
    receipt.updated_at = datetime.utcnow()
    session.add(receipt)
    session.commit()
    session.refresh(receipt)
    return receipt


# ═══════════════════════════════════════════════════════
# VALIDATE  →  writes to stock_ledger + stock_quant
# ═══════════════════════════════════════════════════════

def validate_receipt(
    session: Session,
    receipt: Receipt,
    line_updates: List[dict],  # [{"line_id": uuid, "done_qty": float}]
    validated_by: uuid.UUID,
) -> Receipt:
    if receipt.status == OperationStatus.done:
        raise ValueError("Receipt is already validated")
    if receipt.status == OperationStatus.canceled:
        raise ValueError("Cannot validate a canceled receipt")

    lines = get_receipt_lines(session, receipt.id)
    line_map = {str(line.id): line for line in lines}

    # Apply actual received quantities
    for update in line_updates:
        line = line_map.get(str(update["line_id"]))
        if line and update["done_qty"] >= 0:
            line.done_qty = update["done_qty"]
            session.add(line)

    session.flush()

    # Write ledger + update quant for each line with done_qty > 0
    for line in lines:
        if line.done_qty <= 0:
            continue

        # Append-only ledger entry: from_location=None = goods arriving from outside
        ledger = StockLedger(
            product_id=line.product_id,
            from_location_id=None,
            to_location_id=receipt.destination_location_id,
            qty=line.done_qty,
            movement_type=MovementType.receipt,
            reference_id=receipt.id,
            reference_ref=receipt.reference,
            created_by=validated_by,
        )
        session.add(ledger)

        # Update or create quant (materialized cache)
        quant = session.exec(
            select(StockQuant)
            .where(StockQuant.product_id == line.product_id)
            .where(StockQuant.location_id == receipt.destination_location_id)
        ).first()

        if quant:
            quant.qty += line.done_qty
            quant.updated_at = datetime.utcnow()
        else:
            quant = StockQuant(
                product_id=line.product_id,
                location_id=receipt.destination_location_id,
                qty=line.done_qty,
            )
        session.add(quant)

    # Mark receipt done
    receipt.status = OperationStatus.done
    receipt.validated_by = validated_by
    receipt.validated_at = datetime.utcnow()
    receipt.updated_at = datetime.utcnow()
    session.add(receipt)
    session.commit()
    session.refresh(receipt)
    return receipt


# ═══════════════════════════════════════════════════════
# CANCEL
# ═══════════════════════════════════════════════════════

def cancel_receipt(session: Session, receipt: Receipt) -> Receipt:
    if receipt.status == OperationStatus.done:
        raise ValueError("Cannot cancel a completed receipt — create an adjustment instead")
    receipt.status = OperationStatus.canceled
    receipt.updated_at = datetime.utcnow()
    session.add(receipt)
    session.commit()
    session.refresh(receipt)
    return receipt
