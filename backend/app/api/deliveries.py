import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from ..core.db import get_session
from ..core.deps import get_current_user
from ..models import DeliveryOrderCreate, DeliveryOrderRead, User
from ..models.operation import OperationStatus
from ..services import delivery as delivery_service

router = APIRouter(prefix="/operations/deliveries", tags=["Deliveries"])


@router.get("", response_model=dict)
def list_deliveries(
    status: Optional[OperationStatus] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    session: Session = Depends(get_session),
    _=Depends(get_current_user),
):
    items, total = delivery_service.get_deliveries(
        session, status=status, page=page, limit=limit
    )
    return {
        "items": [DeliveryOrderRead.model_validate(d) for d in items],
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.post("", response_model=DeliveryOrderRead, status_code=201)
def create_delivery(
    data: DeliveryOrderCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return DeliveryOrderRead.model_validate(
        delivery_service.create_delivery(session, data, current_user.id)
    )


@router.get("/{delivery_id}", response_model=DeliveryOrderRead)
def get_delivery(
    delivery_id: uuid.UUID,
    session: Session = Depends(get_session),
    _=Depends(get_current_user),
):
    d = delivery_service.get_delivery(session, delivery_id)
    if not d:
        raise HTTPException(status_code=404, detail="Delivery not found")
    return DeliveryOrderRead.model_validate(d)


@router.post("/{delivery_id}/validate", response_model=DeliveryOrderRead)
def validate_delivery(
    delivery_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    d = delivery_service.get_delivery(session, delivery_id)
    if not d:
        raise HTTPException(status_code=404, detail="Delivery not found")
    try:
        return DeliveryOrderRead.model_validate(
            delivery_service.validate_delivery(session, d, current_user.id)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{delivery_id}/cancel", response_model=DeliveryOrderRead)
def cancel_delivery(
    delivery_id: uuid.UUID,
    session: Session = Depends(get_session),
    _=Depends(get_current_user),
):
    d = delivery_service.get_delivery(session, delivery_id)
    if not d:
        raise HTTPException(status_code=404, detail="Delivery not found")
    try:
        return DeliveryOrderRead.model_validate(
            delivery_service.cancel_delivery(session, d)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
