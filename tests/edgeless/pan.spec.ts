import {
  activeNoteInEdgeless,
  assertEdgelessTool,
  locatorEdgelessToolButton,
  setEdgelessTool,
  switchEditorMode,
} from '../utils/actions/edgeless.js';
import {
  addBasicRectShapeElement,
  dragBetweenCoords,
  enterPlaygroundRoom,
  initEmptyEdgelessState,
  type,
  waitForInlineEditorStateUpdated,
  waitNextFrame,
} from '../utils/actions/index.js';
import {
  assertEdgelessSelectedRect,
  assertNotHasClass,
  assertRichTexts,
} from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

test('pan tool basic', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  const start = { x: 100, y: 100 };
  const end = { x: 200, y: 200 };
  await addBasicRectShapeElement(page, start, end);

  await setEdgelessTool(page, 'pan');
  await dragBetweenCoords(
    page,
    {
      x: start.x + 5,
      y: start.y + 5,
    },
    {
      x: start.x + 25,
      y: start.y + 25,
    }
  );
  await setEdgelessTool(page, 'default');

  await page.mouse.click(start.x + 25, start.y + 25);
  await assertEdgelessSelectedRect(page, [120, 120, 100, 100]);
});

test('pan tool shortcut', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  const start = { x: 100, y: 100 };
  const end = { x: 200, y: 200 };
  await addBasicRectShapeElement(page, start, end);

  await page.mouse.click(start.x + 5, start.y + 5);
  await assertEdgelessSelectedRect(page, [100, 100, 100, 100]);

  await page.keyboard.down('Space');
  await assertEdgelessTool(page, 'pan');

  await dragBetweenCoords(
    page,
    {
      x: start.x + 5,
      y: start.y + 5,
    },
    {
      x: start.x + 25,
      y: start.y + 25,
    }
  );

  await page.keyboard.up('Space');
  await assertEdgelessSelectedRect(page, [120, 120, 100, 100]);
});

test('pan tool shortcut should revert to the previous tool on keyup', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);
  await page.mouse.click(100, 100);

  await setEdgelessTool(page, 'brush');
  {
    await page.keyboard.down('Space');
    await assertEdgelessTool(page, 'pan');

    await page.keyboard.up('Space');
    await assertEdgelessTool(page, 'brush');
  }
});

test('pan tool shortcut does not affect other tools while using the tool', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  // Test if while drawing shortcut  does not switch to pan tool
  await setEdgelessTool(page, 'brush');
  await dragBetweenCoords(
    page,
    { x: 100, y: 110 },
    { x: 200, y: 300 },
    {
      click: true,
      beforeMouseUp: async () => {
        await page.keyboard.down('Space');
        await assertEdgelessTool(page, 'brush');
      },
    }
  );

  await setEdgelessTool(page, 'eraser');
  await dragBetweenCoords(
    page,
    { x: 100, y: 110 },
    { x: 200, y: 300 },
    {
      click: true,
      beforeMouseUp: async () => {
        await page.keyboard.down('Space');
        await assertEdgelessTool(page, 'eraser');
      },
    }
  );
  // Maybe add other tools too
});

test('pan tool shortcut when user is editing', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const ids = await initEmptyEdgelessState(page);
  await switchEditorMode(page);
  await setEdgelessTool(page, 'default');

  await activeNoteInEdgeless(page, ids.noteId);
  await waitForInlineEditorStateUpdated(page);

  await type(page, 'hello');
  await assertRichTexts(page, ['hello']);

  await page.keyboard.down('Space');
  const defaultButton = await locatorEdgelessToolButton(page, 'pan', false);
  await assertNotHasClass(defaultButton, 'pan');
  await waitNextFrame(page);
});
