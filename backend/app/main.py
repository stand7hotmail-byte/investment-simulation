from fastapi import Depends, FastAPI, HTTPException, status
from sqlalchemy.orm import Session
import uuid
from typing import List, Optional

from . import crud, models, schemas
from .database import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI()


# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Placeholder for user authentication
def get_current_user_id():
    return uuid.uuid4() # Replace with actual authentication logic

@app.post("/api/portfolios", response_model=schemas.Portfolio, status_code=status.HTTP_201_CREATED)
def create_portfolio(portfolio: schemas.PortfolioCreate, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    return crud.create_portfolio(db=db, portfolio=portfolio, user_id=user_id)

@app.get("/api/portfolios", response_model=List[schemas.Portfolio])
def read_portfolios(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    portfolios = crud.get_portfolios(db, user_id=user_id, skip=skip, limit=limit)
    return portfolios

@app.get("/api/portfolios/{portfolio_id}", response_model=schemas.Portfolio)
def read_portfolio(portfolio_id: uuid.UUID, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    db_portfolio = crud.get_portfolio(db, portfolio_id=portfolio_id, user_id=user_id)
    if db_portfolio is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found")
    return db_portfolio

@app.put("/api/portfolios/{portfolio_id}", response_model=schemas.Portfolio)
def update_portfolio(portfolio_id: uuid.UUID, portfolio: schemas.PortfolioCreate, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    db_portfolio = crud.update_portfolio(db, portfolio_id=portfolio_id, user_id=user_id, portfolio_update=portfolio)
    if db_portfolio is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found or not owned by user")
    return db_portfolio

@app.delete("/api/portfolios/{portfolio_id}", status_code=status.HTTP_200_OK)
def delete_portfolio(portfolio_id: uuid.UUID, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    if not crud.delete_portfolio(db, portfolio_id=portfolio_id, user_id=user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found or not owned by user")
    return {"message": "Portfolio deleted successfully"}

@app.post("/api/portfolios/{portfolio_id}/allocations", response_model=schemas.PortfolioAllocation, status_code=status.HTTP_201_CREATED)
def create_portfolio_allocation(portfolio_id: uuid.UUID, allocation: schemas.PortfolioAllocationCreate, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    # Verify portfolio ownership before creating allocation
    db_portfolio = crud.get_portfolio(db, portfolio_id=portfolio_id, user_id=user_id)
    if db_portfolio is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found or not owned by user")

    if allocation.portfolio_id != portfolio_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Portfolio ID in path and body must match")
    return crud.create_portfolio_allocation(db=db, allocation=allocation)

@app.get("/api/portfolios/{portfolio_id}/allocations", response_model=List[schemas.PortfolioAllocation])
def read_portfolio_allocations(portfolio_id: uuid.UUID, skip: int = 0, limit: int = 100, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    allocations = crud.get_portfolio_allocations(db, portfolio_id=portfolio_id, user_id=user_id, skip=skip, limit=limit)
    if not crud.get_portfolio(db, portfolio_id, user_id): # Check if portfolio exists and is owned by user
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found or not owned by user")
    return allocations

@app.get("/api/portfolios/{portfolio_id}/allocations/{allocation_id}", response_model=schemas.PortfolioAllocation)
def read_portfolio_allocation(portfolio_id: uuid.UUID, allocation_id: uuid.UUID, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    db_allocation = crud.get_portfolio_allocation(db, portfolio_id=portfolio_id, allocation_id=allocation_id, user_id=user_id)
    if db_allocation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Allocation not found or not owned by user")
    return db_allocation

@app.put("/api/portfolios/{portfolio_id}/allocations/{allocation_id}", response_model=schemas.PortfolioAllocation)
def update_portfolio_allocation(portfolio_id: uuid.UUID, allocation_id: uuid.UUID, allocation: schemas.PortfolioAllocationUpdate, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    db_allocation = crud.update_portfolio_allocation(db, portfolio_id=portfolio_id, allocation_id=allocation_id, user_id=user_id, allocation_update=allocation)
    if db_allocation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Allocation not found or not owned by user")
    return db_allocation

@app.delete("/api/portfolios/{portfolio_id}/allocations/{allocation_id}", status_code=status.HTTP_200_OK)
def delete_portfolio_allocation(portfolio_id: uuid.UUID, allocation_id: uuid.UUID, db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)):
    if not crud.delete_portfolio_allocation(db, portfolio_id=portfolio_id, allocation_id=allocation_id, user_id=user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Allocation not found or not owned by user")
    return {"message": "Allocation deleted successfully"}

@app.get("/api/assets", response_model=List[schemas.AssetData])
def read_assets(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    assets = crud.get_assets(db, skip=skip, limit=limit)
    return assets

@app.get("/api/assets/{asset_code}", response_model=schemas.AssetData)
def read_asset(asset_code: str, db: Session = Depends(get_db)):
    db_asset = crud.get_asset_by_code(db, asset_code=asset_code)
    if db_asset is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    return db_asset

@app.get("/")
def read_root():
    return {"Hello": "World"}
