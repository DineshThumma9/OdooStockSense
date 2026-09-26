import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from ..core.db import get_session
from ..core.deps import get_current_user
from ..models import StockAdjustmentCreate, StockAdjustmentRead, User
from ..models.operation import OperationStatus
from ..services import adjustment as adjustment_service

router = APIRouter(prefix="/operations/adjustments", tags=["Adjustments"])


@router.get("", response_model=dict)
def list_adjustments(
    status: Optional[OperationStatus] = Query(None),
    location_id: Optional[uuid.UUID] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    session: Session = Depends(get_session),
    _=Depends(get_current_user),
):
    items, total = adjustment_service.get_adjustments(
        session, status=status, location_id=location_id, page=page, limit=limit
    )
    return {
        "items": [StockAdjustmentRead.model_validate(a) for a in items],
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.post("", response_model=StockAdjustmentRead, status_code=201)
def create_adjustment(
    data: StockAdjustmentCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return StockAdjustmentRead.model_validate(
        adjustment_service.create_adjustment(session, data, current_user.id)
    )


@router.get("/{adjustment_id}", response_model=StockAdjustmentRead)
def get_adjustment(
    adjustment_id: uuid.UUID,
    session: Session = Depends(get_session),
    _=Depends(get_current_user),
):
    a = adjustment_service.get_adjustment(session, adjustment_id)
    if not a:
        raise HTTPException(status_code=404, detail="Adjustment not found")
    return StockAdjustmentRead.model_validate(a)


@router.post("/{adjustment_id}/validate", response_model=StockAdjustmentRead)
def validate_adjustment(
    adjustment_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    a = adjustment_service.get_adjustment(session, adjustment_id)
    if not a:
        raise HTTPException(status_code=404, detail="Adjustment not found")
    try:
        return StockAdjustmentRead.model_validate(
            adjustment_service.validate_adjustment(session, a, current_user.id)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{adjustment_id}/cancel", response_model=StockAdjustmentRead)
def cancel_adjustment(
    adjustment_id: uuid.UUID,
    session: Session = Depends(get_session),
    _=Depends(get_current_user),
):
    a = adjustment_service.get_adjustment(session, adjustment_id)
    if not a:
        raise HTTPException(status_code=404, detail="Adjustment not found")
    try:
        return StockAdjustmentRead.model_validate(
            adjustment_service.cancel_adjustment(session, a)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
