import { expect } from '@playwright/test';

import {
  addBasicConnectorElement,
  changeConnectorStrokeColor,
  changeConnectorStrokeStyle,
  changeConnectorStrokeWidth,
  deleteAll,
  deleteAllConnectors,
  getConnectorPath,
  locatorConnectorStrokeStyleButton,
  locatorConnectorStrokeWidthButton,
  pickColorAtPoints,
  switchEditorMode,
  toViewCoord,
  triggerComponentToolbarAction,
} from '../utils/actions/edgeless.js';
import {
  addBasicRectShapeElement,
  dragBetweenCoords,
  enterPlaygroundRoom,
  initEmptyEdgelessState,
  redoByClick,
  undoByClick,
  waitNextFrame,
} from '../utils/actions/index.js';
import { assertConnectorPath } from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

test('elbow connector without node and width greater than height', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);
  await deleteAll(page);
  const start = await toViewCoord(page, [0, 0]);
  const end = await toViewCoord(page, [200, 100]);
  await addBasicConnectorElement(
    page,
    { x: start[0], y: start[1] },
    { x: end[0], y: end[1] }
  );

  const path = await getConnectorPath(page);
  expect(path).toMatchObject([
    [0, 0],
    [100, 0],
    [100, 100],
    [200, 100],
  ]);
});

test('elbow connector without node and width less than height', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);
  await deleteAll(page);

  const start = await toViewCoord(page, [0, 0]);
  const end = await toViewCoord(page, [100, 200]);
  await addBasicConnectorElement(
    page,
    { x: start[0], y: start[1] },
    { x: end[0], y: end[1] }
  );

  const path = await getConnectorPath(page);
  expect(path).toMatchObject([
    [0, 0],
    [0, 100],
    [100, 100],
    [100, 200],
  ]);
});

test('elbow connector one side attached element another side free', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);
  await deleteAll(page);

  let start = await toViewCoord(page, [0, 0]);
  let end = await toViewCoord(page, [100, 100]);
  await addBasicRectShapeElement(
    page,
    { x: start[0], y: start[1] },
    { x: end[0], y: end[1] }
  );

  start = await toViewCoord(page, [50, 50]);
  end = await toViewCoord(page, [200, 0]);

  await addBasicConnectorElement(
    page,
    { x: start[0], y: start[1] },
    { x: end[0], y: end[1] }
  );
  let path = await getConnectorPath(page);
  expect(path).toMatchObject([
    [100, 50],
    [150, 50],
    [150, 0],
    [200, 0],
  ]);

  await deleteAllConnectors(page);

  end = await toViewCoord(page, [125, 0]);
  await addBasicConnectorElement(
    page,
    { x: start[0], y: start[1] },
    { x: end[0], y: end[1] }
  );
  path = await getConnectorPath(page);

  expect(path).toMatchObject([
    [100, 50],
    [125, 50],
    [125, 0],
  ]);
});

test('elbow connector both side attatched element', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);
  await deleteAll(page);

  let start = await toViewCoord(page, [0, 0]);
  let end = await toViewCoord(page, [100, 100]);
  await addBasicRectShapeElement(
    page,
    { x: start[0], y: start[1] },
    { x: end[0], y: end[1] }
  );

  start = await toViewCoord(page, [200, 0]);
  end = await toViewCoord(page, [300, 100]);
  await addBasicRectShapeElement(
    page,
    { x: start[0], y: start[1] },
    { x: end[0], y: end[1] }
  );

  start = await toViewCoord(page, [50, 50]);
  end = await toViewCoord(page, [250, 50]);
  await addBasicConnectorElement(
    page,
    { x: start[0], y: start[1] },
    { x: end[0], y: end[1] }
  );

  assertConnectorPath(page, [
    [100, 50],
    [200, 50],
  ]);

  start = await toViewCoord(page, [250, 50]);
  end = await toViewCoord(page, [260, 50]);
  await dragBetweenCoords(
    page,
    { x: start[0], y: start[1] },
    { x: end[0], y: end[1] }
  );
  end = await toViewCoord(page, [250, 0]);
  await dragBetweenCoords(
    page,
    { x: start[0], y: start[1] },
    { x: end[0], y: end[1] }
  );
  assertConnectorPath(page, [
    [100, 50],
    [150, 50],
    [150, 0],
    [200, 0],
  ]);

  start = end;
  end = await toViewCoord(page, [150, -50]);
  await dragBetweenCoords(
    page,
    { x: start[0], y: start[1] },
    { x: end[0], y: end[1] }
  );
  assertConnectorPath(page, [
    [50, 0],
    [50, -50],
    [100, -50],
  ]);
  start = end;
  end = await toViewCoord(page, [150, -150]);
  await dragBetweenCoords(
    page,
    { x: start[0], y: start[1] },
    { x: end[0], y: end[1] }
  );
  assertConnectorPath(page, [
    [50, 0],
    [50, -50],
    [150, -50],
    [150, -100],
  ]);

  await undoByClick(page);
  assertConnectorPath(page, [
    [50, 0],
    [50, -50],
    [100, -50],
  ]);
  await undoByClick(page);
  assertConnectorPath(page, [
    [100, 50],
    [150, 50],
    [150, 0],
    [200, 0],
  ]);
  await undoByClick(page);
  assertConnectorPath(page, [
    [100, 50],
    [200, 50],
  ]);
  await redoByClick(page);
  assertConnectorPath(page, [
    [100, 50],
    [150, 50],
    [150, 0],
    [200, 0],
  ]);
  await redoByClick(page);
  assertConnectorPath(page, [
    [50, 0],
    [50, -50],
    [100, -50],
  ]);
  await redoByClick(page);
  assertConnectorPath(page, [
    [50, 0],
    [50, -50],
    [150, -50],
    [150, -100],
  ]);
});

test('elbow connector both side attached element with one attach element and other is fixed', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);
  await deleteAll(page);

  let start = await toViewCoord(page, [0, 0]);
  let end = await toViewCoord(page, [100, 100]);
  await addBasicRectShapeElement(
    page,
    { x: start[0], y: start[1] },
    { x: end[0], y: end[1] }
  );

  start = await toViewCoord(page, [200, 0]);
  end = await toViewCoord(page, [300, 100]);
  await addBasicRectShapeElement(
    page,
    { x: start[0], y: start[1] },
    { x: end[0], y: end[1] }
  );

  start = await toViewCoord(page, [50, 0]);
  end = await toViewCoord(page, [250, 50]);
  await addBasicConnectorElement(
    page,
    { x: start[0], y: start[1] },
    { x: end[0], y: end[1] }
  );

  assertConnectorPath(page, [
    [50, 0],
    [50, -20],
    [150, -20],
    [150, 50],
    [200, 50],
  ]);

  start = end;
  end = await toViewCoord(page, [255, 55]);
  await dragBetweenCoords(
    page,
    { x: start[0], y: start[1] },
    { x: end[0], y: end[1] }
  ); // select
  start = await toViewCoord(page, [250, 50]);
  end = await toViewCoord(page, [250, 0]);
  await dragBetweenCoords(
    page,
    { x: start[0], y: start[1] },
    { x: end[0], y: end[1] }
  );
  assertConnectorPath(page, [
    [50, 0],
    [50, -20],
    [150, -20],
    [150, 0],
    [200, 0],
  ]);

  start = end;
  end = await toViewCoord(page, [250, -20]);
  await dragBetweenCoords(
    page,
    { x: start[0], y: start[1] },
    { x: end[0], y: end[1] }
  );
  assertConnectorPath(page, [
    [50, 0],
    [50, -20],
    [200, -20],
  ]);

  start = end;
  end = await toViewCoord(page, [150, -150]);
  await dragBetweenCoords(
    page,
    { x: start[0], y: start[1] },
    { x: end[0], y: end[1] }
  );
  assertConnectorPath(page, [
    [50, 0],
    [50, -50],
    [150, -50],
    [150, -100],
  ]);
});

test('elbow connector both side attached element with all fixed', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);
  await deleteAll(page);

  let start = await toViewCoord(page, [0, 0]);
  let end = await toViewCoord(page, [100, 100]);
  await addBasicRectShapeElement(
    page,
    { x: start[0], y: start[1] },
    { x: end[0], y: end[1] }
  );

  start = await toViewCoord(page, [200, 0]);
  end = await toViewCoord(page, [300, 100]);
  await addBasicRectShapeElement(
    page,
    { x: start[0], y: start[1] },
    { x: end[0], y: end[1] }
  );

  start = await toViewCoord(page, [50, 0]);
  end = await toViewCoord(page, [300, 50]);
  await addBasicConnectorElement(
    page,
    { x: start[0], y: start[1] },
    { x: end[0], y: end[1] }
  );
  await assertConnectorPath(page, [
    [50, 0],
    [50, -20],
    [320, -20],
    [320, 50],
    [300, 50],
  ]);
});

test('change connector line width', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  const start = { x: 100, y: 100 };
  const end = { x: 200, y: 200 };
  await addBasicConnectorElement(page, start, end);

  await page.mouse.click(start.x + 5, start.y + 5);
  await triggerComponentToolbarAction(page, 'changeConnectorStrokeColor');
  await changeConnectorStrokeColor(page, '--affine-palette-line-navy');

  await triggerComponentToolbarAction(page, 'changeConnectorStrokeStyles');
  await changeConnectorStrokeWidth(page, 'l');

  await waitNextFrame(page);

  await triggerComponentToolbarAction(page, 'changeConnectorStrokeStyles');
  const activeButton = locatorConnectorStrokeWidthButton(page, 'l');
  const className = await activeButton.evaluate(ele => ele.className);
  expect(className.includes(' active')).toBeTruthy();

  const pickedColor = await pickColorAtPoints(page, [
    [start.x + 10, start.y - 3],
    [start.x + 10, start.y + 3],
  ]);
  expect(pickedColor[0]).toBe(pickedColor[1]);
});

test('change connector stroke style', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  const start = { x: 100, y: 100 };
  const end = { x: 200, y: 200 };
  await addBasicConnectorElement(page, start, end);

  await page.mouse.click(start.x + 5, start.y + 5);
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
