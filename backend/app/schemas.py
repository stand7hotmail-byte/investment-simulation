from pydantic import BaseModel, ConfigDict
import uuid
from datetime import datetime
from decimal import Decimal
from typing import List

class PortfolioBase(BaseModel):
    name: str
    description: str | None = None

class PortfolioCreate(PortfolioBase):
    allocations: List["PortfolioAllocationCreate"] = []

class Portfolio(PortfolioBase):
    id: uuid.UUID
    user_id: uuid.UUID
    is_current: bool
    created_at: datetime
    updated_at: datetime
    allocations: List["PortfolioAllocation"] = []

    model_config = ConfigDict(from_attributes=True)

class PortfolioAllocationBase(BaseModel):
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

class ExtraInvestment(BaseModel):
    year: int
    amount: float

class MonteCarloRequest(BaseModel):
    portfolio_id: uuid.UUID
    initial_investment: float
    monthly_contribution: float
    years: int
    n_simulations: int = 10000
    extra_investments: List[ExtraInvestment] | None = None
    target_amount: float | None = None

class MonteCarloHistory(BaseModel):
    year: int
    p10: float
    p50: float
    p90: float

class MonteCarloResponse(BaseModel):
    percentiles: dict[str, float]
    元本割れ確率: float
    目標到達確率: float | None = None
    history: List[MonteCarloHistory]

class RiskParityRequest(BaseModel):
    assets: List[str]
    bounds: dict[str, List[float]] | None = None # e.g., {"TOPIX": [0.0, 0.5]}

class RiskParityResponse(BaseModel):
    expected_return: float
    volatility: float
    weights: dict[str, float]

class HistoricalPricePoint(BaseModel):
    date: str
    price: Decimal

class HistoricalDataResponse(BaseModel):
    asset_code: str
    historical_prices: List[HistoricalPricePoint]
