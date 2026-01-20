from sqlalchemy.orm import Session
import uuid
from . import models, schemas

def create_portfolio(db: Session, portfolio: schemas.PortfolioCreate, user_id: uuid.UUID):
    db_portfolio = models.Portfolio(**portfolio.model_dump(), user_id=user_id)
    db.add(db_portfolio)
    db.commit()
    db.refresh(db_portfolio)
    return db_portfolio
