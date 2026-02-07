import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/InvestSim/);
});

test('can navigate to efficient frontier page', async ({ page }) => {
  await page.goto('/');

  // Click the Efficient Frontier link.
  await page.click('text=Efficient Frontier');

  // Expect the URL to contain "efficient-frontier".
  await expect(page).toHaveURL(/.*efficient-frontier/);

  // Expect the heading to be visible.
  await expect(page.locator('h1')).toContainText('Efficient Frontier Simulation');
});
