from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, DECIMAL, JSON
import uuid
from datetime import datetime, UTC
from .database import Base, GUID

from sqlalchemy.orm import relationship

class Portfolio(Base):
    __tablename__ = "portfolios"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, nullable=False)
    name = Column(String, nullable=False)
    description = Column(String)
    is_current = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

    allocations = relationship("PortfolioAllocation", backref="portfolio", cascade="all, delete-orphan")

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
    historical_prices = Column(JSON) # Stores historical price data
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

class SimulationResult(Base):
    __tablename__ = "simulation_results"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, nullable=False) # Add user_id
    portfolio_id = Column(GUID, ForeignKey("portfolios.id"), nullable=True) # Optional link to a portfolio
    simulation_type = Column(String, nullable=False) # 'efficient_frontier', 'risk_parity', etc.
    parameters = Column(JSON, nullable=False) # Parameters used for calculation
    results = Column(JSON, nullable=False) # Actual calculation results
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
