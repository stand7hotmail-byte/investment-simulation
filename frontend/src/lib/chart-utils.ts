/**
 * Utility functions and constants for Plotly.js charts to ensure
 * visual consistency across the application.
 */

import { useEffect, useState } from 'react';

export const CHART_COLORS = {
  primary: 'rgb(88 138 255)', // Luxurious indigo
  secondary: 'rgb(163 166 255)', // Purple
  success: 'rgb(16 185 129)', // Emerald
  danger: 'rgb(239 68 68)',
  warning: 'rgb(245 166 35)',
  info: 'rgb(6 182 212)',
  grid: 'rgba(0, 0, 0, 0.05)',
  text: '#64748b',
  background: 'rgba(0,0,0,0)',
};

// Hook to check and observe dark mode
export function useChartTheme() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkTheme = () => {
      const isDarkClass = document.documentElement.classList.contains('dark');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(isDarkClass || prefersDark);
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = () => checkTheme();
    mediaQuery.addEventListener('change', handleMediaChange);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, []);

  return isDark;
}

export function getChartThemeColors(isDark: boolean) {
  if (isDark) {
    return {
      primary: 'rgb(101 220 250)', // Vibrant neon hybrid for dark
      secondary: 'rgb(180 160 255)', // lavender purple
      success: 'rgb(50 200 150)', // soft neon emerald
      danger: 'rgb(240 80 80)',
      warning: 'rgb(245 166 35)',
      info: 'rgb(6 182 212)',
      grid: 'rgba(255, 255, 255, 0.08)',
      text: 'rgba(255, 255, 255, 0.6)',
      background: 'rgba(0, 0, 0, 0)',
      paper: 'rgba(0, 0, 0, 0)',
    };
  }
  return {
    primary: 'rgb(88 138 255)',
    secondary: 'rgb(163 166 255)',
    success: 'rgb(16 185 129)',
    danger: 'rgb(239 68 68)',
    warning: 'rgb(245 166 35)',
    info: 'rgb(6 182 212)',
    grid: 'rgba(0, 0, 0, 0.05)',
    text: '#64748b',
    background: 'rgba(0, 0, 0, 0)',
    paper: 'rgba(0, 0, 0, 0)',
  };
}

export function createChartLayout(options: { 
  title?: string;
  xAxisTitle?: string; 
  yAxisTitle?: string;
  height?: number;
  hovermode?: 'closest' | 'x' | 'y' | 'x unified' | 'y unified';
  isDark?: boolean;
}) {
  const colors = getChartThemeColors(!!options.isDark);
  
  return {
    autosize: true,
    height: options.height || 400,
    margin: { l: 60, r: 20, t: 20, b: 60 },
    plot_bgcolor: colors.background,
    paper_bgcolor: colors.paper,
    font: {
      family: 'var(--font-plus-jakarta-sans), var(--font-inter), sans-serif',
      size: 11,
      color: colors.text,
    },
    xaxis: {
      fixedrange: true,
      gridcolor: colors.grid,
      linecolor: colors.grid,
      zeroline: false,
      title: options.xAxisTitle ? { text: options.xAxisTitle, font: { size: 12, color: colors.text } } : undefined,
    },
    yaxis: {
      fixedrange: true,
      gridcolor: colors.grid,
      linecolor: colors.grid,
      zeroline: false,
      title: options.yAxisTitle ? { text: options.yAxisTitle, font: { size: 12, color: colors.text } } : undefined,
    },
    hovermode: options.hovermode || ('closest' as const),
    showlegend: true,
    legend: {
      font: { color: colors.text },
      bgcolor: 'rgba(0,0,0,0)',
    }
  };
}

export const CHART_CONFIG = {
  responsive: true,
  displayModeBar: false,
};
