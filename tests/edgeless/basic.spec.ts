/* eslint-disable @typescript-eslint/no-restricted-imports */

import { EDITOR_WIDTH } from '@blocksuite/global/config';
import { assertExists } from '@blocksuite/global/utils';
import { expect } from '@playwright/test';

import {
  decreaseZoomLevel,
  getEdgelessBlockChild,
  getEdgelessHoverRect,
  getEdgelessSelectedRect,
  increaseZoomLevel,
  locatorEdgelessComponentToolButton,
  optionMouseDrag,
  setMouseMode,
  switchEditorMode,
  zoomByMouseWheel,
} from '../utils/actions/edgeless.js';
import {
  addBasicBrushElement,
  addBasicRectShapeElement,
  click,
  dragBetweenCoords,
  enterPlaygroundRoom,
  focusRichText,
  initEmptyEdgelessState,
  pressEnter,
  redoByClick,
  type,
  undoByClick,
  waitNextFrame,
} from '../utils/actions/index.js';
import {
  assertEdgelessHoverRect,
  assertEdgelessNonSelectedRect,
  assertEdgelessSelectedRect,
  assertFrameXYWH,
  assertRichTexts,
  assertSelection,
} from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

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
  await assertFrameXYWH(page, [0, 0, EDITOR_WIDTH, 80]);
  await page.mouse.move(CENTER_X, CENTER_Y);

  const original = [50, 260, EDITOR_WIDTH, 80];
  await assertEdgelessHoverRect(page, original);
  let box = await getEdgelessHoverRect(page);

  await decreaseZoomLevel(page);
  await decreaseZoomLevel(page);
  await page.mouse.move(CENTER_X, CENTER_Y);

  box = await getEdgelessHoverRect(page);
  const zoomed = [box.x, box.y, original[2] * 0.5, original[3] * 0.5];
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
  await assertFrameXYWH(page, [0, 0, EDITOR_WIDTH, 80]);
  await page.mouse.move(CENTER_X, CENTER_Y);

  const original = [50, 260, EDITOR_WIDTH, 80];
  await assertEdgelessHoverRect(page, original);

  await zoomByMouseWheel(page, 0, 125);
  await page.mouse.move(CENTER_X, CENTER_Y);

  const zoomed = [150, 270, original[2] * 0.75, original[3] * 0.75];
  await assertEdgelessHoverRect(page, zoomed);
});

test('option/alt mouse drag duplicate a new element', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  const start = { x: 100, y: 100 };
  const end = { x: 200, y: 200 };
  await addBasicRectShapeElement(page, start, end);
  await optionMouseDrag(page, { x: 150, y: 150 }, { x: 250, y: 150 });

  await assertEdgelessSelectedRect(page, [200, 100, 100, 100]);

  await undoByClick(page);
  await assertEdgelessNonSelectedRect(page);

  await redoByClick(page);
  await click(page, { x: 250, y: 150 });
  await assertEdgelessSelectedRect(page, [200, 100, 100, 100]);
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

  await dragBetweenCoords(
    page,
    { x: 350, y: 350 },
    { x: 350, y: 450 },
    { steps: 0 }
  );

  await page.mouse.move(150, 150);
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
