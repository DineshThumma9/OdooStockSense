import uuid
from datetime import datetime
from typing import List, Optional, Tuple

from sqlmodel import Session, func, select

from ..models import (
    DeliveryLine,
    DeliveryOrder,
    DeliveryOrderCreate,
    StockLedger,
    StockQuant,
)
from ..models.operation import OperationStatus
from ..models.stock import MovementType
from ..core.utils import make_reference


def _next_delivery_ref(session: Session) -> str:
    count = session.exec(select(func.count(DeliveryOrder.id))).one()
    return make_reference("DEL", datetime.utcnow().year, count)


# ═══════════════════════════════════════════════════════
# READ
# ═══════════════════════════════════════════════════════

def get_deliveries(
    session: Session,
    status: Optional[OperationStatus] = None,
    page: int = 1,
    limit: int = 20,
) -> Tuple[List[DeliveryOrder], int]:
    query = select(DeliveryOrder)
    if status:
        query = query.where(DeliveryOrder.status == status)

    total = session.exec(select(func.count()).select_from(query.subquery())).one()
    items = session.exec(
        query.order_by(DeliveryOrder.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    ).all()
    return list(items), total


def get_delivery(
    session: Session, delivery_id: uuid.UUID
) -> Optional[DeliveryOrder]:
    return session.get(DeliveryOrder, delivery_id)


def get_delivery_lines(
    session: Session, delivery_id: uuid.UUID
) -> List[DeliveryLine]:
    return session.exec(
        select(DeliveryLine).where(DeliveryLine.delivery_id == delivery_id)
    ).all()


# ═══════════════════════════════════════════════════════
# CREATE
# ═══════════════════════════════════════════════════════

def create_delivery(
    session: Session, data: DeliveryOrderCreate, created_by: uuid.UUID
) -> DeliveryOrder:
    delivery = DeliveryOrder(
        **data.model_dump(exclude={"lines"}),
        reference=_next_delivery_ref(session),
        status=OperationStatus.draft,
        created_by=created_by,
    )
    session.add(delivery)
    session.flush()

    for line_data in data.lines:
        line = DeliveryLine(delivery_id=delivery.id, **line_data.model_dump())
        session.add(line)

    session.commit()
    session.refresh(delivery)
    return delivery


# ═══════════════════════════════════════════════════════
# VALIDATE  →  stock DECREASES from source location
# ═══════════════════════════════════════════════════════

def validate_delivery(
    session: Session, delivery: DeliveryOrder, validated_by: uuid.UUID
) -> DeliveryOrder:
    if delivery.status == OperationStatus.done:
        raise ValueError("Delivery already validated")
    if delivery.status == OperationStatus.canceled:
        raise ValueError("Cannot validate a canceled delivery")

    lines = get_delivery_lines(session, delivery.id)

    for line in lines:
        # Check sufficient stock
        quant = session.exec(
            select(StockQuant)
            .where(StockQuant.product_id == line.product_id)
            .where(StockQuant.location_id == delivery.source_location_id)
        ).first()

        available = quant.qty if quant else 0
        if available < line.qty:
            raise ValueError(
                f"Insufficient stock for product {line.product_id}: "
                f"need {line.qty}, have {available}"
            )

        # Ledger entry: to_location=None = goods leaving the system
        ledger = StockLedger(
            product_id=line.product_id,
            from_location_id=delivery.source_location_id,
            to_location_id=None,
            qty=line.qty,
            movement_type=MovementType.delivery,
            reference_id=delivery.id,
            reference_ref=delivery.reference,
            created_by=validated_by,
        )
        session.add(ledger)

        # Decrease quant
        quant.qty -= line.qty
        quant.updated_at = datetime.utcnow()
        session.add(quant)

    delivery.status = OperationStatus.done
    delivery.validated_by = validated_by
    delivery.validated_at = datetime.utcnow()
    delivery.updated_at = datetime.utcnow()
    session.add(delivery)
    session.commit()
    session.refresh(delivery)
    return delivery


# ═══════════════════════════════════════════════════════
# CANCEL
# ═══════════════════════════════════════════════════════

def cancel_delivery(session: Session, delivery: DeliveryOrder) -> DeliveryOrder:
    if delivery.status == OperationStatus.done:
        raise ValueError("Cannot cancel a completed delivery")
    delivery.status = OperationStatus.canceled
    delivery.updated_at = datetime.utcnow()
    session.add(delivery)
    session.commit()
    session.refresh(delivery)
    return delivery
