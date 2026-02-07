import { test, expect } from '@playwright/test';

test.describe('Chart Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/simulation/efficient-frontier');
    
    // Select assets and run simulation to populate the chart
    await page.click('text=東証株価指数');
    await page.click('text=S&P 500');
    await page.click('button:has-text("Run Simulation")');
    
    // Wait for the table to appear (meaning simulation is done)
    await expect(page.locator('text=Asset Allocation Details')).toBeVisible({ timeout: 10000 });
  });

  test('should update table when clicking on Max Sharpe point', async ({ page }) => {
    // 1. Initial selection should be Risk Parity (based on our previous logic)
    await expect(page.locator('text=Risk Parity Strategy (ERC)')).toBeVisible();
    
    // Wait for the Plotly container to be ready
    const plotContainer = page.locator('.js-plotly-plot');
    await expect(plotContainer).toBeVisible();
    
    // Additional wait to ensure Plotly has finished internal rendering
    await page.waitForFunction(() => {
      const gd = document.querySelector('.js-plotly-plot') as any;
      return gd && gd._fullData && gd._fullData.length > 0;
    });

    await page.screenshot({ path: 'test-results/initial-selection.png' });

    // 2. Get coordinates of Max Sharpe point and click it
    const pointInfo = await page.evaluate(() => {
      const gd = document.querySelector('.js-plotly-plot') as any;
      if (!gd) return null;
      
      const traceIndex = gd._fullData.findIndex(t => t.name === 'Max Sharpe Ratio');
      if (traceIndex === -1) return { error: 'Max Sharpe trace not found' };
      
      const trace = gd._fullData[traceIndex];
      const xaxis = gd._fullLayout.xaxis;
      const yaxis = gd._fullLayout.yaxis;
      const margin = gd._fullLayout.margin;
      
      // Calculate pixel coordinates relative to the plot container
      const xPx = xaxis.l2p(trace.x[0]) + margin.l;
      const yPx = yaxis.l2p(trace.y[0]) + margin.t;
      
      const rect = gd.getBoundingClientRect();
      return {
        x: rect.left + xPx,
        y: rect.top + yPx,
        traceName: trace.name,
        xVal: trace.x[0],
        yVal: trace.y[0]
      };
    });

    console.log('Point Info:', pointInfo);
    expect(pointInfo).not.toBeNull();
    // @ts-ignore
    expect(pointInfo.error).toBeUndefined();

    // @ts-ignore
    await page.mouse.click(pointInfo!.x, pointInfo!.y);
    console.log('Clicked at:', pointInfo);

    // Wait a bit for state update
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/after-click.png' });

    // 3. Verify the table updated
    await expect(page.locator('text=Maximum Sharpe Ratio Strategy')).toBeVisible();
  });
});
