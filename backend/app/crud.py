from sqlalchemy.orm import Session
from sqlalchemy import cast, String
from sqlalchemy.dialects.postgresql import JSONB
import uuid
import json
from . import models, schemas
from typing import List, Optional
from decimal import Decimal

def create_portfolio(db: Session, portfolio: schemas.PortfolioCreate, user_id: uuid.UUID) -> models.Portfolio:
    db_portfolio = models.Portfolio(
        user_id=user_id,
        name=portfolio.name,
        description=portfolio.description
    )
    db.add(db_portfolio)
    db.commit()
    db.refresh(db_portfolio)

    if portfolio.allocations:
        for allocation in portfolio.allocations:
            db_allocation = models.PortfolioAllocation(
                portfolio_id=db_portfolio.id,
                asset_code=allocation.asset_code,
                weight=allocation.weight
            )
            db.add(db_allocation)
        db.commit()
        db.refresh(db_portfolio)
    
    return db_portfolio

def get_portfolios(db: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[models.Portfolio]:
    return db.query(models.Portfolio).filter(models.Portfolio.user_id == user_id).offset(skip).limit(limit).all()

def get_portfolio(db: Session, portfolio_id: uuid.UUID, user_id: uuid.UUID) -> Optional[models.Portfolio]:
    return db.query(models.Portfolio).filter(models.Portfolio.id == portfolio_id, models.Portfolio.user_id == user_id).first()

def update_portfolio(db: Session, portfolio_id: uuid.UUID, user_id: uuid.UUID, portfolio_update: schemas.PortfolioCreate) -> Optional[models.Portfolio]:
    db_portfolio = db.query(models.Portfolio).filter(models.Portfolio.id == portfolio_id, models.Portfolio.user_id == user_id).first()
    if db_portfolio:
        db_portfolio.name = portfolio_update.name
        db_portfolio.description = portfolio_update.description
        if portfolio_update.allocations is not None:
            db.query(models.PortfolioAllocation).filter(models.PortfolioAllocation.portfolio_id == portfolio_id).delete()
            for allocation in portfolio_update.allocations:
                db_allocation = models.PortfolioAllocation(
                    portfolio_id=portfolio_id,
                    asset_code=allocation.asset_code,
                    weight=allocation.weight
                )
                db.add(db_allocation)
        db.commit()
        db.refresh(db_portfolio)
    return db_portfolio

def delete_portfolio(db: Session, portfolio_id: uuid.UUID, user_id: uuid.UUID):
    db_portfolio = db.query(models.Portfolio).filter(models.Portfolio.id == portfolio_id, models.Portfolio.user_id == user_id).first()
    if db_portfolio:
        db.delete(db_portfolio)
        db.commit()
        return True
    return False

# --- Allocation CRUD (Needed for tests) ---

def create_portfolio_allocation(db: Session, allocation: schemas.PortfolioAllocationCreate, portfolio_id: uuid.UUID):
    db_allocation = models.PortfolioAllocation(
        portfolio_id=portfolio_id,
        asset_code=allocation.asset_code,
        weight=allocation.weight
    )
    db.add(db_allocation)
    db.commit()
    db.refresh(db_allocation)
    return db_allocation

def get_portfolio_allocations(db: Session, portfolio_id: uuid.UUID, user_id: uuid.UUID) -> List[models.PortfolioAllocation]:
    portfolio = get_portfolio(db, portfolio_id, user_id)
    if not portfolio: return []
    return db.query(models.PortfolioAllocation).filter(models.PortfolioAllocation.portfolio_id == portfolio_id).all()

def get_portfolio_allocation(db: Session, portfolio_id: uuid.UUID, allocation_id: uuid.UUID, user_id: uuid.UUID) -> Optional[models.PortfolioAllocation]:
    portfolio = get_portfolio(db, portfolio_id, user_id)
    if not portfolio: return None
    return db.query(models.PortfolioAllocation).filter(models.PortfolioAllocation.id == allocation_id, models.PortfolioAllocation.portfolio_id == portfolio_id).first()

def update_portfolio_allocation(db: Session, portfolio_id: uuid.UUID, allocation_id: uuid.UUID, user_id: uuid.UUID, allocation_update: schemas.PortfolioAllocationUpdate) -> Optional[models.PortfolioAllocation]: 
    db_allocation = get_portfolio_allocation(db, portfolio_id, allocation_id, user_id)
    if db_allocation:
        update_data = allocation_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_allocation, key, value)
        db.commit()
        db.refresh(db_allocation)
    return db_allocation

def delete_portfolio_allocation(db: Session, portfolio_id: uuid.UUID, allocation_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    db_allocation = get_portfolio_allocation(db, portfolio_id, allocation_id, user_id)
    if db_allocation:
        db.delete(db_allocation)
        db.commit()
        return True
    return False

# --- Assets ---

def get_assets(db: Session, skip: int = 0, limit: int = 1000) -> List[models.AssetData]:
    return db.query(models.AssetData).offset(skip).limit(limit).all()

def get_asset_by_code(db: Session, asset_code: str) -> Optional[models.AssetData]:
    return db.query(models.AssetData).filter(models.AssetData.asset_code == asset_code).first()

# --- Simulation Results ---

def create_simulation_result(db: Session, user_id: uuid.UUID, simulation_type: str, parameters: dict, results: dict, portfolio_id: Optional[uuid.UUID] = None):
    db_result = models.SimulationResult(
        user_id=user_id,
        simulation_type=simulation_type,
        parameters=parameters,
        results=results,
        portfolio_id=portfolio_id
    )
    db.add(db_result)
    db.commit()
    db.refresh(db_result)
    return db_result

def get_simulation_result(db: Session, simulation_type: str, parameters: dict) -> Optional[models.SimulationResult]:
    param_str = json.dumps(parameters, sort_keys=True)
    return db.query(models.SimulationResult).filter(
        models.SimulationResult.simulation_type == simulation_type,
        cast(models.SimulationResult.parameters, String) == param_str
    ).order_by(models.SimulationResult.created_at.desc()).first()

def get_simulation_results(db: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[models.SimulationResult]:
    return db.query(models.SimulationResult).filter(
        models.SimulationResult.user_id == user_id
    ).order_by(models.SimulationResult.created_at.desc()).offset(skip).limit(limit).all()

def delete_simulation_result(db: Session, result_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    db_result = db.query(models.SimulationResult).filter(
        models.SimulationResult.id == result_id,
        models.SimulationResult.user_id == user_id
    ).first()
    if db_result:
        db.delete(db_result)
        db.commit()
        return True
    return False

def get_asset_classes(db: Session) -> List[str]:
    asset_classes = db.query(models.AssetData.asset_class).distinct().filter(
        models.AssetData.asset_class.isnot(None)
    ).order_by(models.AssetData.asset_class).all()
    return [ac[0] for ac in asset_classes]
