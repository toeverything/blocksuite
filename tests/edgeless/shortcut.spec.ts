import { expect } from '@playwright/test';

import {
  addBasicRectShapeElement,
  locatorEdgelessToolButton,
  switchEditorMode,
} from '../utils/actions/edgeless.js';
import {
  enterPlaygroundRoom,
  initEmptyEdgelessState,
  pressEscape,
} from '../utils/actions/index.js';
import {
  assertEdgelessNonSelectedRect,
  assertEdgelessSelectedRect,
} from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

test('shortcut', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  await page.mouse.click(100, 100);

  await page.keyboard.press('t');
  const textButton = locatorEdgelessToolButton(page, 'text');
  await expect(textButton).toHaveAttribute('active', '');

  await page.keyboard.press('s');
  const shapeButton = locatorEdgelessToolButton(page, 'shape');
  await expect(shapeButton).toHaveAttribute('active', '');

  await page.keyboard.press('p');
  const penButton = locatorEdgelessToolButton(page, 'brush');
  await expect(penButton).toHaveAttribute('active', '');

  await page.keyboard.press('h');
  const panButton = locatorEdgelessToolButton(page, 'pan');
  await expect(panButton).toHaveAttribute('active', '');
});

test('pressing the ESC key will return to the default state', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  const start = { x: 100, y: 100 };
  const end = { x: 200, y: 200 };
  await addBasicRectShapeElement(page, start, end);

  await page.mouse.click(start.x + 5, start.y + 5);
  await assertEdgelessSelectedRect(page, [100, 100, 100, 100]);

  await pressEscape(page);
  await assertEdgelessNonSelectedRect(page);
});
