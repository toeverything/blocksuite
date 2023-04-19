/* eslint-disable @typescript-eslint/no-restricted-imports */

import { assertExists } from '@blocksuite/global/utils';
import { expect } from '@playwright/test';

import {
  activeFrameInEdgeless,
  addBasicConnectorElement,
  changeEdgelessFrameBackground,
  changeShapeFillColor,
  changeShapeStrokeColor,
  clickComponentToolbarMoreMenuButton,
  decreaseZoomLevel,
  getEdgelessBlockChild,
  getEdgelessHoverRect,
  getEdgelessSelectedRect,
  getFrameBoundBoxInEdgeless,
  getFrameRect,
  increaseZoomLevel,
  locatorComponentToolbar,
  locatorEdgelessComponentToolButton,
  locatorEdgelessToolButton,
  openComponentToolbarMoreMenu,
  pickColorAtPoints,
  selectBrushColor,
  selectBrushSize,
  selectFrameInEdgeless,
  setMouseMode,
  switchEditorMode,
  triggerComponentToolbarAction,
  updateExistedBrushElementSize,
  zoomByMouseWheel,
} from './utils/actions/edgeless.js';
import {
  addBasicBrushElement,
  addBasicRectShapeElement,
  clickBlockById,
  dragBetweenCoords,
  dragBlockToPoint,
  dragHandleFromBlockToBlockBottomById,
  enterPlaygroundRoom,
  focusRichText,
  getCenterPosition,
  initEmptyEdgelessState,
  initThreeParagraphs,
  locatorPanButton,
  pressArrowDown,
  pressArrowUp,
  pressEnter,
  pressEscape,
  redoByClick,
  resizeElementByTopLeftHandle,
  type,
  undoByClick,
  waitForVirgoStateUpdated,
  waitNextFrame,
} from './utils/actions/index.js';
import {
  assertEdgelessColorSameWithHexColor,
  assertEdgelessFrameBackground,
  assertEdgelessHoverRect,
  assertEdgelessNonHoverRect,
  assertEdgelessNonSelectedRect,
  assertEdgelessSelectedRect,
  assertFrameXYWH,
  assertNativeSelectionRangeCount,
  assertRectEqual,
  assertRichTexts,
  assertSameColor,
  assertSelection,
  assertSelectionInFrame,
} from './utils/asserts.js';
import { test } from './utils/playwright.js';

const CENTER_X = 450;
const CENTER_Y = 300;

test('switch to edgeless mode', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await focusRichText(page);
  await type(page, 'hello');
  await assertRichTexts(page, ['hello']);
  await assertSelection(page, 0, 5, 0);

  await switchEditorMode(page);
  const locator = page.locator('.affine-edgeless-page-block-container');
  await expect(locator).toHaveCount(1);
  await assertRichTexts(page, ['hello']);
  await waitNextFrame(page);

  // FIXME: got very flaky result on cursor keeping
  // await assertNativeSelectionRangeCount(page, 1);
});

test('can zoom viewport', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);

  await switchEditorMode(page);
  await assertFrameXYWH(page, [0, 0, 720, 72]);
  await page.mouse.move(CENTER_X, CENTER_Y);

  const original = [90, 264, 720, 72];
  await assertEdgelessHoverRect(page, original);

  await decreaseZoomLevel(page);
  await decreaseZoomLevel(page);
  await page.mouse.move(CENTER_X, CENTER_Y);

  const box = await getEdgelessHoverRect(page);
  const zoomed = [box.x, box.y, original[2] * 0.8, original[3] * 0.8];
  await assertEdgelessHoverRect(page, zoomed);

  await increaseZoomLevel(page);
  await increaseZoomLevel(page);
  await page.mouse.move(CENTER_X, CENTER_Y);
  await assertEdgelessHoverRect(page, original);
});

test('zoom by mouse', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);

  await switchEditorMode(page);
  await assertFrameXYWH(page, [0, 0, 720, 72]);
  await page.mouse.move(CENTER_X, CENTER_Y);

  const original = [90, 264, 720, 72];
  await assertEdgelessHoverRect(page, original);

  await zoomByMouseWheel(page, 0, 125);
  await page.mouse.move(CENTER_X, CENTER_Y);

  const zoomed = [126, 268, original[2] * 0.9, original[3] * 0.9];
  await assertEdgelessHoverRect(page, zoomed);
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

test('can drag selected non-active frame', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await focusRichText(page);
  await type(page, 'hello');
  await assertRichTexts(page, ['hello']);

  await switchEditorMode(page);
  await assertFrameXYWH(page, [0, 0, 720, 72]);

  // selected, non-active
  await page.mouse.click(CENTER_X, CENTER_Y);
  await dragBetweenCoords(
    page,
    { x: CENTER_X, y: CENTER_Y },
    { x: CENTER_X, y: CENTER_Y + 100 }
  );
  await assertFrameXYWH(page, [0, 100, 720, 72]);
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

test('add shape element', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  const start = { x: 100, y: 100 };
  const end = { x: 200, y: 200 };
  await addBasicRectShapeElement(page, start, end);

  await page.mouse.move(start.x + 5, start.y + 5);
  await assertEdgelessHoverRect(page, [100, 100, 100, 100]);
});

test('change editor mode when brush color palette opening', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);
  await setMouseMode(page, 'brush');

  const brushMenu = page.locator('edgeless-brush-menu');
  await expect(brushMenu).toBeVisible();

  await switchEditorMode(page);
  await expect(brushMenu).toBeHidden();
});

test('add brush element', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  const start = { x: 100, y: 100 };
  const end = { x: 200, y: 200 };
  await addBasicBrushElement(page, start, end);

  await page.mouse.move(start.x + 5, start.y + 5);
  await assertEdgelessHoverRect(page, [98, 98, 104, 104]);
});

test('resize brush element', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  const start = { x: 100, y: 100 };
  const end = { x: 200, y: 200 };
  await addBasicBrushElement(page, start, end);

  await page.mouse.move(start.x + 5, start.y + 5);
  await assertEdgelessHoverRect(page, [98, 98, 104, 104]);

  await page.mouse.click(start.x + 5, start.y + 5);
  const delta = { x: 20, y: 40 };
  await resizeElementByTopLeftHandle(page, delta, 10);

  await page.mouse.move(start.x + 25, start.y + 45);
  await assertEdgelessHoverRect(page, [118, 138, 84, 64]);
});

test('add brush element with color', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  await setMouseMode(page, 'brush');
  const color = '--affine-palette-line-blue';
  await selectBrushColor(page, color);

  const start = { x: 100, y: 100 };
  const end = { x: 200, y: 200 };
  await dragBetweenCoords(page, start, end, { steps: 100 });

  const [pickedColor] = await pickColorAtPoints(page, [[110, 110]]);

  await assertEdgelessColorSameWithHexColor(page, color, pickedColor);
});

test('add brush element with different size', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  await setMouseMode(page, 'brush');
  await selectBrushSize(page, 16);
  const color = '--affine-palette-line-blue';
  await selectBrushColor(page, color);

  const start = { x: 100, y: 100 };
  const end = { x: 200, y: 100 };
  await dragBetweenCoords(page, start, end, { steps: 100 });

  const [topEdge, bottomEdge, nearTopEdge, nearBottomEdge] =
    await pickColorAtPoints(page, [
      // Select two points on the top and bottom border of the line,
      // their color should be the same as the specified color
      [110, 92],
      [110, 107],
      // Select two points close to the upper and lower boundaries of the line,
      // their color should be different from the specified color
      [110, 91],
      [110, 108],
    ]);

  await assertEdgelessColorSameWithHexColor(page, color, topEdge);
  await assertEdgelessColorSameWithHexColor(page, color, bottomEdge);
  assertSameColor(nearTopEdge, '#000000');
  assertSameColor(nearBottomEdge, '#000000');
});

test('add Text', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);

  await switchEditorMode(page);
  await setMouseMode(page, 'text');

  await page.mouse.click(30, 40);
  await waitForVirgoStateUpdated(page);

  await type(page, 'hello');
  await assertRichTexts(page, ['', 'hello']);

  await page.mouse.move(30, 40);
  await assertEdgelessSelectedRect(page, [0, 0, 448, 72]);
});

test.skip('add empty Text', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);

  await switchEditorMode(page);
  await setMouseMode(page, 'text');

  // add text at 30,40
  await page.mouse.click(30, 40);
  await waitForVirgoStateUpdated(page);
  await pressEnter(page);
  // should wait for virgo update and resizeObserver callback
  await waitNextFrame(page);

  // assert add text success
  await page.mouse.move(30, 40);
  await assertEdgelessHoverRect(page, [0, 0, 448, 104]);

  // click out of text
  await page.mouse.click(0, 200);

  // assert empty text is removed
  await page.mouse.move(30, 40);
  await assertEdgelessNonHoverRect(page);
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

test.skip('delete shape block by keyboard', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);

  await switchEditorMode(page);
  await setMouseMode(page, 'shape');
  await dragBetweenCoords(page, { x: 100, y: 100 }, { x: 200, y: 200 });

  await setMouseMode(page, 'default');
  const startPoint = await page.evaluate(() => {
    // @ts-expect-error
    const hitbox = window.std.getShapeBlockHitBox('3');
    if (!hitbox) {
      throw new Error('hitbox is null');
    }
    const rect = hitbox.getBoundingClientRect();
    if (rect == null) {
      throw new Error('rect is null');
    }
    return {
      x: rect.x,
      y: rect.y,
    };
  });
  await page.mouse.click(startPoint.x + 2, startPoint.y + 2);
  await waitNextFrame(page);
  await page.keyboard.press('Backspace');
  const exist = await page.evaluate(() => {
    return document.querySelector('[data-block-id="3"]') != null;
  });
  expect(exist).toBe(false);
});

test('edgeless toolbar menu shows up and close normally', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  const toolbarLocator = page.locator('edgeless-toolbar');
  await expect(toolbarLocator).toBeVisible();

  const shapeTool = locatorEdgelessToolButton(page, 'shape');
  const shapeToolBox = await shapeTool.boundingBox();

  assertExists(shapeToolBox);

  await page.mouse.click(shapeToolBox.x + 10, shapeToolBox.y + 10);

  const shapeMenu = page.locator('edgeless-shape-menu');
  await expect(shapeMenu).toBeVisible();

  await page.mouse.click(shapeToolBox.x + 10, shapeToolBox.y + 10);
  await expect(shapeMenu).toBeHidden();
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

test('selection box of shape element sync on fast dragging', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  await setMouseMode(page, 'shape');
  await dragBetweenCoords(page, { x: 100, y: 100 }, { x: 200, y: 200 });
  await setMouseMode(page, 'default');
  await dragBetweenCoords(
    page,
    { x: 150, y: 150 },
    { x: 700, y: 500 },
    { click: true }
  );

  await assertEdgelessHoverRect(page, [650, 450, 100, 100]);
});

test('hovering on shape should not have effect on underlying block', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await focusRichText(page);

  await type(page, 'hello');
  await assertRichTexts(page, ['hello']);

  await switchEditorMode(page);

  const block = page.locator('.affine-edgeless-block-child');
  const blockBox = await block.boundingBox();
  if (blockBox === null) throw new Error('Unexpected box value: box is null');

  const { x, y } = blockBox;

  await setMouseMode(page, 'shape');
  await dragBetweenCoords(page, { x, y }, { x: x + 100, y: y + 100 });
  await setMouseMode(page, 'default');

  await page.mouse.move(x + 50, y + 50);
  await assertEdgelessHoverRect(page, [x, y, 100, 100]);
});

test('pan tool basic', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  const start = { x: 100, y: 100 };
  const end = { x: 200, y: 200 };
  await addBasicRectShapeElement(page, start, end);

  await setMouseMode(page, 'pan');
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
  await setMouseMode(page, 'default');

  await page.mouse.move(start.x + 25, start.y + 25);
  await assertEdgelessHoverRect(page, [120, 120, 100, 100]);
});

test('pan tool shortcut', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  const start = { x: 100, y: 100 };
  const end = { x: 200, y: 200 };
  await addBasicRectShapeElement(page, start, end);

  await page.mouse.move(start.x + 5, start.y + 5);
  await assertEdgelessHoverRect(page, [100, 100, 100, 100]);

  await page.keyboard.down('Space');
  const panButton = locatorPanButton(page);
  expect(await panButton.getAttribute('active')).toEqual('');

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

  expect(await panButton.getAttribute('active')).toBeNull();

  await page.mouse.move(start.x + 25, start.y + 25);
  await assertEdgelessHoverRect(page, [120, 120, 100, 100]);
});

test('pan tool shortcut when user is editing', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const ids = await initEmptyEdgelessState(page);
  await switchEditorMode(page);
  await setMouseMode(page, 'default');

  await activeFrameInEdgeless(page, ids.frameId);
  await waitForVirgoStateUpdated(page);

  await type(page, 'hello');
  await assertRichTexts(page, ['hello']);

  await page.keyboard.down('Space');
  const panButton = locatorPanButton(page);
  expect(await panButton.getAttribute('active')).toBeNull();
});

test('should cancel select when the selected point is outside the current selected element', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  const firstStart = { x: 100, y: 100 };
  const firstEnd = { x: 200, y: 200 };
  await addBasicRectShapeElement(page, firstStart, firstEnd);

  const secondStart = { x: 300, y: 300 };
  const secondEnd = { x: 400, y: 400 };
  await addBasicRectShapeElement(page, secondStart, secondEnd);

  // select the first rect
  await page.mouse.click(150, 150);

  await dragBetweenCoords(page, { x: 350, y: 350 }, { x: 350, y: 450 });

  await page.mouse.move(150, 150);
  await assertEdgelessHoverRect(page, [100, 100, 100, 100]);
});

test('shape element should not move when the selected state is inactive', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  await setMouseMode(page, 'shape');
  await dragBetweenCoords(page, { x: 100, y: 100 }, { x: 200, y: 200 });
  await setMouseMode(page, 'default');
  await dragBetweenCoords(
    page,
    { x: 50, y: 50 },
    { x: 150, y: 150 },
    { steps: 2 }
  );

  await assertEdgelessHoverRect(page, [100, 100, 100, 100]);
});

test.skip('shape element should have the correct selected shape when clicking on the `Select` toolbar', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await pressEnter(page);
  for (let i = 0; i < 15; i++) {
    await page.keyboard.insertText(`Line ${i + 1}`);
    await pressEnter(page);
  }
  await switchEditorMode(page);

  await setMouseMode(page, 'pan');
  await dragBetweenCoords(page, { x: 100, y: 100 }, { x: 150, y: 150 });
  await setMouseMode(page, 'default');

  const blockBox = await getEdgelessBlockChild(page);
  const selectedBox = await getEdgelessSelectedRect(page);

  expect(blockBox.x).toBeCloseTo(selectedBox.x, 0);
  expect(blockBox.y).toBeCloseTo(selectedBox.y, 0);
  expect(blockBox.width).toBeCloseTo(selectedBox.width, 0);
  expect(blockBox.height).toBeCloseTo(selectedBox.height, 0);
});

test('select multiple shapes and resize', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);

  await switchEditorMode(page);

  await addBasicBrushElement(page, { x: 100, y: 100 }, { x: 200, y: 200 });
  await page.mouse.move(110, 110);
  await assertEdgelessHoverRect(page, [98, 98, 104, 104]);

  await addBasicRectShapeElement(page, { x: 210, y: 110 }, { x: 310, y: 210 });
  await page.mouse.move(220, 120);
  await assertEdgelessHoverRect(page, [210, 110, 100, 100]);

  await dragBetweenCoords(page, { x: 120, y: 90 }, { x: 220, y: 130 });
  await assertEdgelessSelectedRect(page, [98, 98, 212, 112]);

  await resizeElementByTopLeftHandle(page, { x: 50, y: 50 });
  await assertEdgelessSelectedRect(page, [148, 148, 162, 62]);

  await page.mouse.move(160, 160);
  await assertEdgelessHoverRect(page, [148, 148, 79, 57.5]);

  await page.mouse.move(260, 160);
  await assertEdgelessHoverRect(page, [234, 155, 76, 55]);
});

test('select multiple shapes and resize to negative', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);

  await switchEditorMode(page);

  await addBasicBrushElement(page, { x: 100, y: 100 }, { x: 200, y: 200 });
  await page.mouse.move(110, 110);
  await assertEdgelessHoverRect(page, [98, 98, 104, 104]);

  await addBasicRectShapeElement(page, { x: 210, y: 110 }, { x: 310, y: 210 });
  await page.mouse.move(220, 120);
  await assertEdgelessHoverRect(page, [210, 110, 100, 100]);

  await dragBetweenCoords(page, { x: 120, y: 90 }, { x: 220, y: 130 });
  await assertEdgelessSelectedRect(page, [98, 98, 212, 112]);

  await resizeElementByTopLeftHandle(page, { x: 400, y: 300 }, 30);
  await assertEdgelessSelectedRect(page, [310, 210, 188, 188]);

  await page.mouse.move(450, 300);
  await assertEdgelessHoverRect(page, [406, 223, 92, 174.5]);

  await page.mouse.move(320, 220);
  await assertEdgelessHoverRect(page, [310, 210, 88.6, 167.8]);
});

test('select multiple shapes and translate', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);

  await switchEditorMode(page);

  await addBasicBrushElement(page, { x: 100, y: 100 }, { x: 200, y: 200 });
  await page.mouse.move(110, 110);
  await assertEdgelessHoverRect(page, [98, 98, 104, 104]);

  await addBasicRectShapeElement(page, { x: 210, y: 110 }, { x: 310, y: 210 });
  await page.mouse.move(220, 120);
  await assertEdgelessHoverRect(page, [210, 110, 100, 100]);

  await dragBetweenCoords(page, { x: 120, y: 90 }, { x: 220, y: 130 });
  await assertEdgelessSelectedRect(page, [98, 98, 212, 112]);

  await dragBetweenCoords(page, { x: 120, y: 120 }, { x: 150, y: 150 });
  await assertEdgelessSelectedRect(page, [128, 128, 212, 112]);

  await page.mouse.move(160, 160);
  await assertEdgelessHoverRect(page, [128, 128, 104, 104]);

  await page.mouse.move(260, 160);
  await assertEdgelessHoverRect(page, [240, 140, 100, 100]);
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
    { x: frameBox.x + 25, y: frameBox.y + 25 }
  );

  await page.mouse.move(frameBox.x + 25, frameBox.y + 25);
  await assertEdgelessHoverRect(page, [
    frameBox.x + 20,
    frameBox.y + 20,
    frameBox.width,
    frameBox.height,
  ]);
});

test('change brush element size by component-toolbar', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  const start = { x: 100, y: 100 };
  const end = { x: 200, y: 200 };
  await addBasicBrushElement(page, start, end);

  // change to thick
  await page.mouse.click(110, 110);
  await updateExistedBrushElementSize(page, 'thick');

  await page.mouse.move(110, 110);
  await assertEdgelessHoverRect(page, [98, 98, 116, 116]);

  // change to thin
  await page.mouse.click(110, 110);
  await updateExistedBrushElementSize(page, 'thin');

  await page.mouse.move(110, 110);
  await assertEdgelessHoverRect(page, [98, 98, 104, 104]);
});

test('delete shape by component-toolbar', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  const start = { x: 100, y: 100 };
  const end = { x: 200, y: 200 };
  await addBasicBrushElement(page, start, end);

  await page.mouse.click(110, 110);
  await openComponentToolbarMoreMenu(page);
  await clickComponentToolbarMoreMenuButton(page, 'delete');
  await assertEdgelessNonSelectedRect(page);

  await page.mouse.move(110, 110);
  await assertEdgelessNonHoverRect(page);
});

test('shortcut', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  await page.mouse.click(100, 100);

  await page.keyboard.press('t');
  const textButton = locatorEdgelessToolButton(page, 'text');
  await expect(textButton).toHaveAttribute('active', '');

  await page.keyboard.press('s');
  const shapeButton = locatorEdgelessToolButton(page, 'shape');
  await expect(shapeButton).toHaveAttribute('active', '');

  await page.keyboard.press('p');
  const penButton = locatorEdgelessToolButton(page, 'brush');
  await expect(penButton).toHaveAttribute('active', '');

  await page.keyboard.press('h');
  const panButton = locatorEdgelessToolButton(page, 'pan');
  await expect(panButton).toHaveAttribute('active', '');
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

  await setMouseMode(page, 'text');

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
  await assertRichTexts(page, ['456', '789', '123']);

  await expect(page.locator('.affine-edgeless-block-child')).toHaveCount(2);
  await expect(page.locator('affine-selected-blocks > *')).toHaveCount(0);
});

test('block hub should drag and drop a card into existing frame', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await switchEditorMode(page);

  await expect(page.locator('.affine-edgeless-block-child')).toHaveCount(1);

  await page.click('.block-hub-menu-container [role="menuitem"]');
  await page.waitForTimeout(200);
  const blankMenu = '.block-hub-icon-container:nth-child(1)';

  const blankMenuRect = await getCenterPosition(page, blankMenu);
  const targetPos = await getCenterPosition(page, '[data-block-id="3"]');
  await dragBetweenCoords(
    page,
    { x: blankMenuRect.x, y: blankMenuRect.y },
    { x: targetPos.x, y: targetPos.y + 5 },
    { steps: 50 }
  );

  await waitNextFrame(page);
  await type(page, '000');
  await assertRichTexts(page, ['123', '000', '456', '789']);

  await expect(page.locator('.affine-edgeless-block-child')).toHaveCount(1);
});

test('block hub should add new frame when dragged to blank area', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await switchEditorMode(page);

  await expect(page.locator('.affine-edgeless-block-child')).toHaveCount(1);

  await page.click('.block-hub-menu-container [role="menuitem"]');
  await page.waitForTimeout(200);
  const blankMenu = '.block-hub-icon-container:nth-child(1)';

  const blankMenuRect = await getCenterPosition(page, blankMenu);
  await dragBetweenCoords(
    page,
    { x: blankMenuRect.x, y: blankMenuRect.y },
    { x: 30, y: 40 },
    { steps: 50 }
  );

  await waitNextFrame(page);
  await type(page, '000');
  await assertRichTexts(page, ['123', '456', '789', '000']);

  await expect(page.locator('.affine-edgeless-block-child')).toHaveCount(2);
});

test('pressing the ESC key will return to the default state', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  const start = { x: 100, y: 100 };
  const end = { x: 200, y: 200 };
  await addBasicRectShapeElement(page, start, end);

  await page.mouse.click(start.x + 5, start.y + 5);
  await assertEdgelessSelectedRect(page, [100, 100, 100, 100]);

  await pressEscape(page);
  await assertEdgelessNonSelectedRect(page);
});

test('when the selection is always a frame, it should remain in an active state', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  const ids = await initEmptyEdgelessState(page);
  await initThreeParagraphs(page);

  await switchEditorMode(page);
  const bound = await getFrameBoundBoxInEdgeless(page, ids.frameId);

  await setMouseMode(page, 'text');

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
  await assertEdgelessSelectedRect(page, [84, 412, 448, 104]);

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

test('bring to front', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);
  const rect0 = {
    start: { x: 100, y: 100 },
    end: { x: 200, y: 200 },
  };
  await addBasicRectShapeElement(page, rect0.start, rect0.end);

  const rect1 = {
    start: { x: 150, y: 150 },
    end: { x: 250, y: 250 },
  };
  await addBasicRectShapeElement(page, rect1.start, rect1.end);

  // should be rect1
  await page.mouse.click(175, 175);
  await assertEdgelessSelectedRect(page, [150, 150, 100, 100]);

  // click outside to clear selection
  await page.mouse.click(300, 300);

  // should be rect0
  await page.mouse.click(110, 110);
  await assertEdgelessSelectedRect(page, [100, 100, 100, 100]);

  // bring rect0 to front
  await triggerComponentToolbarAction(page, 'bringToFront');

  // should be rect0
  await page.mouse.click(175, 175);
  await assertEdgelessSelectedRect(page, [100, 100, 100, 100]);
});

test('send to back', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  const rect0 = {
    start: { x: 100, y: 100 },
    end: { x: 200, y: 200 },
  };
  await addBasicRectShapeElement(page, rect0.start, rect0.end);

  const rect1 = {
    start: { x: 150, y: 150 },
    end: { x: 250, y: 250 },
  };
  await addBasicRectShapeElement(page, rect1.start, rect1.end);

  // should be rect1
  await page.mouse.click(175, 175);
  await assertEdgelessSelectedRect(page, [150, 150, 100, 100]);

  // bring rect1 to back
  await triggerComponentToolbarAction(page, 'sendToBack');

  // should be rect0
  await page.mouse.click(175, 175);
  await assertEdgelessSelectedRect(page, [100, 100, 100, 100]);
});

test('the tooltip of shape tool button should be hidden when the shape menu is shown', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  const shapeTool = locatorEdgelessToolButton(page, 'shape');
  const shapeToolBox = await shapeTool.boundingBox();
  const tooltip = shapeTool.locator('tool-tip');

  assertExists(shapeToolBox);

  await page.mouse.move(shapeToolBox.x + 10, shapeToolBox.y + 10);
  await expect(tooltip).toBeVisible();

  await page.mouse.click(shapeToolBox.x + 10, shapeToolBox.y + 10);
  await expect(tooltip).toBeHidden();

  await page.mouse.click(shapeToolBox.x + 10, shapeToolBox.y + 10);
  await expect(tooltip).toBeVisible();
});

test('the tooltip of more button should be hidden when the action menu is shown', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  const start = { x: 100, y: 100 };
  const end = { x: 200, y: 200 };
  await addBasicBrushElement(page, start, end);

  await page.mouse.click(start.x + 5, start.y + 5);
  await assertEdgelessHoverRect(page, [98, 98, 104, 104]);

  const moreButton = locatorEdgelessComponentToolButton(page, 'more');
  await expect(moreButton).toBeVisible();

  const moreButtonBox = await moreButton.boundingBox();
  const tooltip = moreButton.locator('tool-tip');

  assertExists(moreButtonBox);

  await page.mouse.move(moreButtonBox.x + 10, moreButtonBox.y + 10);
  await expect(tooltip).toBeVisible();

  await page.mouse.click(moreButtonBox.x + 10, moreButtonBox.y + 10);
  await expect(tooltip).toBeHidden();

  await page.mouse.click(moreButtonBox.x + 10, moreButtonBox.y + 10);
  await expect(tooltip).toBeVisible();
});

test('add connector element', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  const start = { x: 100, y: 100 };
  const end = { x: 200, y: 200 };

  await addBasicConnectorElement(page, start, end);

  await page.mouse.move(start.x + 5, start.y + 5);
  await assertEdgelessHoverRect(page, [100, 100, 100, 100]);
});

test('connector attached element', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  const rect = {
    start: { x: 100, y: 100 },
    end: { x: 200, y: 200 },
  };
  await addBasicRectShapeElement(page, rect.start, rect.end);

  const connector = {
    start: { x: 160, y: 200 },
    end: { x: 300, y: 300 },
  };
  // connector start point will be fixed to [150, 200]
  await addBasicConnectorElement(page, connector.start, connector.end);

  await page.mouse.move(connector.start.x + 5, connector.start.y + 5);
  await assertEdgelessHoverRect(page, [150, 200, 150, 100]);

  const connector2 = {
    start: { x: 170, y: 150 },
    end: { x: 300, y: 170 },
  };
  // start point in rect and not be fixed
  await addBasicConnectorElement(page, connector2.start, connector2.end);

  await page.mouse.move(connector2.end.x - 5, connector2.end.y - 5);
  await assertEdgelessHoverRect(page, [170, 150, 130, 20]);
});

test('drag element which attaches connector', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  const rect = {
    start: { x: 100, y: 100 },
    end: { x: 200, y: 200 },
  };
  await addBasicRectShapeElement(page, rect.start, rect.end);

  const connector = {
    start: { x: 150, y: 200 },
    end: { x: 300, y: 300 },
  };
  await addBasicConnectorElement(page, connector.start, connector.end);

  await page.mouse.move(connector.start.x + 5, connector.start.y + 5);
  await assertEdgelessHoverRect(page, [150, 200, 150, 100]);

  await dragBetweenCoords(
    page,
    {
      x: rect.start.x + 5,
      y: rect.start.y + 5,
    },
    {
      x: rect.start.x + 35,
      y: rect.start.y + 35,
    }
  );

  await page.mouse.move(connector.end.x - 5, connector.end.y - 5);
  await assertEdgelessHoverRect(page, [180, 230, 120, 70]);
});

test('resize element which attaches connector', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  const rect = {
    start: { x: 100, y: 100 },
    end: { x: 200, y: 200 },
  };
  await addBasicRectShapeElement(page, rect.start, rect.end);

  const connector = {
    start: { x: 150, y: 200 },
    end: { x: 300, y: 300 },
  };
  await addBasicConnectorElement(page, connector.start, connector.end);

  await page.mouse.move(connector.start.x + 5, connector.start.y + 5);
  await assertEdgelessHoverRect(page, [150, 200, 150, 100]);

  await page.mouse.click(rect.start.x + 5, rect.start.y + 5);
  await resizeElementByTopLeftHandle(page, { x: 20, y: 0 });

  await page.mouse.move(connector.end.x - 5, connector.end.y - 5);
  await assertEdgelessHoverRect(page, [160, 200, 140, 100]);
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

test('change shape fill color', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  const rect = {
    start: { x: 100, y: 100 },
    end: { x: 200, y: 200 },
  };
  await addBasicRectShapeElement(page, rect.start, rect.end);

  await page.mouse.click(rect.start.x + 5, rect.start.y + 5);
  await triggerComponentToolbarAction(page, 'changeShapeFillColor');
  const color = '--affine-palette-shape-navy';
  await changeShapeFillColor(page, color);
  await page.waitForTimeout(50);
  const [picked] = await pickColorAtPoints(page, [
    [rect.start.x + 20, rect.start.y + 20],
  ]);

  await assertEdgelessColorSameWithHexColor(page, color, picked);
});

test('change shape stroke color', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  const rect = {
    start: { x: 100, y: 100 },
    end: { x: 200, y: 200 },
  };
  await addBasicRectShapeElement(page, rect.start, rect.end);

  await page.mouse.click(rect.start.x + 5, rect.start.y + 5);
  await triggerComponentToolbarAction(page, 'changeShapeStrokeColor');
  const color = '--affine-palette-line-navy';
  await changeShapeStrokeColor(page, color);
  await page.waitForTimeout(50);
  const [picked] = await pickColorAtPoints(page, [
    [rect.start.x + 2, rect.start.y + 2],
  ]);

  await assertEdgelessColorSameWithHexColor(page, color, picked);
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
