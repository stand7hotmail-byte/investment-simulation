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

@app.get("/")
def read_root():
    return {"Hello": "World"}
