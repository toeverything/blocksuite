import './utils/declare-test-window.js';
import { test, Page } from '@playwright/test';
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
