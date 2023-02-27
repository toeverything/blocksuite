import './utils/declare-test-window.js';

import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

import {
  activeEmbed,
  dragBetweenCoords,
  dragEmbedResizeByTopLeft,
  dragEmbedResizeByTopRight,
  enterPlaygroundRoom,
  initImageState,
  insertThreeLevelLists,
  moveToImage,
  pressEnter,
  redoByKeyboard,
  type,
  undoByKeyboard,
} from './utils/actions/index.js';
import {
  assertImageOption,
  assertImageSize,
  assertKeyboardWorkInInput,
  assertRichDragButton,
  assertRichImage,
  assertRichTexts,
} from './utils/asserts.js';
import { test } from './utils/playwright.js';

async function focusCaption(page: Page) {
  await page.click('.embed-editing-state>format-bar-button:nth-child(1)');
}

test('can drag resize image by left menu', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initImageState(page);
  await assertRichImage(page, 1);

  await activeEmbed(page);
  await assertRichDragButton(page);
  await assertImageSize(page, { width: 704, height: 528 });

  await dragEmbedResizeByTopLeft(page);
  await assertImageSize(page, { width: 304, height: 228 });

  await undoByKeyboard(page);
  await assertImageSize(page, { width: 704, height: 528 });

  await redoByKeyboard(page);
  await assertImageSize(page, { width: 304, height: 228 });
});

test('can drag resize image by right menu', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initImageState(page);
  await assertRichImage(page, 1);

  await activeEmbed(page);
  await assertRichDragButton(page);
  await assertImageSize(page, { width: 704, height: 528 });

  await dragEmbedResizeByTopRight(page);
  await assertImageSize(page, { width: 304, height: 228 });

  await undoByKeyboard(page);
  await assertImageSize(page, { width: 704, height: 528 });

  await redoByKeyboard(page);
  await assertImageSize(page, { width: 304, height: 228 });
});

test('can click and delete image', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initImageState(page);
  await assertRichImage(page, 1);

  await activeEmbed(page);
  await page.keyboard.press('Backspace');
  await assertRichImage(page, 0);

  await undoByKeyboard(page);
  await assertRichImage(page, 1);

  await redoByKeyboard(page);
  await assertRichImage(page, 0);
});

test('press enter will create new block when click and select image', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initImageState(page);
  await assertRichImage(page, 1);

  await activeEmbed(page);
  await pressEnter(page);
  await type(page, 'aa');
  await assertRichTexts(page, ['aa']);
});

test('enter shortcut on focusing embed block and its caption', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initImageState(page);
  await assertRichImage(page, 1);

  await moveToImage(page);
  await assertImageOption(page);

  await focusCaption(page);
  await assertKeyboardWorkInInput(
    page,
    page.locator('.affine-embed-wrapper-caption')
  );
});

const mockImageId = '_e2e_test_image_id_';

async function initMockImage(page: Page) {
  await page.evaluate(() => {
    const { page } = window;
    page.captureSync();
    const pageId = page.addBlock('affine:page');
    const frameId = page.addBlock('affine:frame', {}, pageId);
    page.addBlock(
      'affine:embed',
      {
        type: 'image',
        sourceId: '_e2e_test_image_id_',
        width: 200,
        height: 180,
      },
      frameId
    );
    page.captureSync();
  });
}

/**
 * image loading sequences:
 * 1. image block get sourceId from model
 * 2. (loading) query image data by sourceId
 * 3. (delivering) if step 2 return empty, wait for awareness notify, and setTimeout 2s
 * 4. (loading) if out of setTimeout or get message for awareness, query image data again
 * 5. (success) if get image data successfully, show image
 * 6. (not found) else show not found placeholder
 */
test('image loading', async ({ page }) => {
  const room = await enterPlaygroundRoom(page);

  // block image data request, force wait 100ms for loading test, always return 404
  await page.route(
    `**/api/workspace/${room}/blob/${mockImageId}`,
    async route => {
      await page.waitForTimeout(100);
      return route.fulfill({
        status: 404,
      });
    }
  );

  await initMockImage(page);

  const loadingContent = await page
    .locator('.affine-image-block-loading-card .affine-image-block-content')
    .innerText();
  expect(loadingContent).toBe('Loading content...');

  await page.waitForTimeout(100);

  await expect(
    page.locator('.affine-image-block-loading-card .affine-image-block-content')
  ).toContainText('Delivering content...');

  await page.waitForTimeout(3000);

  const imageNotFound = page.locator('.affine-image-block-not-found-card');
  await expect(imageNotFound).toBeVisible();
});

test('image loaded successfully', async ({ page }) => {
  const room = await enterPlaygroundRoom(page);

  await page.route(
    `**/api/workspace/${room}/blob/${mockImageId}`,
    async route => {
      return route.fulfill({
        status: 200,
        body: Buffer.from(
          'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=',
          'base64'
        ),
      });
    }
  );

  await initMockImage(page);

  await page.waitForTimeout(100);

  const img = page.locator('.affine-image-wrapper img');
  await expect(img).toBeVisible();
});

test('image get message from awareness', async ({ page, browser }) => {
  const room = await enterPlaygroundRoom(page);

  const pageB = await browser.newPage();
  await enterPlaygroundRoom(pageB, {}, room);

  let firstCall = true;
  await page.route(
    `**/api/workspace/${room}/blob/${mockImageId}`,
    async route => {
      // first call to get data, return 404, so image block waits awareness message
      if (firstCall) {
        firstCall = false;
        return route.fulfill({
          status: 404,
        });
      }

      // second call is after got awareness message
      return route.fulfill({
        status: 200,
        body: Buffer.from(
          'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=',
          'base64'
        ),
      });
    }
  );

  await pageB.evaluate(async () => {
    const { page } = window;
    page.awarenessStore.setBlobState('_e2e_test_image_id_', /* uploading */ 0);
  });

  await initMockImage(page);

  await page.waitForTimeout(100);

  await expect(
    page.locator('.affine-image-block-loading-card .affine-image-block-content')
  ).toHaveText('Delivering content...');

  await pageB.evaluate(async () => {
    const { page } = window;
    page.awarenessStore.setBlobState('_e2e_test_image_id_', /* uploaded */ 1);
  });

  // do not wait longer than 2s, because after 2s, `get image data` maybe call due to timeout
  await page.waitForTimeout(100);

  const img = page.locator('.affine-image-wrapper img');
  await expect(img).toBeVisible();
});

test('popup menu should follow position of image when scrolling', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initImageState(page);
  await activeEmbed(page);
  await pressEnter(page);
  await insertThreeLevelLists(page, 0);
  await pressEnter(page);
  await insertThreeLevelLists(page, 3);

  await page.evaluate(async () => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    viewport.scrollTo(0, 0);
  });

  await page.waitForTimeout(150);

  const rect = await page.evaluate(async () => {
    const image = document.querySelector('.affine-image-wrapper img');
    if (!image) {
      throw new Error();
    }
    return image.getBoundingClientRect();
  });

  await page.mouse.move(rect.left + rect.width / 2, rect.top + rect.height / 2);

  await page.waitForTimeout(150);

  const menu = page.locator('.embed-editing-state');

  expect(menu).toBeVisible();

  await page.evaluate(async () => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    const distance = viewport.scrollHeight - viewport.clientHeight;
    viewport.scrollTo(0, distance / 2);
  });

  await page.waitForTimeout(150);

  const [imageRect, menuRect] = await page.evaluate(async () => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }

    const image = document.querySelector('.affine-image-wrapper img');
    if (!image) {
      throw new Error();
    }

    const menu = document.querySelector('.embed-editing-state');
    if (!menu) {
      throw new Error();
    }
    return [
      image.getBoundingClientRect(),
      menu.getBoundingClientRect(),
    ] as const;
  });

  // < 1.059180567624251
  expect(imageRect.top).toBeCloseTo(menuRect.top, -0.325);
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
    { x: rect.x + 20, y: rect.y + 20 },
    { x: rect.x - 20, y: rect.y - 20 }
  );
  const rects = page.locator('.affine-page-selected-rects-container > *');
  await expect(rects).toHaveCount(1);
  const formatQuickBar = page.locator(`.format-quick-bar`);
  await expect(formatQuickBar).not.toBeVisible();
  await page.mouse.wheel(0, rect.y + rect.height);
  await expect(formatQuickBar).not.toBeVisible();
  await page.mouse.click(0, 0);
});
