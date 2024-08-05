import {
  NOTE_INIT_HEIGHT,
  NOTE_MIN_WIDTH,
} from '@blocks/root-block/edgeless/utils/consts.js';
import { expect } from '@playwright/test';

import {
  activeNoteInEdgeless,
  dragBetweenCoords,
  enterPlaygroundRoom,
  getNoteRect,
  initEmptyEdgelessState,
  redoByClick,
  selectNoteInEdgeless,
  setEdgelessTool,
  switchEditorMode,
  triggerComponentToolbarAction,
  type,
  undoByClick,
  waitForInlineEditorStateUpdated,
  waitNextFrame,
  zoomResetByKeyboard,
} from '../../utils/actions/index.js';
import {
  assertBlockCount,
  assertEdgelessSelectedRect,
  assertExists,
  assertNoteRectEqual,
  assertRectEqual,
  assertRichTexts,
} from '../../utils/asserts.js';
import { test } from '../../utils/playwright.js';

test('resize note in edgeless mode', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyEdgelessState(page);
  await switchEditorMode(page);
  await zoomResetByKeyboard(page);
  await activeNoteInEdgeless(page, noteId);
  await waitNextFrame(page, 400);
  await type(page, 'hello');
  await assertRichTexts(page, ['hello']);

  // unselect note
  await page.mouse.click(50, 50);

  expect(noteId).toBe('2'); // 0 for page, 1 for surface
  await selectNoteInEdgeless(page, noteId);

  const initRect = await getNoteRect(page, noteId);
  const leftHandle = page.locator('.handle[aria-label="left"] .resize');
  const box = await leftHandle.boundingBox();
  assertExists(box);

  await dragBetweenCoords(
    page,
    { x: box.x + 5, y: box.y + 5 },
    { x: box.x + 105, y: box.y + 5 }
  );
  const draggedRect = await getNoteRect(page, noteId);
  assertRectEqual(draggedRect, {
    x: initRect.x + 100,
    y: initRect.y,
    w: initRect.w - 100,
    h: initRect.h,
  });

  await switchEditorMode(page);
  await switchEditorMode(page);
  const newRect = await getNoteRect(page, noteId);
  assertRectEqual(newRect, draggedRect);
});

test('resize note then auto size and custom size', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyEdgelessState(page);
  await switchEditorMode(page);
  await zoomResetByKeyboard(page);
  await activeNoteInEdgeless(page, noteId);
  await waitNextFrame(page, 400);
  await type(page, 'hello');
  await assertRichTexts(page, ['hello']);
  // unselect note
  await page.mouse.click(50, 50);
  await selectNoteInEdgeless(page, noteId);

  const initRect = await getNoteRect(page, noteId);
  const bottomRightResize = page.locator(
    '.handle[aria-label="bottom-right"] .resize'
  );
  const box = await bottomRightResize.boundingBox();
  assertExists(box);

  await dragBetweenCoords(
    page,
    { x: box.x + 5, y: box.y + 5 },
    { x: box.x + 5, y: box.y + 105 }
  );

  const draggedRect = await getNoteRect(page, noteId);
  assertRectEqual(draggedRect, {
    x: initRect.x,
    y: initRect.y,
    w: initRect.w,
    h: initRect.h + 100,
  });

  await triggerComponentToolbarAction(page, 'autoSize');
  await waitNextFrame(page, 200);
  const autoSizeRect = await getNoteRect(page, noteId);
  assertRectEqual(autoSizeRect, initRect);

  await triggerComponentToolbarAction(page, 'autoSize');
  await waitNextFrame(page, 200);
  await assertNoteRectEqual(page, noteId, draggedRect);

  await undoByClick(page);
  await waitNextFrame(page, 200);
  await assertNoteRectEqual(page, noteId, initRect);

  await redoByClick(page);
  await waitNextFrame(page, 200);
  await assertNoteRectEqual(page, noteId, draggedRect);
});

test('drag to add customized size note', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);

  await switchEditorMode(page);
  await zoomResetByKeyboard(page);
  await setEdgelessTool(page, 'note');
  // add note at 300,300
  await page.mouse.move(300, 300);
  await page.mouse.down();
  await page.mouse.move(900, 600, { steps: 10 });
  await page.mouse.up();
  // should wait for inline editor update and resizeObserver callback
  await waitForInlineEditorStateUpdated(page);

  // assert add note success
  await assertBlockCount(page, 'edgeless-note', 2);

  // click out of note
  await page.mouse.click(250, 200);
  // click on note to select it
  await page.mouse.click(600, 500);
  // assert selected note
  // note add on edgeless mode will have a offsetX of 30 and offsetY of 40
  await assertEdgelessSelectedRect(page, [270, 260, 600, 300]);
});

test('drag to add customized size note: should clamp to min width and min height', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);

  await switchEditorMode(page);
  await zoomResetByKeyboard(page);
  await setEdgelessTool(page, 'note');

  // add note at 300,300
  await page.mouse.move(300, 300);
  await page.mouse.down();
  await page.mouse.move(400, 360, { steps: 10 });
  await page.mouse.up();
  await waitNextFrame(page);

  await waitNextFrame(page);

  // should wait for inline editor update and resizeObserver callback
  await waitForInlineEditorStateUpdated(page);
  // assert add note success
  await assertBlockCount(page, 'edgeless-note', 2);

  // click out of note
  await page.mouse.click(250, 200);
  // click on note to select it
  await page.mouse.click(320, 300);
  // assert selected note
  // note add on edgeless mode will have a offsetX of 30 and offsetY of 40
  await assertEdgelessSelectedRect(page, [
    270,
    260,
    NOTE_MIN_WIDTH,
    NOTE_INIT_HEIGHT,
  ]);
});
