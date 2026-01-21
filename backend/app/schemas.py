from pydantic import BaseModel, ConfigDict
import uuid
from datetime import datetime
from decimal import Decimal

class PortfolioBase(BaseModel):
    name: str
    description: str | None = None

class PortfolioCreate(PortfolioBase):
    pass

class Portfolio(PortfolioBase):
    id: uuid.UUID
    user_id: uuid.UUID
    is_current: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PortfolioAllocationBase(BaseModel):
    portfolio_id: uuid.UUID
    asset_code: str
    weight: Decimal

class PortfolioAllocationCreate(PortfolioAllocationBase):
    pass

class PortfolioAllocation(PortfolioAllocationBase):
    id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
