import { test, expect, Page } from '@playwright/test';
import type { TestResult } from './test-utils';

declare global {
  interface WindowEventMap {
    'test-result': CustomEvent<TestResult>;
  }
  const main: () => void;
}

function waitForTestResult(page: Page) {
  return page.evaluate(() => {
    return new Promise<TestResult>(resolve => {
      window.addEventListener('test-result', ({ detail }) => resolve(detail));
      main();
    });
  });
}

// checkout test-entry.ts for actual test cases
test('blob storage', async ({ page }) => {
  await page.goto('http://localhost:5173/examples/blob/');
  const result = await waitForTestResult(page);
  const messages = result.messages.join('\n');
  expect(result.success, messages).toEqual(true);
  console.log(messages);
});
