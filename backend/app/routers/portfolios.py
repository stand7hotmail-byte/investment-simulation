# backend/app/routers/portfolios.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid
from typing import List, Optional
from decimal import Decimal
import numpy as np
from .. import crud, schemas, models
from ..dependencies import get_db, get_optional_user_id
from ..log_utils import logger

router = APIRouter(prefix="/api/portfolios", tags=["portfolios"])

GUEST_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")

def _sanitize_weights(portfolio):
    if hasattr(portfolio, "allocations") and portfolio.allocations:
        for a in portfolio.allocations:
            a.weight = Decimal(str(np.nan_to_num(float(a.weight))))
    return portfolio

@router.post("", response_model=schemas.Portfolio, status_code=201)
def create_portfolio(portfolio: schemas.PortfolioCreate, db: Session = Depends(get_db), user_id: Optional[uuid.UUID] = Depends(get_optional_user_id)):
    effective_user_id = user_id or GUEST_USER_ID
    try:
        return crud.create_portfolio(db=db, portfolio=portfolio, user_id=effective_user_id)
    except ValueError as e: raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Portfolio creation failed: {e}")
        raise HTTPException(status_code=400, detail="Failed to create portfolio")

@router.get("", response_model=List[schemas.Portfolio])
def read_portfolios(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), user_id: Optional[uuid.UUID] = Depends(get_optional_user_id)):
    effective_user_id = user_id or GUEST_USER_ID
    try:
        portfolios = crud.get_portfolios(db, user_id=effective_user_id, skip=skip, limit=limit)
        return [_sanitize_weights(p) for p in portfolios]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Read portfolios failed: {e}")
        raise HTTPException(status_code=400, detail="Could not retrieve portfolios")

@router.get("/{portfolio_id}", response_model=schemas.Portfolio)
def read_portfolio(portfolio_id: uuid.UUID, db: Session = Depends(get_db), user_id: Optional[uuid.UUID] = Depends(get_optional_user_id)):
    effective_user_id = user_id or GUEST_USER_ID
    try:
        db_portfolio = crud.get_portfolio(db, portfolio_id=portfolio_id, user_id=effective_user_id)
        if db_portfolio is None: raise HTTPException(status_code=404, detail="Portfolio not found")
        return _sanitize_weights(db_portfolio)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Read portfolio failed: {e}")
        raise HTTPException(status_code=400, detail="Could not retrieve portfolio")

@router.put("/{portfolio_id}", response_model=schemas.Portfolio)
def update_portfolio(portfolio_id: uuid.UUID, portfolio: schemas.PortfolioCreate, db: Session = Depends(get_db), user_id: Optional[uuid.UUID] = Depends(get_optional_user_id)):
    effective_user_id = user_id or GUEST_USER_ID
    try:
        db_portfolio = crud.update_portfolio(db, portfolio_id=portfolio_id, user_id=effective_user_id, portfolio_update=portfolio)
        if db_portfolio is None: raise HTTPException(status_code=404, detail="Portfolio not found")
        return _sanitize_weights(db_portfolio)
    except ValueError as e: raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update portfolio failed: {e}")
        raise HTTPException(status_code=400, detail="Failed to update portfolio")

@router.delete("/{portfolio_id}")
def delete_portfolio(portfolio_id: uuid.UUID, db: Session = Depends(get_db), user_id: Optional[uuid.UUID] = Depends(get_optional_user_id)):
    effective_user_id = user_id or GUEST_USER_ID
    try:
        if not crud.delete_portfolio(db, portfolio_id=portfolio_id, user_id=effective_user_id): raise HTTPException(status_code=404, detail="Portfolio not found")
        return {"message": "Portfolio deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete portfolio failed: {e}")
        raise HTTPException(status_code=400, detail="Failed to delete portfolio")

# ALLOCATION ROUTES
@router.post("/{portfolio_id}/allocations", response_model=schemas.PortfolioAllocation, status_code=201)
def create_portfolio_allocation(portfolio_id: uuid.UUID, allocation: schemas.PortfolioAllocationCreate, db: Session = Depends(get_db), user_id: Optional[uuid.UUID] = Depends(get_optional_user_id)):
    effective_user_id = user_id or GUEST_USER_ID
    try:
        portfolio = crud.get_portfolio(db, portfolio_id=portfolio_id, user_id=effective_user_id)
        if not portfolio: raise HTTPException(status_code=404, detail="Portfolio not found")
        return crud.create_portfolio_allocation(db, allocation=allocation, portfolio_id=portfolio_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create allocation failed: {e}")
        raise HTTPException(status_code=400, detail="Failed to create allocation")

@router.get("/{portfolio_id}/allocations", response_model=List[schemas.PortfolioAllocation])
def read_portfolio_allocations(portfolio_id: uuid.UUID, db: Session = Depends(get_db), user_id: Optional[uuid.UUID] = Depends(get_optional_user_id)):
    effective_user_id = user_id or GUEST_USER_ID
    try:
        return crud.get_portfolio_allocations(db, portfolio_id=portfolio_id, user_id=effective_user_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Read allocations failed: {e}")
        raise HTTPException(status_code=400, detail="Could not retrieve allocations")

@router.get("/{portfolio_id}/allocations/{allocation_id}", response_model=schemas.PortfolioAllocation)
def read_portfolio_allocation(portfolio_id: uuid.UUID, allocation_id: uuid.UUID, db: Session = Depends(get_db), user_id: Optional[uuid.UUID] = Depends(get_optional_user_id)):
    effective_user_id = user_id or GUEST_USER_ID
    try:
        db_allocation = crud.get_portfolio_allocation(db, portfolio_id=portfolio_id, allocation_id=allocation_id, user_id=effective_user_id)
        if db_allocation is None: raise HTTPException(status_code=404, detail="Allocation not found")
        return db_allocation
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Read allocation failed: {e}")
        raise HTTPException(status_code=400, detail="Could not retrieve allocation")

@router.put("/{portfolio_id}/allocations/{allocation_id}", response_model=schemas.PortfolioAllocation)
def update_portfolio_allocation(portfolio_id: uuid.UUID, allocation_id: uuid.UUID, allocation: schemas.PortfolioAllocationUpdate, db: Session = Depends(get_db), user_id: Optional[uuid.UUID] = Depends(get_optional_user_id)):
    effective_user_id = user_id or GUEST_USER_ID
    try:
        db_allocation = crud.update_portfolio_allocation(db, portfolio_id=portfolio_id, allocation_id=allocation_id, user_id=effective_user_id, allocation_update=allocation)
        if db_allocation is None: raise HTTPException(status_code=404, detail="Allocation not found")
        return db_allocation
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update allocation failed: {e}")
        raise HTTPException(status_code=400, detail="Failed to update allocation")

@router.delete("/{portfolio_id}/allocations/{allocation_id}")
def delete_portfolio_allocation(portfolio_id: uuid.UUID, allocation_id: uuid.UUID, db: Session = Depends(get_db), user_id: Optional[uuid.UUID] = Depends(get_optional_user_id)):
    effective_user_id = user_id or GUEST_USER_ID
    try:
        if not crud.delete_portfolio_allocation(db, portfolio_id=portfolio_id, allocation_id=allocation_id, user_id=effective_user_id): raise HTTPException(status_code=404, detail="Allocation not found")
        return {"message": "Allocation deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete allocation failed: {e}")
        raise HTTPException(status_code=400, detail="Failed to delete allocation")
