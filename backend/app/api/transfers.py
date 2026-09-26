import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from ..core.db import get_session
from ..core.deps import get_current_user
from ..models import InternalTransferCreate, InternalTransferRead, User
from ..models.operation import OperationStatus
from ..services import transfer as transfer_service

router = APIRouter(prefix="/operations/transfers", tags=["Transfers"])


@router.get("", response_model=dict)
def list_transfers(
    status: Optional[OperationStatus] = Query(None),
    from_location_id: Optional[uuid.UUID] = Query(None),
    to_location_id: Optional[uuid.UUID] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    session: Session = Depends(get_session),
    _=Depends(get_current_user),
):
    items, total = transfer_service.get_transfers(
        session,
        status=status,
        from_location_id=from_location_id,
        to_location_id=to_location_id,
        page=page,
        limit=limit,
    )
    return {
        "items": [InternalTransferRead.model_validate(t) for t in items],
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.post("", response_model=InternalTransferRead, status_code=201)
def create_transfer(
    data: InternalTransferCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    try:
        return InternalTransferRead.model_validate(
            transfer_service.create_transfer(session, data, current_user.id)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{transfer_id}", response_model=InternalTransferRead)
def get_transfer(
    transfer_id: uuid.UUID,
    session: Session = Depends(get_session),
    _=Depends(get_current_user),
):
    t = transfer_service.get_transfer(session, transfer_id)
    if not t:
        raise HTTPException(status_code=404, detail="Transfer not found")
    return InternalTransferRead.model_validate(t)


@router.post("/{transfer_id}/validate", response_model=InternalTransferRead)
def validate_transfer(
    transfer_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    t = transfer_service.get_transfer(session, transfer_id)
    if not t:
        raise HTTPException(status_code=404, detail="Transfer not found")
    try:
        return InternalTransferRead.model_validate(
            transfer_service.validate_transfer(session, t, current_user.id)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{transfer_id}/cancel", response_model=InternalTransferRead)
def cancel_transfer(
    transfer_id: uuid.UUID,
    session: Session = Depends(get_session),
    _=Depends(get_current_user),
):
    t = transfer_service.get_transfer(session, transfer_id)
    if not t:
        raise HTTPException(status_code=404, detail="Transfer not found")
    try:
        return InternalTransferRead.model_validate(
            transfer_service.cancel_transfer(session, t)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
