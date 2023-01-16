import './utils/declare-test-window.js';
import { test, Page } from '@playwright/test';
import {
  activeEmbed,
  dragEmbedResizeByBottomLeft,
  dragEmbedResizeByBottomRight,
  enterPlaygroundRoom,
  moveToImage,
  redoByKeyboard,
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

async function initImageState(page: Page) {
  return await page.evaluate(() => {
    const { page } = window;
    const pageId = page.addBlock({ flavour: 'affine:page', title: 'hello' });
    const frameId = page.addBlock({ flavour: 'affine:frame' }, pageId);
    page.addBlock(
      {
        flavour: 'affine:embed',
        type: 'image',
        sourceId: '/test-card-1.png',
        width: 200,
        height: 180,
      },
      frameId
    );
    return { pageId, frameId };
  });
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
  await assertImageSize(page, { width: 200, height: 180 });

  await dragEmbedResizeByBottomLeft(page);
  await assertImageSize(page, { width: 315, height: 283.5 });

  await undoByKeyboard(page);
  await assertImageSize(page, { width: 200, height: 180 });

  await redoByKeyboard(page);
  await assertImageSize(page, { width: 315, height: 283.5 });
});

test('can drag resize image by right menu', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initImageState(page);
  await assertRichImage(page, 1);

  await activeEmbed(page);
  await assertRichDragButton(page);
  await assertImageSize(page, { width: 200, height: 180 });

  await dragEmbedResizeByBottomRight(page);
  await assertImageSize(page, { width: 305, height: 274.5 });

  await undoByKeyboard(page);
  await assertImageSize(page, { width: 200, height: 180 });

  await redoByKeyboard(page);
  await assertImageSize(page, { width: 305, height: 274.5 });
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
  await page.keyboard.press('Enter', { delay: 50 });
  await page.keyboard.type('aa');
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
  await page.keyboard.press('Enter', { delay: 50 });
  await page.keyboard.type('aa');
  await assertRichTexts(page, ['aa']);
});
