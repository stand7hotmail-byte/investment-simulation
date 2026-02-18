export interface Portfolio {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_current: boolean;
  created_at: string;
  updated_at: string;
  allocations?: PortfolioAllocation[];
}

export interface PortfolioAllocation {
  id: string;
  portfolio_id: string;
  asset_code: string;
  weight: number;
  created_at: string;
}

export interface CreatePortfolioRequest {
  name: string;
  description?: string | null;
  allocations: {
    asset_code: string;
    weight: number;
  }[];
}
