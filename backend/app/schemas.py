from pydantic import BaseModel, ConfigDict
import uuid
from datetime import datetime
from decimal import Decimal
from typing import List

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

class PortfolioAllocationUpdate(BaseModel):
    asset_code: str | None = None
    weight: Decimal | None = None

class AssetDataBase(BaseModel):
    asset_code: str
    name: str
    asset_class: str | None = None
    expected_return: Decimal | None = None
    volatility: Decimal | None = None
    correlation_matrix: dict | None = None

class AssetData(AssetDataBase):
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class EfficientFrontierRequest(BaseModel):
    assets: List[str]
    n_points: int = 50

class FrontierPoint(BaseModel):
    expected_return: float
    volatility: float
    weights: dict[str, float]

class EfficientFrontierResponse(BaseModel):
    frontier: List[FrontierPoint]
    max_sharpe: FrontierPoint | None = None
