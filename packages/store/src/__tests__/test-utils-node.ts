import { expect, type Page } from '@playwright/test';

import type { TestResult } from './test-utils-dom.js';

// TODO: use custom playwright reporter
export async function collectTestResult(page: Page) {
  const result = await page.evaluate(() => {
    return new Promise<TestResult>(resolve => {
      window.addEventListener('test-result', ({ detail }) => resolve(detail));
    });
  });
  const messages = result.messages.join('\n');

  expect(result.success, messages).toEqual(true);
  console.log(messages);
}
