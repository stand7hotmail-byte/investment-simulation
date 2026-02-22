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

  test('should filter assets by asset class', async ({ page }) => {
    // 1. Wait for assets and filters to load
    // The filter buttons are from useAssetClasses hook
    await expect(page.locator('button:has-text("Stock")')).toBeVisible({ timeout: 10000 });
    
    // 2. Initial state - all assets should be visible
    // We can check if multiple different asset codes are present
    await expect(page.locator('text=SPY')).toBeVisible();
    await expect(page.locator('text=BND')).toBeVisible();

    // 3. Click 'Stock' filter
    await page.click('button:has-text("Stock")');

    // 4. Verify filtering - 'SPY' (Stock) should be visible, 'BND' (Bond) should not
    await expect(page.locator('text=SPY')).toBeVisible();
    await expect(page.locator('text=BND')).not.toBeVisible();

    // 5. Clear filters
    await page.click('button:has-text("Clear Filters")');

    // 6. Verify reset - all assets should be visible again
    await expect(page.locator('text=SPY')).toBeVisible();
    await expect(page.locator('text=BND')).toBeVisible();
  });
});
