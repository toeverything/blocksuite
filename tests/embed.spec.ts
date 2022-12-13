import './utils/declare-test-window';
import { test, Page } from '@playwright/test';
import {
  activeEmbed,
  dragEmbedResize,
  enterPlaygroundRoom,
  redoByKeyboard,
  undoByKeyboard,
} from './utils/actions';
import {
  assertImageSize,
  assertRichDragButton,
  assertRichImage,
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
