import { test, expect } from '@playwright/test';

test.describe('Efficient Frontier Simulation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/simulation/efficient-frontier');
  });

  test('should run simulation after selecting assets', async ({ page }) => {
    // 1. Check initial state
    await expect(page.locator('text=No results yet')).toBeVisible();

    // 2. Wait for assets to load (look for the "All" filter button or a specific asset)
    await expect(page.locator('text=All (')).toBeVisible({ timeout: 10000 });

    // 3. Select assets using checkbox IDs
    await page.check('#asset-SPY');
    await page.check('#asset-QQQ');

    // 4. Click Run Simulation
    const runButton = page.locator('button:has-text("Run Simulation")');
    await expect(runButton).toBeEnabled();
    await runButton.click();

    // 4. Wait for results (Chart and Table)
    // The chart title or allocation table should appear
    await expect(page.locator('text=Asset Allocation Details')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.js-plotly-plot')).toBeVisible();
  });
});
