import { test, expect, Page } from '@playwright/test';
import type { TestResult } from './test-utils';

declare global {
  interface WindowEventMap {
    'test-result': CustomEvent<TestResult>;
  }
  const testBasic: () => void;
}

async function collectTestResult(page: Page) {
  const result = await page.evaluate(() => {
    return new Promise<TestResult>(resolve => {
      window.addEventListener('test-result', ({ detail }) => resolve(detail));
    });
  });
  const messages = result.messages.join('\n');

  expect(result.success, messages).toEqual(true);
  console.log(messages);
}

// checkout test-entry.ts for actual test cases
const blobExamplePage = 'http://localhost:5173/examples/blob/';

test('blob storage basics', async ({ page }) => {
  await page.goto(blobExamplePage);
  await page.locator('#test-basic').click();
  await collectTestResult(page);
});

test('blob state after refresh', async ({ page }) => {
  await page.goto(blobExamplePage);
  await page.locator('#test-refresh-before').click();
  await collectTestResult(page);

  await page.reload();
  await page.locator('#test-refresh-after').click();
  await collectTestResult(page);
});
