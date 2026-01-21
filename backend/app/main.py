from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy.orm import Session
import uuid

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


@app.post("/api/portfolios", response_model=schemas.Portfolio)
def create_portfolio(portfolio: schemas.PortfolioCreate, db: Session = Depends(get_db)):
    # This is a placeholder for user authentication
    fake_user_id = uuid.uuid4()
    return crud.create_portfolio(db=db, portfolio=portfolio, user_id=fake_user_id)

@app.post("/api/portfolios/{portfolio_id}/allocations", response_model=schemas.PortfolioAllocation)
def create_portfolio_allocation(portfolio_id: uuid.UUID, allocation: schemas.PortfolioAllocationCreate, db: Session = Depends(get_db)):
    if allocation.portfolio_id != portfolio_id:
        raise HTTPException(status_code=400, detail="Portfolio ID in path and body must match")
    return crud.create_portfolio_allocation(db=db, allocation=allocation)

@app.get("/")
def read_root():
    return {"Hello": "World"}
