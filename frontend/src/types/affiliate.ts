export interface AffiliateBroker {
  id: number;
  name: string;
  region: string;
  description: string[];
  cta_text: string;
  affiliate_url: string;
  logo_url?: string;
  priority: number;
  is_active: boolean;
}
