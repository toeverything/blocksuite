import { NoteDisplayMode } from '@blocks/_common/types.js';
import { expect } from '@playwright/test';

// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { NOTE_WIDTH } from '../../../packages/blocks/src/_common/consts.js';
import {
  activeNoteInEdgeless,
  addNote,
  assertEdgelessTool,
  changeEdgelessNoteBackground,
  changeNoteDisplayMode,
  locatorComponentToolbar,
  locatorEdgelessZoomToolButton,
  selectNoteInEdgeless,
  setEdgelessTool,
  switchEditorMode,
  triggerComponentToolbarAction,
  zoomOutByKeyboard,
  zoomResetByKeyboard,
} from '../../utils/actions/edgeless.js';
import {
  click,
  clickBlockById,
  dragBetweenCoords,
  dragBetweenIndices,
  enterPlaygroundRoom,
  focusRichText,
  focusRichTextEnd,
  initEmptyEdgelessState,
  initThreeParagraphs,
  pressArrowDown,
  pressArrowUp,
  pressBackspace,
  pressEnter,
  pressTab,
  redoByClick,
  type,
  undoByClick,
  undoByKeyboard,
  waitForInlineEditorStateUpdated,
  waitNextFrame,
} from '../../utils/actions/index.js';
import {
  assertBlockChildrenIds,
  assertBlockCount,
  assertEdgelessNonSelectedRect,
  assertEdgelessNoteBackground,
  assertEdgelessSelectedRect,
  assertExists,
  assertNativeSelectionRangeCount,
  assertNoteSequence,
  assertNoteXYWH,
  assertRichTextInlineRange,
  assertRichTexts,
} from '../../utils/asserts.js';
import { test } from '../../utils/playwright.js';

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
  await assertNoteXYWH(page, [0, 0, NOTE_WIDTH, 92]);

  // selected, non-active
  await page.mouse.click(CENTER_X, CENTER_Y);
  await dragBetweenCoords(
    page,
    { x: CENTER_X, y: CENTER_Y },
    { x: CENTER_X, y: CENTER_Y + 100 }
  );
  await assertNoteXYWH(page, [0, 100, NOTE_WIDTH, 92]);

  await undoByKeyboard(page);
  await waitNextFrame(page);
  await assertNoteXYWH(page, [0, 0, NOTE_WIDTH, 95]);
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
  await assertEdgelessSelectedRect(page, [270, 260, 448, 92]);
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
  await assertBlockCount(page, 'edgeless-note', 2);

  // click out of note
  await page.mouse.click(250, 200);

  // assert empty note is note removed
  await page.mouse.move(320, 320);
  await assertBlockCount(page, 'edgeless-note', 2);
});

test('always keep at least 1 note block', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);

  await switchEditorMode(page);
  await setEdgelessTool(page, 'default');

  // clicking in default mode will try to remove empty note block
  await page.mouse.click(0, 0);

  const notes = await page.locator('affine-edgeless-note').all();
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

  const noteBox = await page.locator('affine-edgeless-note').boundingBox();
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

  const noteLocator = page.locator('affine-edgeless-note');
  await expect(noteLocator).toHaveCount(2);
  const [firstNote, secondNote] = await noteLocator.all();

  // content should be same
  expect(
    (await firstNote.innerText()) === (await secondNote.innerText())
  ).toBeTruthy();

  // size should be same
  const firstNoteBox = await firstNote.boundingBox();
  const secondNoteBox = await secondNote.boundingBox();
  expect(firstNoteBox!.width).toBeCloseTo(secondNoteBox!.width);
  expect(firstNoteBox!.height).toBeCloseTo(secondNoteBox!.height);
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

test('when no visible note block, clicking in page mode will auto add a new note block', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  await assertBlockCount(page, 'edgeless-note', 1);
  // select note
  await selectNoteInEdgeless(page, '2');
  await assertNoteSequence(page, '1');
  await assertBlockCount(page, 'edgeless-note', 1);
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
  await assertBlockCount(page, 'edgeless-note', 2);
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
    .locator('affine-edgeless-note')
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
  await assertNoteXYWH(page, [0, 0, NOTE_WIDTH, 92]);
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

test('select text cross blocks in edgeless note', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyEdgelessState(page);
  await switchEditorMode(page);
  await activeNoteInEdgeless(page, noteId);
  await waitNextFrame(page, 400);

  await type(page, 'aaa');
  await pressEnter(page);
  await type(page, 'bbb');
  await pressEnter(page);
  await type(page, 'ccc');
  await assertRichTexts(page, ['aaa', 'bbb', 'ccc']);

  await dragBetweenIndices(page, [0, 1], [2, 2]);
  await pressBackspace(page);
  await assertRichTexts(page, ['ac']);
});
