import type { Page } from '@playwright/test';

import { expect } from '@playwright/test';

import {
  activeEmbed,
  copyByKeyboard,
  dragEmbedResizeByTopLeft,
  dragEmbedResizeByTopRight,
  enterPlaygroundRoom,
  initImageState,
  moveToImage,
  pasteByKeyboard,
  pressArrowLeft,
  pressEnter,
  redoByClick,
  redoByKeyboard,
  type,
  undoByKeyboard,
  waitNextFrame,
} from '../utils/actions/index.js';
import {
  assertImageOption,
  assertImageSize,
  assertRichDragButton,
  assertRichImage,
  assertRichTextInlineRange,
  assertRichTexts,
} from '../utils/asserts.js';
import '../utils/declare-test-window.js';
import { test } from '../utils/playwright.js';

async function focusCaption(page: Page) {
  await page.click(
    '.affine-image-toolbar-container .image-toolbar-button.caption'
  );
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
  await assertImageSize(page, { width: 342, height: 256 });

  await undoByKeyboard(page);
  await waitNextFrame(page);
  await assertImageSize(page, { width: 736, height: 552 });

  await redoByKeyboard(page);
  await waitNextFrame(page);
  await assertImageSize(page, { width: 342, height: 256 });
});

test('can drag resize image by right menu', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initImageState(page);
  await assertRichImage(page, 1);

  await activeEmbed(page);
  await assertRichDragButton(page);
  await assertImageSize(page, { width: 736, height: 552 });

  await dragEmbedResizeByTopRight(page);
  await assertImageSize(page, { width: 322, height: 241 });

  await undoByKeyboard(page);
  await assertImageSize(page, { width: 736, height: 552 });

  await redoByKeyboard(page);
  await assertImageSize(page, { width: 322, height: 241 });
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

  await redoByClick(page);
  await assertRichImage(page, 0);
});

test('can click and copy image', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initImageState(page);
  await assertRichImage(page, 1);

  await activeEmbed(page);
  await copyByKeyboard(page);
  await pressEnter(page);
  await waitNextFrame(page);

  await pasteByKeyboard(page);
  await waitNextFrame(page, 200);
  await assertRichImage(page, 2);
});

test('enter shortcut on focusing embed block and its caption', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initImageState(page);
  await assertRichImage(page, 1);

  await moveToImage(page);
  await assertImageOption(page);

  const caption = page.locator('affine-image block-caption-editor textarea');
  await focusCaption(page);
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

test('should support the enter key of image caption', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initImageState(page);
  await assertRichImage(page, 1);

  await moveToImage(page);
  await assertImageOption(page);

  const caption = page.locator('affine-image block-caption-editor textarea');
  await focusCaption(page);
  await type(page, 'abc123');
  await pressArrowLeft(page, 3);
  await pressEnter(page);
  await expect(caption).toHaveValue('abc');

  await assertRichTexts(page, ['123']);
  await assertRichTextInlineRange(page, 0, 0, 0);
});
