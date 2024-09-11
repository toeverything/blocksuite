import { expect } from '@playwright/test';

import {
  activeEmbed,
  dragBetweenCoords,
  enterPlaygroundRoom,
  initImageState,
  insertThreeLevelLists,
  pressEnter,
  scrollToTop,
} from '../utils/actions/index.js';
import { assertRichImage } from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

// FIXME(@fundon): This behavior is not meeting the design spec
test.skip('popup menu should follow position of image when scrolling', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initImageState(page);
  await activeEmbed(page);
  await pressEnter(page);
  await insertThreeLevelLists(page, 0);
  await pressEnter(page);
  await insertThreeLevelLists(page, 3);
  await pressEnter(page);
  await insertThreeLevelLists(page, 6);
  await pressEnter(page);
  await insertThreeLevelLists(page, 9);
  await pressEnter(page);
  await insertThreeLevelLists(page, 12);

  await scrollToTop(page);

  const rect = await page.locator('.affine-image-container img').boundingBox();
  if (!rect) throw new Error('image not found');

  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);

  await page.waitForTimeout(150);

  const menu = page.locator('.affine-image-toolbar-container');

  await expect(menu).toBeVisible();

  await page.evaluate(
    ([rect]) => {
      const viewport = document.querySelector('.affine-page-viewport');
      if (!viewport) {
        throw new Error();
      }
      // const distance = viewport.scrollHeight - viewport.clientHeight;
      viewport.scrollTo(0, (rect.height + rect.y) / 2);
    },
    [rect]
  );

  await page.waitForTimeout(150);
  const image = page.locator('.affine-image-container img');
  const imageRect = await image.boundingBox();
  const menuRect = await menu.boundingBox();
  if (!imageRect) throw new Error('image not found');
  if (!menuRect) throw new Error('menu not found');
  expect(imageRect.y).toBeCloseTo((rect.y - rect.height) / 2, 172);
  expect(menuRect.y).toBeCloseTo(65, -0.325);
});

test('select image should not show format bar', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initImageState(page);
  await assertRichImage(page, 1);

  const image = page.locator('affine-image');
  const rect = await image.boundingBox();
  if (!rect) {
    throw new Error('image not found');
  }
  await dragBetweenCoords(
    page,
    { x: rect.x - 20, y: rect.y + 20 },
    { x: rect.x + 20, y: rect.y + 40 }
  );
  const rects = page.locator('affine-block-selection').locator('visible=true');
  await expect(rects).toHaveCount(1);
  const formatQuickBar = page.locator(`.format-quick-bar`);
  await expect(formatQuickBar).not.toBeVisible();
  await page.mouse.wheel(0, rect.y + rect.height);
  await expect(formatQuickBar).not.toBeVisible();
  await page.mouse.click(0, 0);
});
