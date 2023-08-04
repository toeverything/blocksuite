import { expect } from '@playwright/test';

import {
  addBasicConnectorElement,
  changeConnectorStrokeColor,
  changeConnectorStrokeStyle,
  changeConnectorStrokeWidth,
  createConnectorElement,
  createShapeElement,
  deleteAllConnectors,
  dragBetweenViewCoords,
  edgelessCommonSetup as commonSetup,
  locatorConnectorStrokeStyleButton,
  locatorConnectorStrokeWidthButton,
  pickColorAtPoints,
  rotateElementByHandle,
  Shape,
  triggerComponentToolbarAction,
} from '../utils/actions/edgeless.js';
import {
  pressBackspace,
  redoByClick,
  undoByClick,
  waitNextFrame,
} from '../utils/actions/index.js';
import {
  assertConnectorPath,
  assertEdgelessHoverRect,
  assertPointAlmostEqual,
} from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

test('elbow connector without node and width greater than height', async ({
  page,
}) => {
  await commonSetup(page);
  await createConnectorElement(page, [0, 0], [200, 100]);
  await assertConnectorPath(page, [
    [0, 0],
    [100, 0],
    [100, 100],
    [200, 100],
  ]);
});

test('elbow connector without node and width less than height', async ({
  page,
}) => {
  await commonSetup(page);
  await createConnectorElement(page, [0, 0], [100, 200]);
  await assertConnectorPath(page, [
    [0, 0],
    [0, 100],
    [100, 100],
    [100, 200],
  ]);
});

test('elbow connector one side attached element another side free', async ({
  page,
}) => {
  await commonSetup(page);
  await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
  await createConnectorElement(page, [50, 50], [200, 0]);

  await assertConnectorPath(page, [
    [100, 50],
    [150, 50],
    [150, 0],
    [200, 0],
  ]);

  await deleteAllConnectors(page);
  await createConnectorElement(page, [50, 50], [125, 0]);

  await assertConnectorPath(page, [
    [100, 50],
    [125, 50],
    [125, 0],
  ]);
});

test('elbow connector both side attatched element', async ({ page }) => {
  await commonSetup(page);

  await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
  await createShapeElement(page, [200, 0], [300, 100], Shape.Square);
  await createConnectorElement(page, [50, 50], [250, 50]);

  await assertConnectorPath(page, [
    [100, 50],
    [200, 50],
  ]);

  // select
  await dragBetweenViewCoords(page, [250, -10], [260, 50]);

  await dragBetweenViewCoords(page, [250, 50], [250, 0]);
  await assertConnectorPath(page, [
    [100, 50],
    [150, 50],
    [150, 0],
    [200, 0],
  ]);

  await dragBetweenViewCoords(page, [250, 0], [150, -50]);
  await assertConnectorPath(page, [
    [50, 0],
    [50, -50],
    [100, -50],
  ]);

  await dragBetweenViewCoords(page, [150, -50], [150, -150]);
  await assertConnectorPath(page, [
    [50, 0],
    [50, -50],
    [150, -50],
    [150, -100],
  ]);

  await undoByClick(page);
  await assertConnectorPath(page, [
    [50, 0],
    [50, -50],
    [100, -50],
  ]);
  await undoByClick(page);
  await assertConnectorPath(page, [
    [100, 50],
    [150, 50],
    [150, 0],
    [200, 0],
  ]);
  await undoByClick(page);
  await assertConnectorPath(page, [
    [100, 50],
    [200, 50],
  ]);
  await redoByClick(page);
  await assertConnectorPath(page, [
    [100, 50],
    [150, 50],
    [150, 0],
    [200, 0],
  ]);
  await redoByClick(page);
  await assertConnectorPath(page, [
    [50, 0],
    [50, -50],
    [100, -50],
  ]);
  await redoByClick(page);
  await assertConnectorPath(page, [
    [50, 0],
    [50, -50],
    [150, -50],
    [150, -100],
  ]);
});

test('elbow connector both side attached element with one attach element and other is fixed', async ({
  page,
}) => {
  await commonSetup(page);

  await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
  await createShapeElement(page, [200, 0], [300, 100], Shape.Square);
  await createConnectorElement(page, [50, 0], [250, 50]);

  await assertConnectorPath(page, [
    [50, 0],
    [50, -20],
    [150, -20],
    [150, 50],
    [200, 50],
  ]);

  // select
  await dragBetweenViewCoords(page, [255, -10], [255, 55]);
  await dragBetweenViewCoords(page, [250, 50], [250, 0]);

  await assertConnectorPath(page, [
    [50, 0],
    [50, -20],
    [150, -20],
    [150, 0],
    [200, 0],
  ]);

  await dragBetweenViewCoords(page, [250, 0], [250, -20]);
  await assertConnectorPath(page, [
    [50, 0],
    [50, -20],
    [200, -20],
  ]);

  await dragBetweenViewCoords(page, [250, -20], [150, -150]);
  await assertConnectorPath(page, [
    [50, 0],
    [50, -50],
    [150, -50],
    [150, -100],
  ]);
});

test('elbow connector both side attached element with all fixed', async ({
  page,
}) => {
  await commonSetup(page);

  await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
  await createShapeElement(page, [200, 0], [300, 100], Shape.Square);
  await createConnectorElement(page, [50, 0], [300, 50]);
  await assertConnectorPath(page, [
    [50, 0],
    [50, -20],
    [320, -20],
    [320, 50],
    [300, 50],
  ]);
});

test('path #1, the upper line is parallel with the lower line of antoher, and anchor from top to bottom of another', async ({
  page,
}) => {
  await commonSetup(page);

  await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
  await createShapeElement(page, [200, -100], [300, 0], Shape.Square);
  await createConnectorElement(page, [50, 0], [250, 0]);

  await waitNextFrame(page);
  await assertConnectorPath(page, [
    [50, 0],
    [50, -20],
    [150, -20],
    [150, 20],
    [250, 20],
    [250, 0],
  ]);
});

test('path #2, the top-right point is overlapped with the bottom-left point of another, and anchor from top to bottom of another', async ({
  page,
}) => {
  await commonSetup(page);
  await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
  await createShapeElement(page, [100, -100], [200, 0], Shape.Square);
  await createConnectorElement(page, [50, 0], [150, 0]);

  await assertConnectorPath(page, [
    [50, 0],
    [50, -120],
    [220, -120],
    [220, 20],
    [150, 20],
    [150, 0],
  ]);
});

test('path #3, the two shape are parallel in x axis, the anchor from the right to right', async ({
  page,
}) => {
  await commonSetup(page);

  await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
  await createShapeElement(page, [200, 0], [300, 100], Shape.Square);
  await createConnectorElement(page, [100, 50], [300, 50]);
  await assertConnectorPath(page, [
    [100, 50],
    [150, 50],
    [150, 120],
    [320, 120],
    [320, 50],
    [300, 50],
  ]);
});

test('when element is removed, connector should updated', async ({ page }) => {
  await commonSetup(page);
  await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
  await createConnectorElement(page, [100, 50], [200, 0]);

  //select
  await dragBetweenViewCoords(page, [10, -10], [20, 20]);
  await pressBackspace(page);
  await dragBetweenViewCoords(page, [100, 50], [0, 50]);
  await assertConnectorPath(page, [
    [0, 50],
    [50, 50],
    [50, 0],
    [100, 0],
  ]);
});

test('connector connects triangle shape', async ({ page }) => {
  await commonSetup(page);
  await createShapeElement(page, [0, 0], [100, 100], Shape.Triangle);
  await createConnectorElement(page, [75, 50], [100, 50]);

  await assertConnectorPath(page, [
    [75, 50],
    [100, 50],
  ]);
});

test('connector connects diamond shape', async ({ page }) => {
  await commonSetup(page);
  await createShapeElement(page, [0, 0], [100, 100], Shape.Diamond);
  await createConnectorElement(page, [100, 50], [200, 50]);

  await assertConnectorPath(page, [
    [100, 50],
    [200, 50],
  ]);
});

test('connector connects rotated Square shape', async ({ page }) => {
  await commonSetup(page);
  await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
  await createConnectorElement(page, [50, 0], [50, -100]);

  await dragBetweenViewCoords(page, [-10, 50], [60, 60]);
  await rotateElementByHandle(page, 30, 'top-left');
  await assertConnectorPath(page, [
    [75, 6.7],
    [75, -46.65],
    [50, -46.65],
    [50, -100],
  ]);
  await rotateElementByHandle(page, 30, 'top-left');
  await assertConnectorPath(page, [
    [93.3, 25],
    [138.3, 25],
    [138.3, -38.3],
    [50, -38.3],
    [50, -100],
  ]);
});

test('change connector line width', async ({ page }) => {
  await commonSetup(page);

  const start = { x: 100, y: 200 };
  const end = { x: 300, y: 300 };
  await addBasicConnectorElement(page, start, end);

  await page.mouse.click(start.x + 5, start.y);
  await triggerComponentToolbarAction(page, 'changeConnectorStrokeColor');
  await changeConnectorStrokeColor(page, '--affine-palette-line-navy');

  await triggerComponentToolbarAction(page, 'changeConnectorStrokeStyles');
  await changeConnectorStrokeWidth(page, 5);
  await page.mouse.move(start.x + 5, start.y);
  await assertEdgelessHoverRect(page, [100, 200, 200, 100]);

  await waitNextFrame(page);

  await triggerComponentToolbarAction(page, 'changeConnectorStrokeStyles');

  const pickedColor = await pickColorAtPoints(page, [
    [start.x + 5, start.y],
    [start.x + 10, start.y],
  ]);
  expect(pickedColor[0]).toBe(pickedColor[1]);
});

test('change connector stroke style', async ({ page }) => {
  await commonSetup(page);

  const start = { x: 100, y: 200 };
  const end = { x: 300, y: 300 };
  await addBasicConnectorElement(page, start, end);

  await page.mouse.click(start.x + 5, start.y);
  await triggerComponentToolbarAction(page, 'changeConnectorStrokeColor');
  await changeConnectorStrokeColor(page, '--affine-palette-line-navy');

  await triggerComponentToolbarAction(page, 'changeConnectorStrokeStyles');
  await changeConnectorStrokeStyle(page, 'dash');
  await waitNextFrame(page);

  await triggerComponentToolbarAction(page, 'changeConnectorStrokeStyles');
  const activeButton = locatorConnectorStrokeStyleButton(page, 'dash');
  const className = await activeButton.evaluate(ele => ele.className);
  expect(className.includes(' active')).toBeTruthy();

  const pickedColor = await pickColorAtPoints(page, [[start.x + 20, start.y]]);
  expect(pickedColor[0]).toBe('#000000');
});
