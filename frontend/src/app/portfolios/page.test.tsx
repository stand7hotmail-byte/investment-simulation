import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import PortfoliosPage from './page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePortfolios } from '@/hooks/usePortfolios';
import { fetchApi } from '@/lib/api';

// Mock the dependencies
vi.mock('@/hooks/usePortfolios', () => ({
  usePortfolios: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  fetchApi: vi.fn(),
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

const mockPortfolios = [
  {
    id: 'portfolio-1',
    name: 'Growth Portfolio',
    description: 'High risk high return',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'portfolio-2',
    name: 'Stable Portfolio',
    description: 'Low risk stable return',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

describe('PortfoliosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (usePortfolios as vi.Mock).mockReturnValue({
      data: mockPortfolios,
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders a list of portfolios and a create button', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <PortfoliosPage />
      </QueryClientProvider>
    );

    expect(screen.getByText('My Portfolios')).toBeInTheDocument();
    expect(screen.getByText('Growth Portfolio')).toBeInTheDocument();
    expect(screen.getByText('Stable Portfolio')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Create Portfolio/i })).toBeInTheDocument();
  });

  it('allows deleting a portfolio after confirmation', async () => {
    // Mock confirmation dialog (window.confirm)
    const confirmSpy = vi.spyOn(window, 'confirm');
    confirmSpy.mockReturnValue(true);

    (fetchApi as vi.Mock).mockResolvedValue({ message: 'Deleted' });

    render(
      <QueryClientProvider client={queryClient}>
        <PortfoliosPage />
      </QueryClientProvider>
    );

    const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
    fireEvent.click(deleteButtons[0]);

    expect(confirmSpy).toHaveBeenCalled();
    
    await waitFor(() => {
      expect(fetchApi).toHaveBeenCalledWith('/api/portfolios/portfolio-1', {
        method: 'DELETE',
      });
    });
  });
});
