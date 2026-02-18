import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import EditPortfolioPage from './page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import { useAssets } from '@/hooks/useAssets';
import { usePortfolio } from '@/hooks/usePortfolios';
import { useRouter } from 'next/navigation';
import React from 'react';

// Mock the dependencies
vi.mock('@/lib/api', () => ({
  fetchApi: vi.fn(),
}));

vi.mock('@/hooks/useAssets', () => ({
  useAssets: vi.fn(),
}));

vi.mock('@/hooks/usePortfolios', () => ({
  usePortfolio: vi.fn(),
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

// Mock React.use for params
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    use: (promise: any) => {
        if (promise && typeof promise.then === 'function') {
            // This is a bit hacky but works for simple cases in tests
            return { id: 'mock-portfolio-id' };
        }
        return promise;
    }
  };
});

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
];

const mockPortfolio = {
  id: 'mock-portfolio-id',
  name: 'Existing Portfolio',
  description: 'Old Description',
  allocations: [
    { asset_code: 'TOPIX', weight: 100 },
  ],
};

describe('EditPortfolioPage', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as vi.Mock).mockReturnValue({ push: mockPush, back: vi.fn() });
    (useAssets as vi.Mock).mockReturnValue({
      data: mockAssets,
      isLoading: false,
    });
    (usePortfolio as vi.Mock).mockReturnValue({
      data: mockPortfolio,
      isLoading: false,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the form with pre-filled data and allows updates', async () => {
    (fetchApi as vi.Mock).mockResolvedValue({
      ...mockPortfolio,
      name: 'Updated Portfolio',
    });

    render(
      <QueryClientProvider client={queryClient}>
        <EditPortfolioPage params={Promise.resolve({ id: 'mock-portfolio-id' })} />
      </QueryClientProvider>
    );

    // Check pre-filled data
    expect(screen.getByLabelText(/Portfolio Name/i)).toHaveValue('Existing Portfolio');
    expect(screen.getByLabelText(/Description/i)).toHaveValue('Old Description');
    
    const assetSelects = screen.getAllByRole('combobox');
    expect(assetSelects[0]).toHaveValue('TOPIX');

    const weightInputs = screen.getAllByPlaceholderText(/Weight/i);
    expect(weightInputs[0]).toHaveValue(100);

    // Update data
    fireEvent.change(screen.getByLabelText(/Portfolio Name/i), {
      target: { value: 'Updated Portfolio' },
    });
    
    // Change weight (add another asset to make it 100%?)
    // Or just change name and submit if total is still 100%
    
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => {
      expect(fetchApi).toHaveBeenCalledWith('/api/portfolios/mock-portfolio-id', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Updated Portfolio',
          description: 'Old Description',
          allocations: [
            { asset_code: 'TOPIX', weight: 100 },
          ],
        }),
      });
    });
    
    expect(mockPush).toHaveBeenCalledWith('/portfolios');
  });
});
