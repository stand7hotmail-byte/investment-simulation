export interface AssetData {
  asset_code: string;
  name: string;
  asset_class: string | null;
  expected_return: number | null;
  volatility: number | null;
  correlation_matrix: Record<string, number> | null;
  updated_at: string;
}
