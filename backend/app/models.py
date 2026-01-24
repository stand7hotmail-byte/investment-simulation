from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, DECIMAL, JSON
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

class AssetData(Base):
    __tablename__ = "asset_data"

    asset_code = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    asset_class = Column(String)
    expected_return = Column(DECIMAL(8,6))
    volatility = Column(DECIMAL(8,6))
    correlation_matrix = Column(JSON) # Stores correlation coefficients with other assets
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))
