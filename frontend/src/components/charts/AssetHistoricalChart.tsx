'use client'

import React from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import { HistoricalDataResponse, HistoricalPricePoint } from '@/types/simulation'; // Assuming these types exist

// Dynamically import Plot from 'react-plotly.js' with ssr: false
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface AssetHistoricalChartProps {
  assetCode: string;
}

export const AssetHistoricalChart: React.FC<AssetHistoricalChartProps> = ({ assetCode }) => {
  const { data, isLoading, isError, error } = useQuery<HistoricalDataResponse, Error>({
    queryKey: ['historicalData', assetCode],
    queryFn: () => fetchApi<HistoricalDataResponse>(`/api/assets/${assetCode}/historical-data`),
    enabled: !!assetCode, // Only run the query if assetCode is provided
  });

  if (isLoading) {
    return <div className="text-center py-4">Loading historical data...</div>;
  }

  if (isError) {
    return <div className="text-center py-4 text-red-500">Error: {error?.message || 'Failed to fetch historical data'}</div>;
  }

  if (!data || data.historical_prices.length === 0) {
    return <div className="text-center py-4 text-gray-500">No historical data available for {assetCode}.</div>;
  }

  const dates = data.historical_prices.map(point => point.date);
  const prices = data.historical_prices.map(point => parseFloat(point.price as any)); // Price is string from API, cast to float for Plotly

  const chartData: Plotly.Data[] = [
    {
      x: dates,
      y: prices,
      type: 'scatter',
      mode: 'lines',
      name: assetCode,
      line: { color: '#3b82f6' },
    },
  ];

  const layout: Partial<Plotly.Layout> = {
    title: {
      text: `${assetCode} Historical Price Trend`
    },
    xaxis: {
      title: { text: 'Date' },
      type: 'date',
    },
    yaxis: {
      title: { text: 'Price' },
      tickprefix: '$', // Assuming currency is USD
    },
    hovermode: 'x unified',
    showlegend: true,
    height: 400,
    margin: { l: 60, r: 30, t: 50, b: 60 },
  };

  const config: Partial<Plotly.Config> = {
    responsive: true,
    displayModeBar: false,
    displaylogo: false,
  };

  return (
    <div className="w-full">
      <Plot
        data={chartData}
        layout={layout}
        config={config}
        style={{ width: '100%' }}
      />
    </div>
  );
};