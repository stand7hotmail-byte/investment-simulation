export interface FrontierPoint {
  expected_return: number;
  volatility: number;
  weights: Record<string, number>;
}

export interface EfficientFrontierResponse {
  frontier: FrontierPoint[];
  max_sharpe: FrontierPoint | null;
}

export interface EfficientFrontierRequest {
  assets: string[];
  n_points: number;
}

export interface RiskParityRequest {
  assets: string[];
  bounds?: Record<string, [number, number]>;
}

export interface RiskParityResponse {
  expected_return: number;
  volatility: number;
  weights: Record<string, number>;
}

export interface ExtraInvestment {
  year: number;
  amount: number;
}

export interface MonteCarloRequest {
  portfolio_id: string;
  initial_investment: number;
  monthly_contribution: number;
  years: number;
  n_simulations?: number;
  extra_investments?: ExtraInvestment[];
  target_amount?: number;
}

export interface MonteCarloHistoryPoint {
  year: number;
  p10: number;
  p50: number;
  p90: number;
}

export interface MonteCarloResponse {
  percentiles: Record<string, number>;
  元本割れ確率: number;
  目標到達確率: number | null;
  history: MonteCarloHistoryPoint[];
  confidence_interval_95?: {
    lower_bound: number;
    upper_bound: number;
  };
}

export interface BasicAccumulationRequest {
  portfolio_id: string;
  initial_investment: number;
  monthly_contribution: number;
  years: number;
  expected_return?: number;
  volatility?: number;
  n_scenarios?: number;
}

export interface BasicAccumulationHistory {
  year: number;
  value: number;
}

export interface BasicAccumulationResponse {
  final_value: number;
  history: BasicAccumulationHistory[];
  confidence_interval_95?: {
    lower_bound: number;
    upper_bound: number;
  };
}

export interface HistoricalPricePoint {
  date: string;
  price: string | number;
}

export interface HistoricalDataResponse {
  asset_code: string;
  historical_prices: HistoricalPricePoint[];
}

export interface CustomPortfolioRequest {
  assets: string[];
  weights: Record<string, number>;
}

export interface PortfolioPointResponse {
  expected_return: number;
  volatility: number;
  weights: Record<string, number>;
}

export interface PortfolioPointsRequest {
  portfolio_ids: string[];
}

export interface AssetClassesResponse {
  asset_classes: string[];
}

export interface MarketSummaryItem {
  asset_code: string;
  name: string;
  current_price: number;
  change_percentage: number;
  sparkline: number[] | null;
}

export interface MarketSummaryResponse {
  items: MarketSummaryItem[];
}

export interface SimulationResultBase {
  simulation_type: string;
  parameters: Record<string, any>;
  results: Record<string, any>;
  portfolio_id?: string | null;
}

export interface SimulationResultCreate extends SimulationResultBase {}

export interface SimulationResult extends SimulationResultBase {
  id: string;
  user_id: string;
  created_at: string;
}
