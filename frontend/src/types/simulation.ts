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
