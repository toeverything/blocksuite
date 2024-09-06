import { test as baseTest, expect, type Page } from '@playwright/test';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import {
  enterPlaygroundRoom,
  initEmptyParagraphState,
} from './actions/misc.js';
import { currentEditorIndex, scope } from './multiple-editor.js';

const istanbulTempDir = process.env.ISTANBUL_TEMP_DIR
  ? path.resolve(process.env.ISTANBUL_TEMP_DIR)
  : path.join(process.cwd(), '.nyc_output');

function generateUUID() {
  return crypto.randomUUID();
}

const enableCoverage = !!process.env.CI || !!process.env.COVERAGE;
export const scoped = (stringsArray: TemplateStringsArray) => {
  return `${scope ?? ''}${stringsArray.join()}`;
};
export const test = baseTest.extend({
  context: async ({ context }, use) => {
    if (enableCoverage) {
      await context.addInitScript(() =>
        window.addEventListener('beforeunload', () =>
          // @ts-expect-error
          window.collectIstanbulCoverage(JSON.stringify(window.__coverage__))
        )
      );

      await fs.promises.mkdir(istanbulTempDir, { recursive: true });
      await context.exposeFunction(
        'collectIstanbulCoverage',
        (coverageJSON?: string) => {
          if (coverageJSON)
            fs.writeFileSync(
              path.join(
                istanbulTempDir,
                `playwright_coverage_${generateUUID()}.json`
              ),
              coverageJSON
            );
        }
      );
    }
    await use(context);
    if (enableCoverage) {
      for (const page of context.pages()) {
        await page.evaluate(() =>
          // @ts-expect-error
          window.collectIstanbulCoverage(JSON.stringify(window.__coverage__))
        );
      }
    }
  },
});
if (scope) {
  test.beforeEach(async ({ browser }, testInfo) => {
    if (scope && !testInfo.title.startsWith(scope)) {
      testInfo.fn = () => {
        testInfo.skip();
      };
      testInfo.skip();
      await browser.close();
    }
  });

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  // eslint-disable-next-line no-empty-pattern
  test.afterAll(async ({}, testInfo) => {
    if (!scope || !testInfo.title.startsWith(scope)) {
      return;
    }
    const focusInSecondEditor = await page.evaluate(
      ([currentEditorIndex]) => {
        const editor = document.querySelectorAll('affine-editor-container')[
          currentEditorIndex
        ];
        const selection = getSelection();
        if (!selection || selection.rangeCount === 0) {
          return true;
        }
        // once the range exists, it must be in the corresponding editor
        return editor.contains(selection.getRangeAt(0).startContainer);
      },
      [currentEditorIndex]
    );
    expect(focusInSecondEditor).toBe(true);
  });

  test('ensure enable two editor', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    const count = await page.evaluate(() => {
      return document.querySelectorAll('affine-editor-container').length;
    });

    expect(count).toBe(2);
  });
}
