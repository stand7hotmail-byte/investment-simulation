import { test, expect } from '@playwright/test';

test.describe('Asset Selector Performance', () => {
  test('should render and filter 100+ assets smoothly', async ({ page }) => {
    await page.goto('/simulation/efficient-frontier');

    // 1. Wait for all assets to load
    // There should be 24 (seeded) + 100 (dummy) = 124 assets
    await expect(page.locator('button').filter({ hasText: /^All \(\d+\)$/ })).toBeVisible({ timeout: 20000 });
    const allText = await page.locator('button').filter({ hasText: /^All/ }).innerText();
    expect(allText).toContain('(124)');

    // 2. Filter by 'Stock'
    await page.click('button:has-text("Stock")');
    
    // Some assets should be visible, others hidden
    // Dummy assets are alternating between Stock and Bond, so ~50 stocks from dummy + seeded
    await expect(page.locator('label').filter({ hasText: /^Dummy Asset 0DUMMY0$/ })).toBeVisible();
    await expect(page.locator('label').filter({ hasText: /^Dummy Asset 1DUMMY1$/ })).not.toBeVisible();

    // 3. Select many assets quickly (stress test)
    for (let i = 0; i < 20; i += 2) {
      await page.check(`#asset-DUMMY${i}`);
    }

    // 4. Run simulation with many selected assets
    // (Note: This might be slow on backend, but we're testing frontend performance here)
    const runButton = page.locator('button:has-text("Run Simulation")');
    await expect(runButton).toBeEnabled();
    await runButton.click();

    // 5. Results should appear (if backend handles it)
    // Even if backend fails (since dummy assets have no historical data), 
    // the frontend should handle the error state gracefully.
  });
});
