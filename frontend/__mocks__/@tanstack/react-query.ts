import { vi } from 'vitest';

export const useQuery = vi.fn(() => ({
  data: undefined,
  isLoading: true,
  isError: false,
  error: null,
}));
