import './utils/declare-test-window.js';
import { Page, expect } from '@playwright/test';
import { test } from './utils/playwright.js';
import {
  activeEmbed,
  dragEmbedResizeByBottomLeft,
  dragEmbedResizeByBottomRight,
  enterPlaygroundRoom,
  moveToImage,
  pressEnter,
  redoByKeyboard,
  type,
  undoByKeyboard,
  focusRichText,
  initEmptyParagraphState,
} from './utils/actions/index.js';
import {
  assertImageOption,
  assertImageSize,
  assertKeyboardWorkInInput,
  assertRichDragButton,
  assertRichImage,
  assertRichTexts,
} from './utils/asserts.js';

async function initImageState(page: Page) {
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await page.evaluate(() => {
    const clipData = {
      'text/html': `<img src="${location.origin}/test-card-1.png" />`,
    };
    const dT = new DataTransfer();
    const e = new ClipboardEvent('paste', { clipboardData: dT });
    Object.defineProperty(e, 'target', {
      writable: false,
      value: document.body,
    });
    e.clipboardData?.setData('text/html', clipData['text/html']);
    document
      .getElementsByTagName('editor-container')[0]
      .clipboard['_clipboardEventDispatcher']['_onPaste'](e);
  });
  // due to pasting img calls fetch, so we need timeout for downloading finished.
  await page.waitForTimeout(500);
}

async function focusCaption(page: Page) {
  await page.click('.embed-editing-state>format-bar-button:nth-child(1)');
}

test('can drag resize image by left menu', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initImageState(page);
  await assertRichImage(page, 1);

  await activeEmbed(page);
  await assertRichDragButton(page);
  await assertImageSize(page, { width: 678, height: 509 });

  await dragEmbedResizeByBottomLeft(page);
  await assertImageSize(page, { width: 339, height: 254.5 });

  await undoByKeyboard(page);
  await assertImageSize(page, { width: 678, height: 509 });

  await redoByKeyboard(page);
  await assertImageSize(page, { width: 339, height: 254.5 });
});

test('can drag resize image by right menu', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initImageState(page);
  await assertRichImage(page, 1);

  await activeEmbed(page);
  await assertRichDragButton(page);
  await assertImageSize(page, { width: 678, height: 509 });

  await dragEmbedResizeByBottomRight(page);
  await assertImageSize(page, { width: 339, height: 254.5 });

  await undoByKeyboard(page);
  await assertImageSize(page, { width: 678, height: 509 });

  await redoByKeyboard(page);
  await assertImageSize(page, { width: 339, height: 254.5 });
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

  await activeEmbed(page);
  await moveToImage(page);
  await assertImageOption(page);

  await focusCaption(page);
  await assertKeyboardWorkInInput(
    page,
    page.locator('.affine-embed-wrapper-caption')
  );
  await pressEnter(page);
  await type(page, 'aa');
  await assertRichTexts(page, ['aa']);
});

const mockImageId = '_e2e_test_image_id_';
async function initMockImage(page: Page) {
  await page.evaluate(() => {
    const { page } = window;
    page.captureSync();
    const pageId = page.addBlock({ flavour: 'affine:page' });
    const frameId = page.addBlock({ flavour: 'affine:frame' }, pageId);
    page.addBlock(
      {
        flavour: 'affine:embed',
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

  const deliveringContent = await page
    .locator('.affine-image-block-loading-card .affine-image-block-content')
    .innerText();
  expect(deliveringContent).toBe('Delivering content...');

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

  const deliveringContent = await page
    .locator('.affine-image-block-loading-card .affine-image-block-content')
    .innerText();
  expect(deliveringContent).toBe('Delivering content...');

  await pageB.evaluate(async () => {
    const { page } = window;
    page.awarenessStore.setBlobState('_e2e_test_image_id_', /* uploaded */ 1);
  });

  // do not wait longer than 2s, because after 2s, `get image data` maybe call due to timeout
  await page.waitForTimeout(100);

  const img = page.locator('.affine-image-wrapper img');
  await expect(img).toBeVisible();
});
