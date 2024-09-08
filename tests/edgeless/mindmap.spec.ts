import { expect } from '@playwright/test';
import { clickView } from 'utils/actions/click.js';
import {
  addBasicRectShapeElement,
  autoFit,
  edgelessCommonSetup,
  getSelectedBound,
  getSelectedBoundCount,
  zoomResetByKeyboard,
} from 'utils/actions/edgeless.js';
import {
  pressBackspace,
  selectAllByKeyboard,
  undoByKeyboard,
} from 'utils/actions/keyboard.js';
import {
  assertEdgelessSelectedRect,
  assertSelectedBound,
} from 'utils/asserts.js';

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

test('undo deletion of mindmap should restore the deleted element', async ({
  page,
}) => {
  await edgelessCommonSetup(page);
  await zoomResetByKeyboard(page);

  await page.keyboard.press('m');
  await clickView(page, [0, 0]);
  await autoFit(page);

  await selectAllByKeyboard(page);
  const mindmapBound = await getSelectedBound(page);

  await pressBackspace(page);

  await selectAllByKeyboard(page);
  expect(await getSelectedBoundCount(page)).toBe(0);

  await undoByKeyboard(page);

  await selectAllByKeyboard(page);
  await assertSelectedBound(page, mindmapBound);
});
