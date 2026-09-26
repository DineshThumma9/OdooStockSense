import uuid
from datetime import datetime
from typing import List, Optional, Tuple

from sqlmodel import Session, func, select

from ..models import (
    AdjustmentLine,
    StockAdjustment,
    StockAdjustmentCreate,
    StockLedger,
    StockQuant,
)
from ..models.operation import AdjustmentLineCreate, OperationStatus
from ..models.stock import MovementType
from ..core.utils import make_reference


def _next_adjustment_ref(session: Session) -> str:
    count = session.exec(select(func.count(StockAdjustment.id))).one()
    return make_reference("ADJ", datetime.utcnow().year, count)


# ═══════════════════════════════════════════════════════
# READ
# ═══════════════════════════════════════════════════════

def get_adjustments(
    session: Session,
    status: Optional[OperationStatus] = None,
    location_id: Optional[uuid.UUID] = None,
    page: int = 1,
    limit: int = 20,
) -> Tuple[List[StockAdjustment], int]:
    query = select(StockAdjustment)
    if status:
        query = query.where(StockAdjustment.status == status)
    if location_id:
        query = query.where(StockAdjustment.location_id == location_id)

    total = session.exec(select(func.count()).select_from(query.subquery())).one()
    items = session.exec(
        query.order_by(StockAdjustment.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    ).all()
    return list(items), total


def get_adjustment(
    session: Session, adjustment_id: uuid.UUID
) -> Optional[StockAdjustment]:
    return session.get(StockAdjustment, adjustment_id)


def get_adjustment_lines(
    session: Session, adjustment_id: uuid.UUID
) -> List[AdjustmentLine]:
    return session.exec(
        select(AdjustmentLine).where(AdjustmentLine.adjustment_id == adjustment_id)
    ).all()


# ═══════════════════════════════════════════════════════
# CREATE  →  auto-fills system_qty from stock_quant
# ═══════════════════════════════════════════════════════

def create_adjustment(
    session: Session, data: StockAdjustmentCreate, created_by: uuid.UUID
) -> StockAdjustment:
    adjustment = StockAdjustment(
        **data.model_dump(exclude={"lines"}),
        reference=_next_adjustment_ref(session),
        status=OperationStatus.draft,
        created_by=created_by,
    )
    session.add(adjustment)
    session.flush()

    for line_data in data.lines:
        # Snapshot current system qty from stock_quant
        quant = session.exec(
            select(StockQuant)
            .where(StockQuant.product_id == line_data.product_id)
            .where(StockQuant.location_id == data.location_id)
        ).first()
        system_qty = quant.qty if quant else 0.0

        line = AdjustmentLine(
            adjustment_id=adjustment.id,
            product_id=line_data.product_id,
            system_qty=system_qty,
            counted_qty=line_data.counted_qty,
        )
        session.add(line)

    session.commit()
    session.refresh(adjustment)
    return adjustment


# ═══════════════════════════════════════════════════════
# VALIDATE  →  applies the difference to stock_quant + ledger
# ═══════════════════════════════════════════════════════

def validate_adjustment(
    session: Session, adjustment: StockAdjustment, validated_by: uuid.UUID
) -> StockAdjustment:
    if adjustment.status == OperationStatus.done:
        raise ValueError("Adjustment already validated")
    if adjustment.status == OperationStatus.canceled:
        raise ValueError("Cannot validate a canceled adjustment")

    lines = get_adjustment_lines(session, adjustment.id)

    for line in lines:
        difference = line.counted_qty - line.system_qty

        if difference == 0:
            continue  # No change needed

        # Determine movement direction based on difference sign
        if difference > 0:
            # Gain: goods appear (e.g. found items) → like a mini receipt
            ledger = StockLedger(
                product_id=line.product_id,
                from_location_id=None,
                to_location_id=adjustment.location_id,
                qty=difference,
                movement_type=MovementType.adjustment,
                reference_id=adjustment.id,
                reference_ref=adjustment.reference,
                created_by=validated_by,
            )
        else:
            # Loss: goods disappear (e.g. damaged/stolen) → like a mini delivery
            ledger = StockLedger(
                product_id=line.product_id,
                from_location_id=adjustment.location_id,
                to_location_id=None,
                qty=abs(difference),
                movement_type=MovementType.adjustment,
                reference_id=adjustment.id,
                reference_ref=adjustment.reference,
                created_by=validated_by,
            )
        session.add(ledger)

        # Update quant to the physically counted value
        quant = session.exec(
            select(StockQuant)
            .where(StockQuant.product_id == line.product_id)
            .where(StockQuant.location_id == adjustment.location_id)
        ).first()

        if quant:
            quant.qty = line.counted_qty
            quant.updated_at = datetime.utcnow()
        else:
            quant = StockQuant(
                product_id=line.product_id,
                location_id=adjustment.location_id,
                qty=line.counted_qty,
            )
        session.add(quant)

    adjustment.status = OperationStatus.done
    adjustment.validated_by = validated_by
    adjustment.validated_at = datetime.utcnow()
    session.add(adjustment)
    session.commit()
    session.refresh(adjustment)
    return adjustment


# ═══════════════════════════════════════════════════════
# CANCEL
# ═══════════════════════════════════════════════════════

def cancel_adjustment(
    session: Session, adjustment: StockAdjustment
) -> StockAdjustment:
    if adjustment.status == OperationStatus.done:
        raise ValueError("Cannot cancel a completed adjustment")
    adjustment.status = OperationStatus.canceled
    session.add(adjustment)
    session.commit()
    session.refresh(adjustment)
    return adjustment
