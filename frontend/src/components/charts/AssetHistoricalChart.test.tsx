import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AssetHistoricalChart } from './AssetHistoricalChart';
import { fetchApi } from '@/lib/api';
import { HistoricalDataResponse } from '@/types/simulation';
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from 'react';

// Mock fetchApi
vi.mock('@/lib/api', () => ({
  fetchApi: vi.fn(),
}));

// Mock next/dynamic to return our mock Plotly component directly
vi.mock('next/dynamic', () => ({
  default: () => {
    const MockPlot = ({ layout }: any) => {
      const title = typeof layout?.title === 'object' ? layout.title.text : layout?.title;
      return <div data-testid="mock-plotly">{title}</div>;
    };
    return MockPlot;
  }
}));

describe('AssetHistoricalChart', () => {
  let queryClient: QueryClient;
  const mockAssetCode = 'TEST_ASSET';
  const mockHistoricalData: HistoricalDataResponse = {
    asset_code: mockAssetCode,
    historical_prices: [
      { date: '2023-01-01', price: '100.0' },
      { date: '2023-01-02', price: '101.5' },
      { date: '2023-01-03', price: '102.0' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  afterEach(() => {
    cleanup();
  });

  const renderComponent = (code = mockAssetCode) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <AssetHistoricalChart assetCode={code} />
      </QueryClientProvider>
    );
  };

  it('should display loading state initially', () => {
    (fetchApi as any).mockImplementationOnce(() => new Promise(() => {}));
    renderComponent();
    expect(screen.getByText(/Loading historical data.../i)).toBeInTheDocument();
  });

  it('should display error state if data fetching fails', async () => {
    (fetchApi as any).mockImplementationOnce(() => Promise.reject(new Error('Network error')));
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(/Error: Network error/i)).toBeInTheDocument();
    });
  });

  it('should display no data message if historical prices are empty', async () => {
    (fetchApi as any).mockImplementationOnce(() => Promise.resolve({ asset_code: mockAssetCode, historical_prices: [] }));
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(`No historical data available for ${mockAssetCode}.`)).toBeInTheDocument();
    });
  });

  it('should render chart with historical data when fetching is successful', async () => {
    (fetchApi as any).mockImplementationOnce(() => Promise.resolve(mockHistoricalData));
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("mock-plotly")).toHaveTextContent(`${mockAssetCode} Historical Price Trend`);
      expect(fetchApi).toHaveBeenCalledWith(`/api/assets/${mockAssetCode}/historical-data`);
    });
  });

  it('should not fetch data if assetCode is empty', () => {
    renderComponent("");
    expect(fetchApi).not.toHaveBeenCalled();
    expect(screen.getByText(/No historical data available for/i)).toBeInTheDocument();
  });
});
