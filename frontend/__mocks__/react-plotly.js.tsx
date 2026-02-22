import React from 'react';
import { vi } from 'vitest';

// This is a minimal mock for react-plotly.js Plot component
const Plot = (props: any) => {
  // Capture props if needed, similar to the test file's mockPlot
  if (globalThis.__MOCK_PLOT_CAPTURE__) {
    globalThis.__MOCK_PLOT_CAPTURE__.lastCallProps = props;
    if (props.onInitialized) {
      const mockGraphDiv = {
        on: (event: string, handler: any) => {
          if (event === 'plotly_click' && globalThis.__MOCK_PLOT_CAPTURE__.plotClickCallback) {
            globalThis.__MOCK_PLOT_CAPTURE__.plotClickCallback = handler;
          }
        },
        removeAllListeners: vi.fn()
      };
      props.onInitialized({}, mockGraphDiv);
    }
  }
  return <div data-testid="mock-plotly-chart" />;
};

export default Plot;
