import { expect } from '@playwright/test';
import {
  addBasicRectShapeElement,
  edgelessCommonSetup,
} from 'utils/actions/edgeless.js';
import { assertEdgelessSelectedRect } from 'utils/asserts.js';

import { test } from '../utils/playwright.js';

test('elements should be selectable after open mindmap menu', async ({
  page,
}) => {
  await edgelessCommonSetup(page);

  const start = { x: 100, y: 100 };
  const end = { x: 200, y: 200 };
  await addBasicRectShapeElement(page, start, end);

  await page.locator('.basket-wrapper').click({ position: { x: 0, y: 0 } });
  await expect(page.locator('edgeless-mindmap-menu')).toBeVisible();

  await page.mouse.click(start.x + 5, start.y + 5);
  await assertEdgelessSelectedRect(page, [100, 100, 100, 100]);
});
