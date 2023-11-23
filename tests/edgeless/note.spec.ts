import { expect } from '@playwright/test';

// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { NOTE_WIDTH } from '../../packages/blocks/src/_common/consts.js';
import {
  activeNoteInEdgeless,
  addNote,
  assertEdgelessTool,
  changeEdgelessNoteBackground,
  countBlock,
  exitEditing,
  getNoteRect,
  hoverOnNote,
  initThreeNotes,
  locatorComponentToolbar,
  locatorEdgelessZoomToolButton,
  selectNoteInEdgeless,
  setEdgelessTool,
  switchEditorMode,
  triggerComponentToolbarAction,
  zoomResetByKeyboard,
} from '../utils/actions/edgeless.js';
import {
  click,
  clickBlockById,
  copyByKeyboard,
  dragBetweenCoords,
  dragHandleFromBlockToBlockBottomById,
  enterPlaygroundRoom,
  fillLine,
  focusRichText,
  initEmptyEdgelessState,
  initSixParagraphs,
  initThreeParagraphs,
  pasteByKeyboard,
  pressArrowDown,
  pressArrowUp,
  pressEnter,
  redoByClick,
  redoByKeyboard,
  type,
  undoByClick,
  undoByKeyboard,
  waitForVirgoStateUpdated,
  waitNextFrame,
} from '../utils/actions/index.js';
import {
  assertBlockCount,
  assertEdgelessHoverRect,
  assertEdgelessNonSelectedRect,
  assertEdgelessNoteBackground,
  assertEdgelessSelectedRect,
  assertNativeSelectionRangeCount,
  assertNoteSequence,
  assertNoteXYWH,
  assertRectEqual,
  assertRectExist,
  assertRichTexts,
  assertRichTextVRange,
} from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

const CENTER_X = 450;
const CENTER_Y = 450;

test('can drag selected non-active note', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await focusRichText(page);
  await type(page, 'hello');
  await assertRichTexts(page, ['hello']);

  await switchEditorMode(page);
  await zoomResetByKeyboard(page);
  await assertNoteXYWH(page, [0, 0, NOTE_WIDTH, 91]);

  // selected, non-active
  await page.mouse.click(CENTER_X, CENTER_Y);
  await dragBetweenCoords(
    page,
    { x: CENTER_X, y: CENTER_Y },
    { x: CENTER_X, y: CENTER_Y + 100 }
  );
  await assertNoteXYWH(page, [0, 100, NOTE_WIDTH, 91]);
});

test('resize note in edgeless mode', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const ids = await initEmptyEdgelessState(page);
  await switchEditorMode(page);
  await zoomResetByKeyboard(page);
  await activeNoteInEdgeless(page, ids.noteId);
  await waitNextFrame(page, 400);
  await type(page, 'hello');
  await assertRichTexts(page, ['hello']);

  // unselect note
  await page.mouse.click(50, 50);

  expect(ids.noteId).toBe('2'); // 0 for page, 1 for surface
  await selectNoteInEdgeless(page, ids.noteId);

  const initRect = await getNoteRect(page, ids);
  const leftHandle = page.locator('.handle[aria-label="left"] .resize');
  const box = await leftHandle.boundingBox();
  if (box === null) throw new Error();

  await dragBetweenCoords(
    page,
    { x: box.x + 5, y: box.y + 5 },
    { x: box.x + 105, y: box.y + 5 }
  );
  const draggedRect = await getNoteRect(page, ids);
  assertRectEqual(draggedRect, {
    x: initRect.x + 100,
    y: initRect.y,
    w: initRect.w - 100,
    h: initRect.h,
  });

  await switchEditorMode(page);
  await switchEditorMode(page);
  const newRect = await getNoteRect(page, ids);
  assertRectEqual(newRect, draggedRect);
});

test('add Note', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);

  await switchEditorMode(page);
  await zoomResetByKeyboard(page);
  await addNote(page, 'hello', 300, 300);

  await assertEdgelessTool(page, 'default');
  await assertRichTexts(page, ['', 'hello']);
  await page.mouse.click(300, 200);
  await page.mouse.click(350, 320);
  await assertEdgelessSelectedRect(page, [270, 260, 448, 91]);
});

test('add empty Note', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);

  await switchEditorMode(page);
  await zoomResetByKeyboard(page);
  await setEdgelessTool(page, 'note');
  // add note at 300,300
  await page.mouse.click(300, 300);
  await waitForVirgoStateUpdated(page);
  // should wait for virgo update and resizeObserver callback
  await waitNextFrame(page);

  // assert add note success
  await assertBlockCount(page, 'note', 2);

  // click out of note
  await page.mouse.click(250, 200);

  // assert empty note is removed
  await page.mouse.move(320, 320);
  await assertBlockCount(page, 'note', 1);
});

test('always keep at least 1 note block', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);

  await switchEditorMode(page);
  await setEdgelessTool(page, 'default');

  // clicking in default mode will try to remove empty note block
  await page.mouse.click(0, 0);

  const notes = await page.locator('affine-note').all();
  expect(notes.length).toEqual(1);
});

test('edgeless arrow up/down', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const ids = await initEmptyEdgelessState(page);
  await switchEditorMode(page);
  await activeNoteInEdgeless(page, ids.noteId);
  await waitNextFrame(page, 400);

  await type(page, 'aaaaa');
  await pressEnter(page);
  await type(page, 'aaaaa');
  await pressEnter(page);
  await type(page, 'aaa');

  await activeNoteInEdgeless(page, ids.noteId);
  await waitForVirgoStateUpdated(page);
  // 0 for page, 1 for surface, 2 for note, 3 for paragraph
  expect(ids.paragraphId).toBe('3');
  await clickBlockById(page, ids.paragraphId);
  await assertRichTextVRange(page, 0, 5, 0);

  await pressArrowDown(page);
  await waitNextFrame(page);
  await assertRichTextVRange(page, 1, 5, 0);

  await pressArrowUp(page);
  await waitNextFrame(page);
  await assertRichTextVRange(page, 0, 5, 0);

  await pressArrowUp(page);
  await waitNextFrame(page);
  await assertRichTextVRange(page, 0, 0, 0);
});

test('dragging un-selected note', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await focusRichText(page);
  await type(page, 'hello');
  await assertRichTexts(page, ['hello']);

  await switchEditorMode(page);

  const noteBox = await page
    .locator('.edgeless-block-portal-note')
    .boundingBox();
  if (!noteBox) {
    throw new Error('Missing edgeless affine-note');
  }
  await page.mouse.move(noteBox.x + 5, noteBox.y + 5);
  await assertEdgelessHoverRect(page, [
    noteBox.x,
    noteBox.y,
    noteBox.width,
    noteBox.height,
  ]);

  await dragBetweenCoords(
    page,
    { x: noteBox.x + 5, y: noteBox.y + 5 },
    { x: noteBox.x + 5, y: noteBox.y + 25 },
    { steps: 10 }
  );

  await page.mouse.move(noteBox.x + 35, noteBox.y + 35);
  await assertEdgelessHoverRect(page, [
    noteBox.x,
    noteBox.y + 20,
    noteBox.width,
    noteBox.height,
  ]);
});

test('drag handle should be shown when a note is actived in default mode or hidden in other modes', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await focusRichText(page);
  await type(page, 'hello');
  await assertRichTexts(page, ['hello']);

  await switchEditorMode(page);
  const noteBox = await page
    .locator('.edgeless-block-portal-note')
    .boundingBox();
  if (!noteBox) {
    throw new Error('Missing edgeless affine-note');
  }

  const [x, y] = [noteBox.x + 26, noteBox.y + noteBox.height / 2];

  await page.mouse.move(x, y);
  await expect(page.locator('.affine-drag-handle-container')).toBeHidden();
  await page.mouse.dblclick(x, y);
  await waitNextFrame(page);
  await page.mouse.move(x, y);

  await expect(page.locator('.affine-drag-handle-container')).toBeVisible();

  await page.mouse.move(0, 0);
  await setEdgelessTool(page, 'shape');
  await page.mouse.move(x, y);
  await expect(page.locator('.affine-drag-handle-container')).toBeHidden();

  await page.mouse.move(0, 0);
  await setEdgelessTool(page, 'default');
  await page.mouse.move(x, y);
  await expect(page.locator('.affine-drag-handle-container')).toBeVisible();
});

test('drag handle should work inside one note', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await initThreeParagraphs(page);

  await switchEditorMode(page);

  await page.mouse.dblclick(CENTER_X, CENTER_Y);
  await dragHandleFromBlockToBlockBottomById(page, '3', '5');
  await waitNextFrame(page);
  await expect(page.locator('affine-drag-handle-container')).toBeHidden();
  await assertRichTexts(page, ['456', '789', '123']);
});

test('drag handle should work across multiple notes', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await switchEditorMode(page);

  await setEdgelessTool(page, 'note');

  await page.mouse.click(300, 200);
  await focusRichText(page, 3);
  await waitNextFrame(page);

  // block id 7
  await type(page, '000');

  await page.mouse.dblclick(CENTER_X, CENTER_Y);
  await dragHandleFromBlockToBlockBottomById(page, '3', '7');
  await expect(page.locator('.affine-drag-handle-container')).toBeHidden();
  await waitNextFrame(page);
  await assertRichTexts(page, ['456', '789', '000', '123']);

  // await page.mouse.dblclick(305, 305);
  await dragHandleFromBlockToBlockBottomById(page, '3', '4');
  await waitNextFrame(page);
  await expect(page.locator('.affine-drag-handle-container')).toBeHidden();
  await assertRichTexts(page, ['456', '123', '789', '000']);

  await expect(page.locator('selected > *')).toHaveCount(0);
});

test.describe('note slicer', () => {
  test('note slicer will add new note', async ({ page }) => {
    await enterPlaygroundRoom(page);
    const ids = await initEmptyEdgelessState(page);
    await initSixParagraphs(page);

    await switchEditorMode(page);
    await selectNoteInEdgeless(page, ids.noteId);

    await hoverOnNote(page, ids.noteId, [0, 60]);
    await waitNextFrame(page);
    await expect(page.locator('affine-note-slicer').isVisible()).toBeTruthy();

    const buttonRect = await page
      .locator('note-slicer-button .slicer-button')
      .boundingBox();

    assertRectExist(buttonRect);

    await page.mouse.move(
      buttonRect.x + 1,
      buttonRect.y + buttonRect.height / 2
    );

    await waitNextFrame(page, 2000);
    await expect(
      page.locator('affine-note-slicer-popupbutton').isVisible()
    ).toBeTruthy();
    await page.locator('affine-note-slicer-popupbutton').click();

    await expect(page.locator('.edgeless-block-portal-note')).toHaveCount(2);
  });

  test('note slicer button should appears at right position', async ({
    page,
  }) => {
    await enterPlaygroundRoom(page);
    const ids = await initEmptyEdgelessState(page);
    await initThreeParagraphs(page);
    await assertRichTexts(page, ['123', '456', '789']);

    await switchEditorMode(page);
    await selectNoteInEdgeless(page, ids.noteId);

    const blockes = await page
      .locator(`[data-block-id="${ids.noteId}"] [data-block-id]`)
      .all();
    expect(blockes.length).toBe(3);

    const firstBlockRect = await blockes[0].boundingBox();
    assertRectExist(firstBlockRect);
    const secondblockRect = await blockes[1].boundingBox();
    assertRectExist(secondblockRect);
    await page.mouse.move(
      secondblockRect.x + 1,
      secondblockRect.y + secondblockRect.height / 2
    );

    const slicerButtonRect = await page
      .locator('note-slicer-button .slicer-button')
      .boundingBox();
    assertRectExist(slicerButtonRect);

    const buttonRectMiddle = slicerButtonRect.y + slicerButtonRect.height / 2;

    expect(buttonRectMiddle).toBeGreaterThan(
      firstBlockRect.y + firstBlockRect.height
    );
    expect(buttonRectMiddle).toBeLessThan(secondblockRect.y);
  });

  test('note slicer button should scale when hovers on it', async ({
    page,
  }) => {
    await enterPlaygroundRoom(page);
    const ids = await initEmptyEdgelessState(page);
    await initSixParagraphs(page);

    await switchEditorMode(page);

    await selectNoteInEdgeless(page, ids.noteId);

    await hoverOnNote(page, ids.noteId, [0, 60]);
    await waitNextFrame(page);
    await expect(page.locator('affine-note-slicer').isVisible()).toBeTruthy();

    const buttonRect = await page
      .locator('note-slicer-button .slicer-button')
      .boundingBox();

    assertRectExist(buttonRect);

    await page.mouse.move(
      buttonRect.x + 1,
      buttonRect.y + buttonRect.height / 2
    );

    await waitNextFrame(page, 2000);
    const popupButtonRect = await page
      .locator('affine-note-slicer-popupbutton')
      .boundingBox();
    assertRectExist(popupButtonRect);
    expect(popupButtonRect.width / buttonRect.width).toBeCloseTo(1.2);
  });

  test('note slicer should has right z-index', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyEdgelessState(page);
    await switchEditorMode(page);

    const firstNoteId = await addNote(page, 'hello\n123\n456\n789', 50, 500);
    const secondNoteId = await addNote(page, 'world\n123\n456\n789', 100, 550);
    const lastNoteId = await addNote(page, 'done\n123\n456\n789', 150, 600);
    await exitEditing(page);
    await waitNextFrame(page);
    await selectNoteInEdgeless(page, lastNoteId);
    await hoverOnNote(page, lastNoteId);
    await waitNextFrame(page);
    const zIndexPattern = /z-index:\s*(\d+)/;

    let styleText =
      (await page.locator('affine-note-slicer').getAttribute('style')) ?? '';
    let result = zIndexPattern.exec(styleText);
    expect(result?.[1]).toBe('3');

    await selectNoteInEdgeless(page, secondNoteId);
    await hoverOnNote(page, secondNoteId);

    styleText =
      (await page.locator('affine-note-slicer').getAttribute('style')) ?? '';
    result = zIndexPattern.exec(styleText);
    expect(result?.[1]).toBe('2');

    await selectNoteInEdgeless(page, firstNoteId);
    await hoverOnNote(page, firstNoteId);

    styleText =
      (await page.locator('affine-note-slicer').getAttribute('style')) ?? '';
    result = zIndexPattern.exec(styleText);
    expect(result?.[1]).toBe('1');
  });
});

test('undo/redo should work correctly after clipping', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const ids = await initEmptyEdgelessState(page);
  await initSixParagraphs(page);

  await switchEditorMode(page);

  await selectNoteInEdgeless(page, ids.noteId);

  await hoverOnNote(page, ids.noteId, [0, 60]);
  await waitNextFrame(page, 500);

  const buttonRect = await page
    .locator('note-slicer-button .slicer-button')
    .boundingBox();

  assertRectExist(buttonRect);

  await page.mouse.move(buttonRect.x + 1, buttonRect.y + buttonRect.height / 2);

  await waitNextFrame(page, 2000);
  await page.locator('affine-note-slicer-popupbutton').click();

  await undoByKeyboard(page);
  await waitNextFrame(page);
  await expect(page.locator('.edgeless-block-portal-note')).toHaveCount(1);
  await redoByKeyboard(page);
  await waitNextFrame(page);
  await expect(page.locator('.edgeless-block-portal-note')).toHaveCount(2);
});

test('undo/redo should work correctly after resizing', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const ids = await initEmptyEdgelessState(page);
  await switchEditorMode(page);
  await zoomResetByKeyboard(page);
  await activeNoteInEdgeless(page, ids.noteId);
  await waitNextFrame(page, 400);
  // current implementation may be a little inefficient
  await fillLine(page, true);

  await page.mouse.click(0, 0);
  await waitNextFrame(page, 400);
  await selectNoteInEdgeless(page, ids.noteId);

  const initRect = await getNoteRect(page, ids);
  const rightHandle = page.locator('.handle[aria-label="right"] .resize');
  const box = await rightHandle.boundingBox();
  if (box === null) throw new Error();

  await dragBetweenCoords(
    page,
    { x: box.x + 5, y: box.y + 5 },
    { x: box.x - 45, y: box.y + 5 }
  );
  const draggedRect = await getNoteRect(page, ids);
  assertRectEqual(draggedRect, {
    x: initRect.x,
    y: initRect.y,
    w: initRect.w - 50,
    h: draggedRect.h, // not assert `h` here
  });
  expect(draggedRect.h).toBeGreaterThan(initRect.h);

  await undoByKeyboard(page);
  await waitNextFrame(page);
  const undoRect = await getNoteRect(page, ids);
  assertRectEqual(undoRect, initRect);

  await redoByKeyboard(page);
  await waitNextFrame(page);
  const redoRect = await getNoteRect(page, ids);
  assertRectEqual(redoRect, draggedRect);
});

test('format quick bar should show up when double-clicking on text', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await initThreeParagraphs(page);
  await switchEditorMode(page);

  await page.mouse.dblclick(CENTER_X, CENTER_Y);
  await waitNextFrame(page);

  await page
    .locator('.affine-rich-text')
    .nth(1)
    .dblclick({
      position: { x: 10, y: 10 },
      delay: 20,
    });
  await page.waitForTimeout(200);
  const formatBar = page.locator('.affine-format-bar-widget');
  await expect(formatBar).toBeVisible();
});

test('when editing text in edgeless, should hide component toolbar', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  const ids = await initEmptyEdgelessState(page);
  await initThreeParagraphs(page);
  await switchEditorMode(page);

  await selectNoteInEdgeless(page, ids.noteId);

  const toolbar = locatorComponentToolbar(page);
  await expect(toolbar).toBeVisible();

  await page.mouse.click(0, 0);
  await activeNoteInEdgeless(page, ids.noteId);
  await expect(toolbar).toBeHidden();
});

test('duplicate note should work correctly', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const ids = await initEmptyEdgelessState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await switchEditorMode(page);

  await selectNoteInEdgeless(page, ids.noteId);

  await triggerComponentToolbarAction(page, 'duplicate');
  const moreActionsContainer = page.locator('.more-actions-container');
  await expect(moreActionsContainer).toBeHidden();

  const noteLocator = page.locator('edgeless-block-portal-note');
  await expect(noteLocator).toHaveCount(2);
  const [firstNote, secondNote] = await noteLocator.all();

  // content should be same
  expect(
    (await firstNote.innerText()) === (await secondNote.innerText())
  ).toBeTruthy();

  // size should be same
  const firstNoteBox = await firstNote.boundingBox();
  const secondNoteBox = await secondNote.boundingBox();
  expect(firstNoteBox?.width === secondNoteBox?.width).toBeTruthy();
  expect(firstNoteBox?.height === secondNoteBox?.height).toBeTruthy();
});

test('double click toolbar zoom button, should not add text', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  const zoomOutButton = await locatorEdgelessZoomToolButton(
    page,
    'zoomOut',
    false
  );
  await zoomOutButton.dblclick();
  await assertEdgelessNonSelectedRect(page);
});

test('change note color', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const ids = await initEmptyEdgelessState(page);
  await initThreeParagraphs(page);
  await switchEditorMode(page);

  await assertEdgelessNoteBackground(
    page,
    ids.noteId,
    '--affine-background-secondary-color'
  );

  await selectNoteInEdgeless(page, ids.noteId);
  await triggerComponentToolbarAction(page, 'changeNoteColor');
  const color = '--affine-tag-blue';
  await changeEdgelessNoteBackground(page, color);
  await assertEdgelessNoteBackground(page, ids.noteId, color);
});

test('cursor for active and inactive state', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await focusRichText(page);
  await type(page, 'hello');
  await pressEnter(page);
  await pressEnter(page);
  await assertRichTexts(page, ['hello', '', '']);

  // inactive
  await switchEditorMode(page);
  await undoByClick(page);
  await waitNextFrame(page);

  await redoByClick(page);
  await waitNextFrame(page);

  // active
  await page.mouse.dblclick(CENTER_X, CENTER_Y);
  await waitNextFrame(page);
  await assertNativeSelectionRangeCount(page, 1);

  await undoByClick(page);
  await waitNextFrame(page);
  await assertNativeSelectionRangeCount(page, 1);
});

test('continuous undo and redo (note block add operation) should work', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await focusRichText(page);
  await type(page, 'hello');
  await switchEditorMode(page);
  await click(page, { x: 260, y: 450 });
  await copyByKeyboard(page);

  let count = await countBlock(page, 'affine-note');
  expect(count).toBe(1);

  await page.mouse.move(100, 100);
  await pasteByKeyboard(page, false);
  await waitNextFrame(page, 1000);

  await page.mouse.move(200, 200);
  await pasteByKeyboard(page, false);
  await waitNextFrame(page, 1000);

  await page.mouse.move(300, 300);
  await pasteByKeyboard(page, false);
  await waitNextFrame(page, 1000);

  count = await countBlock(page, 'affine-note');
  expect(count).toBe(4);

  await undoByClick(page);
  count = await countBlock(page, 'affine-note');
  expect(count).toBe(3);

  await undoByClick(page);
  count = await countBlock(page, 'affine-note');
  expect(count).toBe(2);

  await redoByClick(page);
  count = await countBlock(page, 'affine-note');
  expect(count).toBe(3);

  await redoByClick(page);
  count = await countBlock(page, 'affine-note');
  expect(count).toBe(4);
});

test('when no visible note block, clicking in page mode will auto add a new note block', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  assertBlockCount(page, 'note', 1);
  // select note
  await selectNoteInEdgeless(page, '2');
  await assertNoteSequence(page, '1');
  await assertBlockCount(page, 'note', 1);
  // hide note
  await page.locator('edgeless-change-note-button').click();

  await switchEditorMode(page);
  let note = await page.evaluate(() => {
    return document.querySelector('affine-note');
  });
  expect(note).toBeNull();
  await click(page, { x: 200, y: 280 });

  note = await page.evaluate(() => {
    return document.querySelector('affine-note');
  });
  expect(note).not.toBeNull();
});
