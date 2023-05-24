import { EDITOR_WIDTH } from '@blocksuite/global/config';
import { expect } from '@playwright/test';

import {
  activeFrameInEdgeless,
  changeEdgelessFrameBackground,
  getFrameBoundBoxInEdgeless,
  getFrameRect,
  locatorComponentToolbar,
  locatorEdgelessToolButton,
  selectFrameInEdgeless,
  setMouseMode,
  switchEditorMode,
  triggerComponentToolbarAction,
} from '../utils/actions/edgeless.js';
import {
  clickBlockById,
  dragBetweenCoords,
  dragBlockToPoint,
  dragHandleFromBlockToBlockBottomById,
  enterPlaygroundRoom,
  focusRichText,
  initEmptyEdgelessState,
  initThreeParagraphs,
  pressArrowDown,
  pressArrowUp,
  pressEnter,
  redoByClick,
  type,
  undoByClick,
  waitForVirgoStateUpdated,
  waitNextFrame,
} from '../utils/actions/index.js';
import {
  assertEdgelessFrameBackground,
  assertEdgelessHoverRect,
  assertEdgelessNonSelectedRect,
  assertEdgelessSelectedRect,
  assertFrameXYWH,
  assertNativeSelectionRangeCount,
  assertRectEqual,
  assertRichTexts,
  assertSelection,
  assertSelectionInFrame,
} from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

const CENTER_X = 450;
const CENTER_Y = 300;

test('can drag selected non-active frame', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await focusRichText(page);
  await type(page, 'hello');
  await assertRichTexts(page, ['hello']);

  await switchEditorMode(page);
  await assertFrameXYWH(page, [0, 0, EDITOR_WIDTH, 80]);

  // selected, non-active
  await page.mouse.click(CENTER_X, CENTER_Y);
  await dragBetweenCoords(
    page,
    { x: CENTER_X, y: CENTER_Y },
    { x: CENTER_X, y: CENTER_Y + 100 }
  );
  await assertFrameXYWH(page, [0, 100, EDITOR_WIDTH, 80]);
});

test('resize frame in edgeless mode', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const ids = await initEmptyEdgelessState(page);
  await activeFrameInEdgeless(page, ids.frameId);
  await waitForVirgoStateUpdated(page);
  await type(page, 'hello');
  await assertRichTexts(page, ['hello']);

  await switchEditorMode(page);
  await page.mouse.move(100, 100); // FIXME: no update until mousemove

  expect(ids.frameId).toBe('2'); // 0 for page, 1 for surface
  await selectFrameInEdgeless(page, ids.frameId);

  const initRect = await getFrameRect(page, ids);
  const leftHandle = page.locator('[aria-label="handle-left"]');
  const box = await leftHandle.boundingBox();
  if (box === null) throw new Error();

  await dragBetweenCoords(
    page,
    { x: box.x + 5, y: box.y + 5 },
    { x: box.x + 105, y: box.y + 5 }
  );
  const draggedRect = await getFrameRect(page, ids);
  assertRectEqual(draggedRect, {
    x: initRect.x + 100,
    y: initRect.y,
    w: initRect.w - 100,
    h: initRect.h,
  });

  await switchEditorMode(page);
  await switchEditorMode(page);
  const newRect = await getFrameRect(page, ids);
  assertRectEqual(newRect, draggedRect);
});

test('add Note', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);

  await switchEditorMode(page);
  await setMouseMode(page, 'note');

  await page.mouse.click(30, 40);
  await waitForVirgoStateUpdated(page);

  await type(page, 'hello');
  await assertRichTexts(page, ['', 'hello']);

  await page.mouse.move(30, 40);
  await assertEdgelessSelectedRect(page, [0, 0, 448, 80]);
});

test('add empty Note', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);

  await switchEditorMode(page);
  await setMouseMode(page, 'note');

  // add note at 30,40
  await page.mouse.click(30, 40);
  await waitForVirgoStateUpdated(page);
  await pressEnter(page);
  // should wait for virgo update and resizeObserver callback
  await waitNextFrame(page);

  // assert add note success
  await page.mouse.move(30, 40);
  await assertEdgelessSelectedRect(page, [0, 0, 448, 112]);

  // click out of note
  await page.mouse.click(0, 200);

  // assert empty note is removed
  await page.mouse.move(30, 40);
  await assertEdgelessNonSelectedRect(page);
});

test('always keep at least 1 frame block', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);

  await switchEditorMode(page);
  await setMouseMode(page, 'default');

  // clicking in default mode will try to remove empty frame block
  await page.mouse.click(0, 0);

  const frames = await page.locator('affine-frame').all();
  expect(frames.length).toEqual(1);
});

test('edgeless arrow up/down', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const ids = await initEmptyEdgelessState(page);

  await activeFrameInEdgeless(page, ids.frameId);
  await waitForVirgoStateUpdated(page);

  await type(page, 'hello');
  await pressEnter(page);
  await type(page, 'world');
  await pressEnter(page);
  await type(page, 'foo');

  await switchEditorMode(page);

  await activeFrameInEdgeless(page, ids.frameId);
  await waitForVirgoStateUpdated(page);
  // 0 for page, 1 for surface, 2 for frame, 3 for paragraph
  expect(ids.paragraphId).toBe('3');
  await clickBlockById(page, ids.paragraphId);

  await pressArrowDown(page);
  await assertSelection(page, 1, 4, 0);

  await pressArrowUp(page);
  await assertSelection(page, 0, 4, 0);

  await pressArrowUp(page);
  await assertSelection(page, 0, 4, 0);
});

test('dragging un-selected frame', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await focusRichText(page);
  await type(page, 'hello');
  await assertRichTexts(page, ['hello']);

  await switchEditorMode(page);

  const frameBox = await page
    .locator('.affine-edgeless-block-child')
    .boundingBox();
  if (!frameBox) {
    throw new Error('Missing edgeless affine-frame');
  }
  await page.mouse.move(frameBox.x + 5, frameBox.y + 5);
  await assertEdgelessHoverRect(page, [
    frameBox.x,
    frameBox.y,
    frameBox.width,
    frameBox.height,
  ]);

  await dragBetweenCoords(
    page,
    { x: frameBox.x + 5, y: frameBox.y + 5 },
    { x: frameBox.x + 25, y: frameBox.y + 25 },
    { steps: 10 }
  );

  await page.mouse.move(frameBox.x + 25, frameBox.y + 25);
  await assertEdgelessHoverRect(page, [
    frameBox.x + 20,
    frameBox.y + 20,
    frameBox.width,
    frameBox.height,
  ]);
});

test('drag handle should be shown when a frame is actived in default mode or hidden in other modes', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await focusRichText(page);
  await type(page, 'hello');
  await assertRichTexts(page, ['hello']);

  await switchEditorMode(page);
  const frameBox = await page
    .locator('.affine-edgeless-block-child')
    .boundingBox();
  if (!frameBox) {
    throw new Error('Missing edgeless affine-frame');
  }

  const [x, y] = [frameBox.x + 26, frameBox.y + frameBox.height / 2];

  await page.mouse.move(x, y);
  await expect(page.locator('affine-drag-handle')).toBeHidden();
  await page.mouse.dblclick(x, y);
  await page.mouse.move(x, y);
  await expect(page.locator('affine-drag-handle')).toBeVisible();

  await page.mouse.move(0, 0);
  await setMouseMode(page, 'shape');
  await page.mouse.move(x, y);
  await expect(page.locator('affine-drag-handle')).toBeHidden();

  await page.mouse.move(0, 0);
  await setMouseMode(page, 'default');
  await page.mouse.move(x, y);
  await expect(page.locator('affine-drag-handle')).toBeVisible();
});

test('drag handle should work inside one frame', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await initThreeParagraphs(page);

  await switchEditorMode(page);

  await page.mouse.dblclick(CENTER_X, CENTER_Y);
  await dragHandleFromBlockToBlockBottomById(page, '3', '5');
  await waitNextFrame(page);
  await expect(page.locator('affine-drag-handle')).toBeHidden();
  await assertRichTexts(page, ['456', '789', '123']);
});

test('drag handle should work across multiple frames', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await switchEditorMode(page);

  await setMouseMode(page, 'note');

  await page.mouse.click(30, 40);
  await waitForVirgoStateUpdated(page);

  // 7
  await type(page, '000');

  await page.mouse.dblclick(CENTER_X, CENTER_Y);
  await dragHandleFromBlockToBlockBottomById(page, '3', '7');
  await expect(page.locator('affine-drag-handle')).toBeHidden();
  await waitNextFrame(page);
  await assertRichTexts(page, ['456', '789', '000', '123']);

  await page.mouse.dblclick(30, 40);
  await dragHandleFromBlockToBlockBottomById(page, '7', '4');
  await waitNextFrame(page);
  await expect(page.locator('affine-drag-handle')).toBeHidden();
  await assertRichTexts(page, ['456', '000', '789', '123']);

  await expect(page.locator('affine-selected-blocks > *')).toHaveCount(0);
});

test('drag handle should add new frame when dragged outside frame', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await switchEditorMode(page);

  await expect(page.locator('.affine-edgeless-block-child')).toHaveCount(1);

  await page.mouse.dblclick(CENTER_X, CENTER_Y);
  await dragBlockToPoint(page, '3', { x: 30, y: 40 });
  await waitNextFrame(page);
  await expect(page.locator('affine-drag-handle')).toBeHidden();
  await assertRichTexts(page, ['123', '456', '789']);

  await expect(page.locator('.affine-edgeless-block-child')).toHaveCount(2);
  await expect(page.locator('affine-selected-blocks > *')).toHaveCount(0);
});

test('when the selection is always a frame, it should remain in an active state', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  const ids = await initEmptyEdgelessState(page);
  await initThreeParagraphs(page);

  await switchEditorMode(page);
  const bound = await getFrameBoundBoxInEdgeless(page, ids.frameId);

  await setMouseMode(page, 'note');

  const newFrameX = bound.x;
  const newFrameY = bound.y + bound.height + 100;
  // add text
  await page.mouse.click(newFrameX, newFrameY);
  await waitForVirgoStateUpdated(page);
  await page.keyboard.type('hello');
  await pressEnter(page);
  // should wait for virgo update and resizeObserver callback
  await waitNextFrame(page);
  // assert add text success
  await assertEdgelessSelectedRect(page, [86, 410, 448, 112]);

  await page.mouse.click(bound.x + 10, bound.y + 10);
  await assertSelectionInFrame(page, ids.frameId);
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
    });
  await page.waitForTimeout(200);
  const formatQuickBar = page.locator('.format-quick-bar');
  await expect(formatQuickBar).toBeVisible();
});

test('when editing text in edgeless, should hide component toolbar', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  const ids = await initEmptyEdgelessState(page);
  await initThreeParagraphs(page);
  await switchEditorMode(page);

  await selectFrameInEdgeless(page, ids.frameId);

  const toolbar = locatorComponentToolbar(page);
  await expect(toolbar).toBeVisible();

  await page.mouse.click(0, 0);
  await activeFrameInEdgeless(page, ids.frameId);
  await expect(toolbar).toBeHidden();
});

test('double click toolbar zoom button, should not add text', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  const zoomOutButton = locatorEdgelessToolButton(page, 'zoomOut', false);
  await zoomOutButton.dblclick();
  await assertEdgelessNonSelectedRect(page);
});

test('change frame color', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const ids = await initEmptyEdgelessState(page);
  await initThreeParagraphs(page);
  await switchEditorMode(page);

  await assertEdgelessFrameBackground(
    page,
    ids.frameId,
    '--affine-background-secondary-color'
  );

  await selectFrameInEdgeless(page, ids.frameId);
  await triggerComponentToolbarAction(page, 'changeFrameColor');
  const color = '--affine-tag-blue';
  await changeEdgelessFrameBackground(page, color);
  await assertEdgelessFrameBackground(page, ids.frameId, color);
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
