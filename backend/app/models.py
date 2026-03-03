from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, DECIMAL, JSON
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime, UTC
from .database import Base, GUID

class Portfolio(Base):
    __tablename__ = "portfolios"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    is_current = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

    # Relationship to allocations
    allocations = relationship("PortfolioAllocation", back_populates="portfolio", cascade="all, delete-orphan", lazy="selectin")

class PortfolioAllocation(Base):
    __tablename__ = "portfolio_allocations"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    portfolio_id = Column(GUID, ForeignKey("portfolios.id"), nullable=False)
    asset_code = Column(String, nullable=False)
    weight = Column(DECIMAL(7,6), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))

    # Back relationship to portfolio
    portfolio = relationship("Portfolio", back_populates="allocations")

class AssetData(Base):
    __tablename__ = "asset_data"

    asset_code = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    asset_class = Column(String)
    expected_return = Column(DECIMAL(8,6))
    volatility = Column(DECIMAL(8,6))
    correlation_matrix = Column(JSON) 
    historical_prices = Column(JSON)
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC)) 

class SimulationResult(Base):
    __tablename__ = "simulation_results"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, nullable=False)
    portfolio_id = Column(GUID, ForeignKey("portfolios.id"), nullable=True)
    simulation_type = Column(String, nullable=False)
    parameters = Column(JSON, nullable=False) 
    results = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
