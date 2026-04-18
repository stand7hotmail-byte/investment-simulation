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
    dividend_yield: float | None = None # Manual override for dividend yield
    reinvest_dividends: bool = True

class MonteCarloHistory(BaseModel):
    year: int
    p10: float
    p50: float
    p90: float
    p50_dividend: float | None = None
    p50_cumulative_dividend: float | None = None

class MonteCarloResponse(BaseModel):
    percentiles: dict[str, float]
    元本割れ確率: float
    目標到達確率: float | None = None
    history: List[MonteCarloHistory]
    confidence_interval_95: dict[str, float] | None = None # New: 95%信頼区間 (下限と上限)
    total_dividends_p50: float | None = None

class BasicAccumulationRequest(BaseModel):
    portfolio_id: uuid.UUID
    initial_investment: float
    monthly_contribution: float
    years: int
    expected_return: float | None = None
    volatility: float | None = None
    n_scenarios: int = 1000

class BasicAccumulationHistory(BaseModel):
    year: int
    value: float

class BasicAccumulationResponse(BaseModel):
    final_value: float
    history: List[BasicAccumulationHistory]

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

class CustomPortfolioRequest(BaseModel):
    assets: List[str] # List of asset codes
    weights: dict[str, float] # Dictionary of asset_code -> weight (e.g., {"SPY": 0.5, "TLT": 0.5})

class PortfolioPointResponse(BaseModel):
    expected_return: float
    volatility: float
    weights: dict[str, float] # Include weights for consistency with FrontierPoint

class PortfolioPointsRequest(BaseModel):
    portfolio_ids: List[uuid.UUID]

class SimulationResultBase(BaseModel):
    simulation_type: str
    parameters: dict
    results: dict
    portfolio_id: uuid.UUID | None = None

class SimulationResultCreate(SimulationResultBase):
    pass

class SimulationResult(SimulationResultBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AssetClassesResponse(BaseModel):
    asset_classes: List[str]

class MarketSummaryItem(BaseModel):
    asset_code: str
    name: str
    current_price: float
    change_percentage: float
    sparkline: List[float] | None = None

class MarketSummaryResponse(BaseModel):
    items: List[MarketSummaryItem]

# --- ANALYTICS SCHEMAS ---

class StressTestPoint(BaseModel):
    date: str
    cumulative_return: float

class StressTestScenario(BaseModel):
    name: str
    max_drawdown: float
    history: List[StressTestPoint]

class PortfolioStressTestResponse(BaseModel):
    lehman_shock: StressTestScenario
    covid_crash: StressTestScenario
    dotcom_bubble: StressTestScenario

class RebalanceRequest(BaseModel):
    target_weights: dict[str, float]

class RebalanceResponse(BaseModel):
    diff: dict[str, float]

# --- AFFILIATE SCHEMAS ---

class AffiliateBrokerBase(BaseModel):
    name: str
    region: str
    description: List[str]
    cta_text: str
    affiliate_url: str
    logo_url: str | None = None
    priority: int = 0

class AffiliateBrokerCreate(AffiliateBrokerBase):
    pass

class AffiliateBrokerUpdate(BaseModel):
    name: str | None = None
    region: str | None = None
    description: List[str] | None = None
    cta_text: str | None = None
    affiliate_url: str | None = None
    logo_url: str | None = None
    priority: int | None = None
    is_active: bool | None = None

class AffiliateBrokerRead(AffiliateBrokerBase):
    id: int
    is_active: bool
    model_config = ConfigDict(from_attributes=True)
