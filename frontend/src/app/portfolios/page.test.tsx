import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PortfoliosPage from './page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the usePortfolios hook
vi.mock('@/hooks/usePortfolios', () => ({
  usePortfolios: vi.fn(),
}));

// Now import the mocked version
import { usePortfolios } from '@/hooks/usePortfolios';

const queryClient = new QueryClient();

describe('PortfoliosPage', () => {
  it('displays loading state', () => {
    (usePortfolios as vi.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <PortfoliosPage />
      </QueryClientProvider>
    );

    expect(screen.getByText('My Portfolios')).toBeInTheDocument();
    // Expect the skeleton loaders to be present
    expect(screen.getAllByTestId('skeleton-card')).toHaveLength(3);
  });
});
