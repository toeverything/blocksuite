import './utils/declare-test-window.js';

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

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
  waitNextFrame,
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
  await page.click('.embed-editing-state>icon-button:nth-child(1)');
}

test('can drag resize image by left menu', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initImageState(page);
  await assertRichImage(page, 1);

  await activeEmbed(page);
  await assertRichDragButton(page);
  await assertImageSize(page, { width: 736, height: 552 });

  await dragEmbedResizeByTopLeft(page);
  await waitNextFrame(page);
  await assertImageSize(page, { width: 340, height: 255 });

  await undoByKeyboard(page);
  await waitNextFrame(page);
  await assertImageSize(page, { width: 736, height: 552 });

  await redoByKeyboard(page);
  await waitNextFrame(page);
  await assertImageSize(page, { width: 340, height: 255 });
});

test('can drag resize image by right menu', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initImageState(page);
  await assertRichImage(page, 1);

  await activeEmbed(page);
  await assertRichDragButton(page);
  await assertImageSize(page, { width: 736, height: 552 });

  await dragEmbedResizeByTopRight(page);
  await assertImageSize(page, { width: 320, height: 240 });

  await undoByKeyboard(page);
  await assertImageSize(page, { width: 736, height: 552 });

  await redoByKeyboard(page);
  await assertImageSize(page, { width: 320, height: 240 });
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

  const caption = page.locator('.affine-embed-wrapper-caption');
  await focusCaption(page);
  await assertKeyboardWorkInInput(page, caption);
  await type(page, '123');

  test.info().annotations.push({
    type: 'issue',
    description: 'https://github.com/toeverything/blocksuite/issues/2495',
  });

  // blur
  await page.mouse.click(0, 500);
  await caption.click({ position: { x: 0, y: 0 } });
  await type(page, 'abc');
  await expect(caption).toHaveValue('abc123');
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
  await pressEnter(page);
  await insertThreeLevelLists(page, 6);

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

  await page.evaluate(
    async ([rect]) => {
      const viewport = document.querySelector('.affine-default-viewport');
      if (!viewport) {
        throw new Error();
      }
      // const distance = viewport.scrollHeight - viewport.clientHeight;
      viewport.scrollTo(0, (rect.bottom + rect.top) / 2);
    },
    [rect]
  );

  await page.waitForTimeout(150);

  const [imageRect, menuRect] = await page.evaluate(async () => {
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

  //              -275                       +76
  expect(imageRect.top).toBeCloseTo(menuRect.top - 76 - 275, -0.325);
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
  const rects = page.locator('affine-selected-blocks > *');
  await expect(rects).toHaveCount(1);
  const formatQuickBar = page.locator(`.format-quick-bar`);
  await expect(formatQuickBar).not.toBeVisible();
  await page.mouse.wheel(0, rect.y + rect.height);
  await expect(formatQuickBar).not.toBeVisible();
  await page.mouse.click(0, 0);
});

const mockImageId = '_e2e_test_image_id_';

async function initMockImage(page: Page) {
  await page.evaluate(() => {
    const { page } = window;
    page.captureSync();
    const pageId = page.addBlock('affine:page');
    const noteId = page.addBlock('affine:note', {}, pageId);
    page.addBlock(
      'affine:image',
      {
        sourceId: '_e2e_test_image_id_',
        width: 200,
        height: 180,
      },
      noteId
    );
    page.captureSync();
  });
}

test('image loading but failed', async ({ page }) => {
  const room = await enterPlaygroundRoom(page, { blobStorage: ['mock'] });

  const timeout = 2000;

  // block image data request, force wait 100ms for loading test,
  // always return 404
  await page.route(
    `**/api/workspace/${room}/blob/${mockImageId}`,
    async route => {
      await page.waitForTimeout(timeout);
      // broken image
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

  await page.waitForTimeout(timeout);

  await expect(
    page.locator('.affine-image-block-loading-card .affine-image-block-content')
  ).toContainText('Delivering content...');

  // 1s + 2s + 3s
  await page.waitForTimeout(6000);

  const imageNotFound = page.locator('.affine-image-block-not-found-card');
  await expect(imageNotFound).toBeVisible();
});

test('image loading but success', async ({ page }) => {
  const room = await enterPlaygroundRoom(page, { blobStorage: ['mock'] });
  const imageBuffer = await readFile(
    fileURLToPath(new URL('./fixtures/smile.png', import.meta.url))
  );

  const timeout = 2000;
  let count = 0;

  // block image data request, force wait 100ms for loading test,
  // always return 404
  await page.route(
    `**/api/workspace/${room}/blob/${mockImageId}`,
    async route => {
      await page.waitForTimeout(timeout);
      count++;
      if (count === 3) {
        return route.fulfill({
          status: 200,
          body: imageBuffer,
        });
      }
      // broken image
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

  await page.waitForTimeout(timeout);

  await expect(
    page.locator('.affine-image-block-loading-card .affine-image-block-content')
  ).toContainText('Delivering content...');

  // 1s + 2s + 3s
  await page.waitForTimeout(6000);

  const img = page.locator('.affine-image-wrapper img');
  await expect(img).toBeVisible();
  const src = await img.getAttribute('src');
  expect(src).toBeDefined();
});

test('image loaded successfully', async ({ page }) => {
  const room = await enterPlaygroundRoom(page, { blobStorage: ['mock'] });
  const imageBuffer = await readFile(
    fileURLToPath(new URL('./fixtures/smile.png', import.meta.url))
  );
  await page.route(
    `**/api/workspace/${room}/blob/${mockImageId}`,
    async route => {
      return route.fulfill({
        status: 200,
        body: imageBuffer,
      });
    }
  );

  await initMockImage(page);

  await page.waitForTimeout(1000);

  const img = page.locator('.affine-image-wrapper img');
  await expect(img).toBeVisible();
  const src = await img.getAttribute('src');
  expect(src).toBeDefined();
});
