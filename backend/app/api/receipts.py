import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session

from ..core.db import get_session
from ..core.deps import get_current_user
from ..models import (
    ReceiptCreate,
    ReceiptRead,
    ReceiptUpdate,
    ReceiptValidate,
    User,
)
from ..models.operation import OperationStatus
from ..services import receipt as receipt_service

router = APIRouter(prefix="/operations/receipts", tags=["Receipts"])


@router.get("", response_model=dict)
def list_receipts(
    status: Optional[OperationStatus] = Query(None),
    supplier_id: Optional[uuid.UUID] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    session: Session = Depends(get_session),
    _=Depends(get_current_user),
):
    items, total = receipt_service.get_receipts(
        session, status=status, supplier_id=supplier_id, page=page, limit=limit
    )
    return {
        "items": [ReceiptRead.model_validate(r) for r in items],
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.post("", response_model=ReceiptRead, status_code=201)
def create_receipt(
    data: ReceiptCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    receipt = receipt_service.create_receipt(session, data, current_user.id)
    return ReceiptRead.model_validate(receipt)


@router.get("/{receipt_id}", response_model=ReceiptRead)
def get_receipt(
    receipt_id: uuid.UUID,
    session: Session = Depends(get_session),
    _=Depends(get_current_user),
):
    receipt = receipt_service.get_receipt(session, receipt_id)
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return ReceiptRead.model_validate(receipt)


@router.put("/{receipt_id}", response_model=ReceiptRead)
def update_receipt(
    receipt_id: uuid.UUID,
    data: ReceiptUpdate,
    session: Session = Depends(get_session),
    _=Depends(get_current_user),
):
    receipt = receipt_service.get_receipt(session, receipt_id)
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    try:
        updated = receipt_service.update_receipt(session, receipt, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return ReceiptRead.model_validate(updated)


@router.post("/{receipt_id}/validate", response_model=ReceiptRead)
def validate_receipt(
    receipt_id: uuid.UUID,
    data: ReceiptValidate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    receipt = receipt_service.get_receipt(session, receipt_id)
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    try:
        validated = receipt_service.validate_receipt(
            session, receipt, data.lines, current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return ReceiptRead.model_validate(validated)


@router.post("/{receipt_id}/cancel", response_model=ReceiptRead)
def cancel_receipt(
    receipt_id: uuid.UUID,
    session: Session = Depends(get_session),
    _=Depends(get_current_user),
):
    receipt = receipt_service.get_receipt(session, receipt_id)
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    try:
        canceled = receipt_service.cancel_receipt(session, receipt)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return ReceiptRead.model_validate(canceled)
