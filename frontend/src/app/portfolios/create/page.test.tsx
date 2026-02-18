import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CreatePortfolioPage from './page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import { useAssets } from '@/hooks/useAssets';
import { useRouter } from 'next/navigation';

// Mock the dependencies
vi.mock('@/lib/api', () => ({
  fetchApi: vi.fn(),
}));

vi.mock('@/hooks/useAssets', () => ({
  useAssets: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const mockAssets = [
  { asset_code: 'TOPIX', name: 'TOPIX' },
  { asset_code: 'S&P500', name: 'S&P 500' },
  { asset_code: 'GOLD', name: 'Gold' },
];

describe('CreatePortfolioPage', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as vi.Mock).mockReturnValue({ push: mockPush });
    (useAssets as vi.Mock).mockReturnValue({
      data: mockAssets,
      isLoading: false,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the form with asset selection and allows submission', async () => {
    (fetchApi as vi.Mock).mockResolvedValue({
      id: 'mock-uuid-1',
      name: 'Test Portfolio',
      description: 'Test Description',
    });

    render(
      <QueryClientProvider client={queryClient}>
        <CreatePortfolioPage />
      </QueryClientProvider>
    );

    // Initial fields
    expect(screen.getByLabelText(/Portfolio Name/i)).toBeInTheDocument();
    
    // Add assets and weights
    // Assuming we have an "Add Asset" button
    const addAssetButton = screen.getByRole('button', { name: /Add Asset/i });
    fireEvent.click(addAssetButton);

    // After clicking Add Asset, should see asset selector and weight input
    // We might need to select from a dropdown
    // For simplicity in test, let's assume we use standard selects
    
    const assetSelects = screen.getAllByRole('combobox');
    expect(assetSelects.length).toBe(1);
    fireEvent.change(assetSelects[0], { target: { value: 'TOPIX' } });

    const weightInputs = screen.getAllByPlaceholderText(/Weight/i);
    expect(weightInputs.length).toBe(1);
    fireEvent.change(weightInputs[0], { target: { value: '100' } });

    // Submit
    fireEvent.change(screen.getByLabelText(/Portfolio Name/i), {
      target: { value: 'My New Portfolio' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Create Portfolio/i }));

    await waitFor(() => {
      expect(fetchApi).toHaveBeenCalledWith('/api/portfolios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'My New Portfolio',
          description: null,
          allocations: [
            { asset_code: 'TOPIX', weight: 100 },
          ],
        }),
      });
    });
    
    expect(mockPush).toHaveBeenCalledWith('/portfolios');
  });

  it('shows error if total weight is not 100%', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CreatePortfolioPage />
      </QueryClientProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Add Asset/i }));
    
    const assetSelects = screen.getAllByRole('combobox');
    fireEvent.change(assetSelects[0], { target: { value: 'TOPIX' } });

    const weightInputs = screen.getAllByPlaceholderText(/Weight/i);
    fireEvent.change(weightInputs[0], { target: { value: '50' } }); // Only 50%

    fireEvent.change(screen.getByLabelText(/Portfolio Name/i), {
      target: { value: 'Incomplete Portfolio' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: /Create Portfolio/i }));

    // Should show validation error
    expect(await screen.findByText(/Total weight must be exactly 100%/i)).toBeInTheDocument();
    expect(fetchApi).not.toHaveBeenCalled();
  });
});
