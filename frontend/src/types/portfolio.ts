export interface Portfolio {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}
