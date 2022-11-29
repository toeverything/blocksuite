import { test, expect } from '@playwright/test';

test('blob storage', async ({ page }) => {
  await page.goto('http://localhost:5173/examples/blob/');
  const title = await page.title();
  expect(title).toBe('BlockSuite Playground');
});
