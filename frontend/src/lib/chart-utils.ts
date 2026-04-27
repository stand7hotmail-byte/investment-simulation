/**
 * Utility functions and constants for Plotly.js charts to ensure
 * visual consistency across the application.
 */

export const CHART_COLORS = {
  primary: 'rgb(59 130 246)', // blue-500
  secondary: 'rgb(99 102 241)', // indigo-500
  success: 'rgb(16 185 129)', // emerald-500
  danger: 'rgb(239 68 68)', // red-500
  warning: 'rgb(245 158 11)', // amber-500
  info: 'rgb(6 182 212)', // cyan-500
  grid: '#f1f5f9', // slate-100
  text: '#64748b', // slate-500
  background: 'white',
};

export const DEFAULT_CHART_LAYOUT = {
  autosize: true,
  height: 400,
  margin: { l: 80, r: 20, t: 20, b: 60 },
  plot_bgcolor: CHART_COLORS.background,
  paper_bgcolor: CHART_COLORS.background,
  font: {
    family: 'inherit',
    size: 12,
    color: CHART_COLORS.text,
  },
  xaxis: {
    fixedrange: true,
    gridcolor: CHART_COLORS.grid,
    linecolor: CHART_COLORS.grid,
    zeroline: false,
  },
  yaxis: {
    fixedrange: true,
    gridcolor: CHART_COLORS.grid,
    linecolor: CHART_COLORS.grid,
    zeroline: false,
  },
  hovermode: 'closest' as const,
};

/**
 * Creates a standard chart layout with custom axis titles.
 */
export function createChartLayout(options: { 
  title?: string;
  xAxisTitle?: string; 
  yAxisTitle?: string;
  height?: number;
  hovermode?: 'closest' | 'x' | 'y' | 'x unified' | 'y unified';
}) {
  return {
    ...DEFAULT_CHART_LAYOUT,
    height: options.height || DEFAULT_CHART_LAYOUT.height,
    hovermode: options.hovermode || DEFAULT_CHART_LAYOUT.hovermode,
    xaxis: {
      ...DEFAULT_CHART_LAYOUT.xaxis,
      title: options.xAxisTitle ? { text: options.xAxisTitle } : undefined,
    },
    yaxis: {
      ...DEFAULT_CHART_LAYOUT.yaxis,
      title: options.yAxisTitle ? { text: options.yAxisTitle } : undefined,
    },
  };
}

export const CHART_CONFIG = {
  responsive: true,
  displayModeBar: false,
};
