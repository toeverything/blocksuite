import { NoteDisplayMode } from '@blocks/_common/types.js';
import {
  NOTE_INIT_HEIGHT,
  NOTE_MIN_WIDTH,
} from '@blocks/root-block/edgeless/utils/consts.js';
import { expect } from '@playwright/test';

// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { NOTE_WIDTH } from '../../packages/blocks/src/_common/consts.js';
import {
  activeNoteInEdgeless,
  addNote,
  assertEdgelessTool,
  changeEdgelessNoteBackground,
  changeNoteDisplayMode,
  changeNoteDisplayModeWithId,
  countBlock,
  getNoteRect,
  locatorComponentToolbar,
  locatorEdgelessZoomToolButton,
  selectNoteInEdgeless,
  setEdgelessTool,
  switchEditorMode,
  triggerComponentToolbarAction,
  zoomOutByKeyboard,
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
  focusRichTextEnd,
  initEmptyEdgelessState,
  initSixParagraphs,
  initThreeParagraphs,
  pasteByKeyboard,
  pressArrowDown,
  pressArrowUp,
  pressBackspace,
  pressEnter,
  pressTab,
  redoByClick,
  redoByKeyboard,
  type,
  undoByClick,
  undoByKeyboard,
  waitForInlineEditorStateUpdated,
  waitNextFrame,
} from '../utils/actions/index.js';
import {
  assertBlockChildrenIds,
  assertBlockCount,
  assertEdgelessNonSelectedRect,
  assertEdgelessNoteBackground,
  assertEdgelessSelectedRect,
  assertExists,
  assertNativeSelectionRangeCount,
  assertNoteRectEqual,
  assertNoteSequence,
  assertNoteXYWH,
  assertRectEqual,
  assertRectExist,
  assertRichTextInlineRange,
  assertRichTexts,
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

  await undoByKeyboard(page);
  await waitNextFrame(page);
  await assertNoteXYWH(page, [0, 0, NOTE_WIDTH, 95]);
});

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
  await waitForInlineEditorStateUpdated(page);
  // should wait for inline editor update and resizeObserver callback
  await waitNextFrame(page);

  // assert add note success
  await assertBlockCount(page, 'note', 2);

  // click out of note
  await page.mouse.click(250, 200);

  // assert empty note is note removed
  await page.mouse.move(320, 320);
  await assertBlockCount(page, 'note', 2);
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
  const { paragraphId, noteId } = await initEmptyEdgelessState(page);
  await switchEditorMode(page);
  await activeNoteInEdgeless(page, noteId);
  await waitNextFrame(page, 400);

  await type(page, 'aaaaa');
  await pressEnter(page);
  await type(page, 'aaaaa');
  await pressEnter(page);
  await type(page, 'aaa');

  await waitForInlineEditorStateUpdated(page);
  // 0 for page, 1 for surface, 2 for note, 3 for paragraph
  expect(paragraphId).toBe('3');
  await clickBlockById(page, paragraphId);
  await assertRichTextInlineRange(page, 0, 5, 0);

  await pressArrowDown(page);
  await waitNextFrame(page);
  await assertRichTextInlineRange(page, 1, 5, 0);

  await pressArrowUp(page);
  await waitNextFrame(page);
  await assertRichTextInlineRange(page, 0, 5, 0);

  await pressArrowUp(page);
  await waitNextFrame(page);
  await assertRichTextInlineRange(page, 0, 0, 0);
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
  await page.mouse.click(noteBox.x + 5, noteBox.y + 5);
  await assertEdgelessSelectedRect(page, [
    noteBox.x,
    noteBox.y,
    noteBox.width,
    noteBox.height,
  ]);

  await dragBetweenCoords(
    page,
    { x: noteBox.x + 10, y: noteBox.y + 15 },
    { x: noteBox.x + 10, y: noteBox.y + 35 },
    { steps: 10 }
  );

  await assertEdgelessSelectedRect(page, [
    noteBox.x,
    noteBox.y + 20,
    noteBox.width,
    noteBox.height,
  ]);
});

test('drag handle should be shown when a note is activated in default mode or hidden in other modes', async ({
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

test('drag handle can drag note into another note', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyEdgelessState(page);
  await focusRichText(page);
  await type(page, 'hello');
  await assertRichTexts(page, ['hello']);

  await switchEditorMode(page);
  const noteRect = await page
    .locator(`[data-block-id="${noteId}"]`)
    .boundingBox();
  assertRectExist(noteRect);

  const secondNoteId = await addNote(page, 'hello world', 100, 100);
  await waitNextFrame(page);
  const secondNoteRect = await page
    .locator(`[data-block-id="${secondNoteId}"]`)
    .boundingBox();
  assertRectExist(secondNoteRect);

  {
    const [x, y] = [
      noteRect.x + noteRect.width / 2,
      noteRect.y + noteRect.height / 2,
    ];
    await page.mouse.click(noteRect.x, noteRect.y + noteRect.height + 100);
    await page.mouse.move(x, y);
    await page.mouse.click(x, y);

    const handlerRect = await page
      .locator('.affine-drag-handle-container')
      .boundingBox();
    assertRectExist(handlerRect);

    await page.mouse.move(
      handlerRect.x + handlerRect.width / 2,
      handlerRect.y + handlerRect.height / 2
    );
    await page.mouse.down();

    const [targetX, targetY] = [
      secondNoteRect.x + 10,
      secondNoteRect.y + secondNoteRect.height / 2,
    ];
    await page.mouse.move(targetX, targetY);
    await page.mouse.up();

    await waitNextFrame(page);
  }
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

  await page.mouse.click(200, 200);
  await focusRichText(page, 3);
  await waitNextFrame(page);

  // block id 7
  await type(page, '000');

  await page.mouse.dblclick(CENTER_X, CENTER_Y - 20);
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
  test('could enable and disenable note slicer', async ({ page }) => {
    await enterPlaygroundRoom(page);
    const { noteId } = await initEmptyEdgelessState(page);
    await initSixParagraphs(page);

    await switchEditorMode(page);
    await selectNoteInEdgeless(page, noteId);
    // note slicer button should not be visible when note slicer setting is disenabled
    await expect(page.locator('.note-slicer-button')).toBeHidden();
    await expect(page.locator('.note-slicer-dividing-line')).toHaveCount(0);

    await triggerComponentToolbarAction(page, 'changeNoteSlicerSetting');
    // note slicer button should be visible when note slicer setting is enabled
    await expect(page.locator('.note-slicer-button')).toBeVisible();
    await expect(page.locator('.note-slicer-dividing-line')).toHaveCount(5);
  });

  test('note slicer will add new note', async ({ page }) => {
    await enterPlaygroundRoom(page);
    const { noteId } = await initEmptyEdgelessState(page);
    await initSixParagraphs(page);

    await switchEditorMode(page);
    await expect(page.locator('.edgeless-block-portal-note')).toHaveCount(1);

    await selectNoteInEdgeless(page, noteId);
    await triggerComponentToolbarAction(page, 'changeNoteSlicerSetting');
    await expect(page.locator('.note-slicer-button')).toBeVisible();

    await page.locator('.note-slicer-button').click();

    await expect(page.locator('.edgeless-block-portal-note')).toHaveCount(2);
  });

  test('note slicer button should appears at right position', async ({
    page,
  }) => {
    await enterPlaygroundRoom(page);
    const { noteId } = await initEmptyEdgelessState(page);
    await initThreeParagraphs(page);
    await assertRichTexts(page, ['123', '456', '789']);

    await switchEditorMode(page);
    await selectNoteInEdgeless(page, noteId);
    await triggerComponentToolbarAction(page, 'changeNoteSlicerSetting');

    const blocks = await page
      .locator(`[data-block-id="${noteId}"] [data-block-id]`)
      .all();
    expect(blocks.length).toBe(3);

    const firstBlockRect = await blocks[0].boundingBox();
    assertRectExist(firstBlockRect);
    const secondBlockRect = await blocks[1].boundingBox();
    assertRectExist(secondBlockRect);
    await page.mouse.move(
      secondBlockRect.x + 1,
      secondBlockRect.y + secondBlockRect.height / 2
    );

    let slicerButtonRect = await page
      .locator('.note-slicer-button')
      .boundingBox();
    assertRectExist(slicerButtonRect);

    let buttonRectMiddle = slicerButtonRect.y + slicerButtonRect.height / 2;

    expect(buttonRectMiddle).toBeGreaterThan(
      firstBlockRect.y + firstBlockRect.height
    );
    expect(buttonRectMiddle).toBeGreaterThan(secondBlockRect.y);

    const thirdBlockRect = await blocks[2].boundingBox();
    assertRectExist(thirdBlockRect);
    await page.mouse.move(
      thirdBlockRect.x + 1,
      thirdBlockRect.y + thirdBlockRect.height / 2
    );

    slicerButtonRect = await page.locator('.note-slicer-button').boundingBox();
    assertRectExist(slicerButtonRect);

    buttonRectMiddle = slicerButtonRect.y + slicerButtonRect.height / 2;
    expect(buttonRectMiddle).toBeGreaterThan(
      secondBlockRect.y + secondBlockRect.height
    );
    expect(buttonRectMiddle).toBeLessThan(thirdBlockRect.y);
  });

  test('note slicer button should appears at right position when editor is not located at left top corner', async ({
    page,
  }) => {
    await enterPlaygroundRoom(page);
    const { noteId } = await initEmptyEdgelessState(page);
    await initThreeParagraphs(page);
    await assertRichTexts(page, ['123', '456', '789']);

    await switchEditorMode(page);
    await selectNoteInEdgeless(page, noteId);

    await page.evaluate(() => {
      const el = document.createElement('div');
      const app = document.querySelector('#app') as HTMLElement;

      el.style.height = '100px';
      el.style.background = 'red';

      app!.style.paddingLeft = '80px';

      document.body.insertBefore(el, app);
    });

    const blocks = await page
      .locator(`[data-block-id="${noteId}"] [data-block-id]`)
      .all();
    expect(blocks.length).toBe(3);

    const firstBlockRect = await blocks[0].boundingBox();
    assertRectExist(firstBlockRect);
    const secondBlockRect = await blocks[1].boundingBox();
    assertRectExist(secondBlockRect);

    await triggerComponentToolbarAction(page, 'changeNoteSlicerSetting');
    await page.mouse.move(
      secondBlockRect.x + 1,
      secondBlockRect.y + secondBlockRect.height / 2
    );

    const slicerButtonRect = await page
      .locator('.note-slicer-button')
      .boundingBox();
    assertRectExist(slicerButtonRect);

    const buttonRectMiddle = slicerButtonRect.y + slicerButtonRect.height / 2;

    expect(buttonRectMiddle).toBeGreaterThan(
      firstBlockRect.y + firstBlockRect.height
    );
    expect(buttonRectMiddle).toBeGreaterThan(secondBlockRect.y);
  });
});

test('undo/redo should work correctly after clipping', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyEdgelessState(page);
  await initSixParagraphs(page);

  await switchEditorMode(page);
  await expect(page.locator('.edgeless-block-portal-note')).toHaveCount(1);

  await selectNoteInEdgeless(page, noteId);
  await triggerComponentToolbarAction(page, 'changeNoteSlicerSetting');

  const button = page.locator('.note-slicer-button');
  await button.click();
  await expect(page.locator('.edgeless-block-portal-note')).toHaveCount(2);

  await undoByKeyboard(page);
  await waitNextFrame(page);
  await expect(page.locator('.edgeless-block-portal-note')).toHaveCount(1);
  await redoByKeyboard(page);
  await waitNextFrame(page);
  await expect(page.locator('.edgeless-block-portal-note')).toHaveCount(2);
});

test('undo/redo should work correctly after resizing', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyEdgelessState(page);
  await switchEditorMode(page);
  await zoomResetByKeyboard(page);
  await activeNoteInEdgeless(page, noteId);
  await waitNextFrame(page, 400);
  // current implementation may be a little inefficient
  await fillLine(page, true);
  await page.mouse.click(0, 0);
  await waitNextFrame(page, 400);
  await selectNoteInEdgeless(page, noteId);

  const initRect = await getNoteRect(page, noteId);
  const rightHandle = page.locator('.handle[aria-label="right"] .resize');
  const box = await rightHandle.boundingBox();
  if (box === null) throw new Error();

  await dragBetweenCoords(
    page,
    { x: box.x + 5, y: box.y + 5 },
    { x: box.x - 45, y: box.y + 5 }
  );
  const draggedRect = await getNoteRect(page, noteId);
  assertRectEqual(draggedRect, {
    x: initRect.x,
    y: initRect.y,
    w: initRect.w - 50,
    h: draggedRect.h, // not assert `h` here
  });
  expect(draggedRect.h).toBe(initRect.h);

  await undoByKeyboard(page);
  await waitNextFrame(page);
  const undoRect = await getNoteRect(page, noteId);
  assertRectEqual(undoRect, initRect);

  await redoByKeyboard(page);
  await waitNextFrame(page);
  const redoRect = await getNoteRect(page, noteId);
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
    .locator('rich-text')
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
  const { noteId } = await initEmptyEdgelessState(page);
  await initThreeParagraphs(page);
  await switchEditorMode(page);

  await selectNoteInEdgeless(page, noteId);

  const toolbar = locatorComponentToolbar(page);
  await expect(toolbar).toBeVisible();

  await page.mouse.click(0, 0);
  await activeNoteInEdgeless(page, noteId);
  await expect(toolbar).toBeHidden();
});

test('duplicate note should work correctly', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyEdgelessState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await switchEditorMode(page);

  await selectNoteInEdgeless(page, noteId);

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
  const { noteId } = await initEmptyEdgelessState(page);
  await initThreeParagraphs(page);
  await switchEditorMode(page);

  await assertEdgelessNoteBackground(
    page,
    noteId,
    '--affine-note-background-blue'
  );

  await selectNoteInEdgeless(page, noteId);
  await triggerComponentToolbarAction(page, 'changeNoteColor');
  const color = '--affine-note-background-green';
  await changeEdgelessNoteBackground(page, color);
  await assertEdgelessNoteBackground(page, noteId, color);
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

  await assertBlockCount(page, 'note', 1);
  // select note
  await selectNoteInEdgeless(page, '2');
  await assertNoteSequence(page, '1');
  await assertBlockCount(page, 'note', 1);
  // hide note
  await triggerComponentToolbarAction(page, 'changeNoteDisplayMode');
  await waitNextFrame(page);
  await changeNoteDisplayMode(page, NoteDisplayMode.EdgelessOnly);

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
  await assertBlockCount(page, 'note', 2);

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
  await assertBlockCount(page, 'note', 2);

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

test('Note added on doc mode should display on both modes by default', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);

  // there should be 1 note in doc page
  await assertBlockCount(page, 'note', 1);

  await switchEditorMode(page);
  // there should be 1 note in edgeless page as well
  await assertBlockCount(page, 'note', 1);
});

test('Note added on edgeless mode should display on edgeless only by default', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);

  await switchEditorMode(page);
  await zoomResetByKeyboard(page);
  await addNote(page, 'note2', 100, 100);

  // assert add note success, there should be 2 notes in edgeless page
  await assertBlockCount(page, 'note', 2);

  await switchEditorMode(page);
  // switch to doc mode, the note added on edgeless mode should not render on doc mode
  // there should be only 1 note in doc page
  await assertBlockCount(page, 'note', 1);
});

test('Note can be changed to display on doc and edgeless mode', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);

  await switchEditorMode(page);
  await zoomResetByKeyboard(page);
  const noteId = await addNote(page, 'note2', 100, 100);
  await page.mouse.click(200, 50);
  // assert add note success, there should be 2 notes in edgeless page
  await assertBlockCount(page, 'note', 2);

  // switch to doc mode
  await switchEditorMode(page);
  // there should be 1 notes in doc page
  await assertBlockCount(page, 'note', 1);

  // switch back to edgeless mode
  await switchEditorMode(page);
  // change note display mode to doc only
  await changeNoteDisplayModeWithId(
    page,
    noteId,
    NoteDisplayMode.DocAndEdgeless
  );
  // there should still be 2 notes in edgeless page
  await assertBlockCount(page, 'note', 2);

  // switch to doc mode
  await switchEditorMode(page);
  // change successfully, there should be 2 notes in doc page
  await assertBlockCount(page, 'note', 2);
});

test('Click at empty note should add a paragraph block', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await focusRichText(page);
  await type(page, '123');
  await assertRichTexts(page, ['123']);

  await switchEditorMode(page);

  // Drag paragraph out of note block
  const paragraphBlock = await page
    .locator(`[data-block-id="3"]`)
    .boundingBox();
  assertExists(paragraphBlock);
  await page.mouse.dblclick(paragraphBlock.x, paragraphBlock.y);
  await waitNextFrame(page);
  await page.mouse.move(
    paragraphBlock.x + paragraphBlock.width / 2,
    paragraphBlock.y + paragraphBlock.height / 2
  );
  await waitNextFrame(page);
  const handle = await page
    .locator('.affine-drag-handle-container')
    .boundingBox();
  assertExists(handle);
  await page.mouse.move(
    handle.x + handle.width / 2,
    handle.y + handle.height / 2,
    { steps: 10 }
  );
  await page.mouse.down();
  await page.mouse.move(100, 200, { steps: 30 });
  await page.mouse.up();

  // There should be two note blocks and one paragraph block
  await assertRichTexts(page, ['123']);
  await assertBlockCount(page, 'note', 2);
  await assertBlockCount(page, 'paragraph', 1);

  // Click at empty note block to add a paragraph block
  const emptyNote = await page.locator(`[data-block-id="2"]`).boundingBox();
  assertExists(emptyNote);
  await page.mouse.click(
    emptyNote.x + emptyNote.width / 2,
    emptyNote.y + emptyNote.height / 2
  );
  await waitNextFrame(page, 300);
  await type(page, '456');
  await waitNextFrame(page, 400);

  await page.mouse.click(100, 100);
  await waitNextFrame(page, 400);
  await assertBlockCount(page, 'paragraph', 2);
});

test('Should focus at closest text block when note collapse', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);

  // Make sure there is no rich text content
  await switchEditorMode(page);
  await zoomResetByKeyboard(page);
  await assertRichTexts(page, ['']);

  // Select the note
  await zoomOutByKeyboard(page);
  const notePortalBox = await page
    .locator('.edgeless-block-portal-note')
    .boundingBox();
  assertExists(notePortalBox);
  await page.mouse.click(notePortalBox.x + 10, notePortalBox.y + 10);
  await waitNextFrame(page, 200);
  const selectedRect = page
    .locator('edgeless-selected-rect')
    .locator('.affine-edgeless-selected-rect');
  await expect(selectedRect).toBeVisible();

  // Collapse the note
  const selectedBox = await selectedRect.boundingBox();
  assertExists(selectedBox);
  await page.mouse.move(
    selectedBox.x + selectedBox.width / 2,
    selectedBox.y + selectedBox.height
  );
  await page.mouse.down();
  await page.mouse.move(
    selectedBox.x + selectedBox.width / 2,
    selectedBox.y + selectedBox.height + 200,
    { steps: 10 }
  );
  await page.mouse.up();
  await expect(selectedRect).toBeVisible();

  // Click at the bottom of note to focus at the closest text block
  await page.mouse.click(
    selectedBox.x + selectedBox.width / 2,
    selectedBox.y + selectedBox.height - 20
  );
  await waitNextFrame(page, 200);

  // Should be enter edit mode and there are no selected rect
  await expect(selectedRect).toBeHidden();

  // Focus at the closest text block and make sure can type
  await type(page, 'hello');
  await waitNextFrame(page, 200);
  await assertRichTexts(page, ['hello']);
});

test('delete first block in edgeless note', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);
  await zoomResetByKeyboard(page);
  await assertNoteXYWH(page, [0, 0, NOTE_WIDTH, 91]);
  await page.mouse.dblclick(CENTER_X, CENTER_Y);

  // first block without children, nothing should happen
  await assertRichTexts(page, ['']);
  await assertBlockChildrenIds(page, '3', []);
  await pressBackspace(page);

  await type(page, 'aaa');
  await pressEnter(page);
  await type(page, 'bbb');
  await pressTab(page);
  await assertRichTexts(page, ['aaa', 'bbb']);
  await assertBlockChildrenIds(page, '3', ['4']);

  // first block with children, need to bring children to parent
  await focusRichTextEnd(page);
  await pressBackspace(page, 3);
  await assertRichTexts(page, ['', 'bbb']);
  await pressBackspace(page);
  await assertRichTexts(page, ['bbb']);
  await assertBlockChildrenIds(page, '4', []);
});
