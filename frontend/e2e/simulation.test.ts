import { test, expect } from '@playwright/test';

test.describe('Efficient Frontier Simulation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/simulation/efficient-frontier');
  });

  test('should run simulation after selecting assets', async ({ page }) => {
    // 1. Check initial state
    await expect(page.locator('text=No results yet')).toBeVisible();

    // 2. Select assets (using labels)
    // Note: Using actual names from seed data
    await page.click('text=S&P 500 ETF (SPY)');
    await page.click('text=Nasdaq 100 ETF (QQQ)');

    // 3. Click Run Simulation
    const runButton = page.locator('button:has-text("Run Simulation")');
    await expect(runButton).toBeEnabled();
    await runButton.click();

    // 4. Wait for results (Chart and Table)
    // The chart title or allocation table should appear
    await expect(page.locator('text=Asset Allocation Details')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.js-plotly-plot')).toBeVisible();
  });
});
