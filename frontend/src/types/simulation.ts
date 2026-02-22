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

export interface BasicAccumulationRequest {
  portfolio_id: string;
  initial_investment: number;
  monthly_contribution: number;
  years: number;
}

export interface BasicAccumulationHistory {
  year: number;
  value: number;
}

export interface BasicAccumulationResponse {
  final_value: number;
  history: BasicAccumulationHistory[];
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

export interface AssetClassesResponse {
  asset_classes: string[];
}
