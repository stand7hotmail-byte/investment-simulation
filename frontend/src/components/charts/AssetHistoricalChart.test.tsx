import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AssetHistoricalChart } from './AssetHistoricalChart';
import { fetchApi } from '@/lib/api';
import { HistoricalDataResponse } from '@/types/simulation';
import { describe, it, expect, vi, beforeEach, test } from "vitest"; // Import vi, beforeEach, test

// Mock fetchApi to return dummy data
vi.mock('@/lib/api', () => ({ // Use vi.mock
  fetchApi: vi.fn(),
}));

// Create a client for react-query tests
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Disable retries for tests
    },
  },
});

describe('AssetHistoricalChart', () => {
  const mockAssetCode = 'TEST_ASSET';
  const mockHistoricalData: HistoricalDataResponse = {
    asset_code: mockAssetCode,
    historical_prices: [
      { date: '2023-01-01', price: '100.0' },
      { date: '2023-01-02', price: '101.5' },
      { date: '2023-01-03', price: '102.0' },
    ],
  };

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <AssetHistoricalChart assetCode={mockAssetCode} />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    // Reset the mock before each test
    (fetchApi as vi.Mock).mockClear(); // Use vi.Mock
    queryClient.clear(); // Clear query cache
  });

  test('should display loading state initially', () => {
    (fetchApi as vi.Mock).mockImplementationOnce(() => new Promise(() => {})); // Use vi.Mock
    renderComponent();
    expect(screen.getByText(/Loading historical data.../i)).toBeInTheDocument();
  });

  test('should display error state if data fetching fails', async () => {
    (fetchApi as vi.Mock).mockImplementationOnce(() => Promise.reject(new Error('Network error'))); // Use vi.Mock
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(/Error: Network error/i)).toBeInTheDocument();
    });
  });

  test('should display no data message if historical prices are empty', async () => {
    (fetchApi as vi.Mock).mockImplementationOnce(() => Promise.resolve({ asset_code: mockAssetCode, historical_prices: [] })); // Use vi.Mock
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(`No historical data available for ${mockAssetCode}.`)).toBeInTheDocument();
    });
  });

  test('should render chart with historical data when fetching is successful', async () => {
    (fetchApi as vi.Mock).mockImplementationOnce(() => Promise.resolve(mockHistoricalData)); // Use vi.Mock
    renderComponent();

    await waitFor(() => {
      // Check for Plotly title (rendered inside the Plotly component, not directly in DOM)
      // This is a basic check as Plotly renders to canvas/SVG, not simple DOM elements.
      // A more robust test would inspect the Plotly.js rendered output if necessary.
      // For now, checking for text that is likely part of the chart if it renders.
      expect(screen.getByText(`${mockAssetCode} Historical Price Trend`)).toBeInTheDocument();
      expect(fetchApi).toHaveBeenCalledWith(`/api/assets/${mockAssetCode}/historical-data`);
    });
  });

  test('should not fetch data if assetCode is empty', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AssetHistoricalChart assetCode="" />
      </QueryClientProvider>
    );
    expect(fetchApi).not.toHaveBeenCalled();
    expect(screen.getByText(/No historical data available for/i)).toBeInTheDocument();
  });
});
