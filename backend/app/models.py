from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, DECIMAL
import uuid
from datetime import datetime, UTC
from .database import Base, GUID

class Portfolio(Base):
    __tablename__ = "portfolios"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, nullable=False)
    name = Column(String, nullable=False)
    description = Column(String)
    is_current = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

class PortfolioAllocation(Base):
    __tablename__ = "portfolio_allocations"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    portfolio_id = Column(GUID, ForeignKey("portfolios.id"), nullable=False)
    asset_code = Column(String, nullable=False)
    weight = Column(DECIMAL(7,6), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
