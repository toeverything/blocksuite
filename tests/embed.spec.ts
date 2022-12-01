import { Page, test } from '@playwright/test';
import {
  activeEmbed,
  dragEmbedResize,
  enterPlaygroundRoom,
  redoByKeyboard,
  undoByClick,
  undoByKeyboard,
} from './utils/actions';
import {
  assertImageSize,
  assertRichDragButton,
  assertRichImage,
} from './utils/asserts';

test('Drag and drop to change image size', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await page.evaluate(() => {
    const page = window.workspace
      .createPage('page0')
      .register(window.blockSchema);
    const editor = document.createElement('editor-container');
    editor.page = page;
    document.body.appendChild(editor);
    const pageId = page.addBlock({ flavour: 'affine:page', title: 'hello' });
    const groupId = page.addBlock({ flavour: 'affine:group' }, pageId);
    page.addBlock(
      {
        flavour: 'affine:embed',
        type: 'image',
        source:
          'https://images-eu.ssl-images-amazon.com/images/G/02/kindle/journeys/Gj9vUkHh7N3zSj99/YzllYjE5NGQt-w758._SY608_CB604768303_.jpg',
        width: 200,
        height: 180,
      },
      groupId
    );
  });

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
