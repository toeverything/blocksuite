import './utils/declare-test-window';
import { test, Page } from '@playwright/test';
import {
  activeEmbed,
  dragEmbedResize,
  enterPlaygroundRoom,
  moveToImage,
  redoByKeyboard,
  undoByKeyboard,
  focusCaption,
} from './utils/actions';
import {
  assertImageOption,
  assertImageSize,
  assertRichDragButton,
  assertRichImage,
  assertRichTexts,
} from './utils/asserts';

async function initImageState(page: Page) {
  await page.evaluate(() => {
    const { page } = window;
    const pageId = page.addBlock({ flavour: 'affine:page', title: 'hello' });
    const groupId = page.addBlock({ flavour: 'affine:group' }, pageId);
    page.addBlock(
      {
        flavour: 'affine:embed',
        type: 'image',
        sourceId: '/test-card-1.png',
        width: 200,
        height: 180,
      },
      groupId
    );
  });
}

test('can drag resize image', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initImageState(page);
  await assertRichImage(page, 1);

  await activeEmbed(page);
  await assertRichDragButton(page);
  await assertImageSize(page, { width: 200, height: 180 });

  await dragEmbedResize(page);
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
  await assertRichTexts(page, ['\n', 'aa']);
});

test('hover image block will show image-option', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initImageState(page);
  await assertRichImage(page, 1);
  await activeEmbed(page);
  await moveToImage(page);
  await assertImageOption(page);
  await focusCaption(page);
  await page.keyboard.press('Enter', { delay: 50 });
  await page.keyboard.type('aa');
  await assertRichTexts(page, ['aa']);
});
