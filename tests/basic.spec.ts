import { test, expect } from '@playwright/test';

test('playground', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await expect(page).toHaveTitle(/Building Blocks/);
});
