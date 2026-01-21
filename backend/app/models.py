from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, DECIMAL
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, UTC
from .database import Base

class Portfolio(Base):
    __tablename__ = "portfolios"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String)
    is_current = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

class PortfolioAllocation(Base):
    __tablename__ = "portfolio_allocations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    portfolio_id = Column(UUID(as_uuid=True), ForeignKey("portfolios.id"), nullable=False)
    asset_code = Column(String, nullable=False)
    weight = Column(DECIMAL(7,6), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
