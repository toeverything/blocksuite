import { expect, type Page } from '@playwright/test';

import {
  addBasicConnectorElement,
  assertEdgelessConnectorToolMode,
  changeConnectorStrokeColor,
  changeConnectorStrokeStyle,
  changeConnectorStrokeWidth,
  ConnectorMode,
  createConnectorElement,
  createShapeElement,
  deleteAllConnectors,
  dragBetweenViewCoords,
  edgelessCommonSetup as commonSetup,
  locatorComponentToolbar,
  pickColorAtPoints,
  rotateElementByHandle,
  setEdgelessTool,
  Shape,
  toModelCoord,
  toViewCoord,
  triggerComponentToolbarAction,
} from '../utils/actions/edgeless.js';
import {
  clickView,
  moveView,
  pressBackspace,
  redoByClick,
  selectAllByKeyboard,
  SHORT_KEY,
  type,
  undoByClick,
  waitNextFrame,
} from '../utils/actions/index.js';
import {
  assertConnectorPath,
  assertEdgelessCanvasText,
  assertEdgelessNonSelectedRect,
  assertEdgelessSelectedRect,
  assertExists,
  assertPointAlmostEqual,
} from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

test('elbow connector without node and width greater than height', async ({
  page,
}) => {
  await commonSetup(page);
  await setEdgelessTool(page, 'connector');
  await assertEdgelessConnectorToolMode(page, ConnectorMode.Curve);
  await dragBetweenViewCoords(page, [0, 0], [200, 100]);
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
  await createConnectorElement(page, [51, 50], [200, 0]);

  await assertConnectorPath(page, [
    [100, 50],
    [150, 50],
    [150, 0],
    [200, 0],
  ]);

  await deleteAllConnectors(page);
  await createConnectorElement(page, [50, 50], [125, 0]);

  await assertConnectorPath(page, [
    [50, 0],
    [125, 50],
    [125, 0],
  ]);
});

test('elbow connector both side attatched element', async ({ page }) => {
  await commonSetup(page);

  await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
  await createShapeElement(page, [200, 0], [300, 100], Shape.Square);
  await createConnectorElement(page, [50, 50], [249, 50]);

  await assertConnectorPath(page, [
    [50, 0],
    [200, 50],
  ]);

  // Could drag directly
  // because the default shape type change to general style with filled color
  await dragBetweenViewCoords(page, [250, 50], [250, 0]);
  await assertConnectorPath(page, [
    [50, 0],
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
    [50, 0],
    [150, 50],
    [150, 0],
    [200, 0],
  ]);
  await undoByClick(page);
  await assertConnectorPath(page, [
    [50, 0],
    [200, 50],
  ]);
  await redoByClick(page);
  await assertConnectorPath(page, [
    [50, 0],
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

test('when element is removed, connector should be deleted too', async ({
  page,
}) => {
  await commonSetup(page);
  await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
  await createConnectorElement(page, [100, 50], [200, 0]);

  //select
  await dragBetweenViewCoords(page, [10, -10], [20, 20]);
  await pressBackspace(page);
  await dragBetweenViewCoords(page, [100, 50], [0, 50]);
  await assertEdgelessNonSelectedRect(page);
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
  await changeConnectorStrokeColor(page, '--affine-palette-line-teal');

  await triggerComponentToolbarAction(page, 'changeConnectorStrokeStyles');
  await changeConnectorStrokeWidth(page, 5);

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
  await changeConnectorStrokeColor(page, '--affine-palette-line-teal');

  await triggerComponentToolbarAction(page, 'changeConnectorStrokeStyles');
  await changeConnectorStrokeStyle(page, 'dash');
  await waitNextFrame(page);

  await triggerComponentToolbarAction(page, 'changeConnectorStrokeStyles');

  const pickedColor = await pickColorAtPoints(page, [[start.x + 20, start.y]]);
  expect(pickedColor[0]).toBe('#000000');
});

test.describe('connector label with straight shape', () => {
  async function getEditorCenter(page: Page) {
    const bounds = await page
      .locator('edgeless-connector-label-editor rich-text')
      .boundingBox();
    assertExists(bounds);
    const cx = bounds.x + bounds.width / 2;
    const cy = bounds.y + bounds.height / 2;
    return [cx, cy];
  }

  function calcOffsetDistance(s: number[], e: number[], p: number[]) {
    const p1 = Math.hypot(s[1] - p[1], s[0] - p[0]);
    const f1 = Math.hypot(s[1] - e[1], s[0] - e[0]);
    return p1 / f1;
  }

  test('should insert in the middle of the path when clicking on the button', async ({
    page,
  }) => {
    await commonSetup(page);
    const start = { x: 100, y: 200 };
    const end = { x: 300, y: 300 };
    await addBasicConnectorElement(page, start, end);
    await page.mouse.click(105, 200);

    await triggerComponentToolbarAction(page, 'addText');
    await type(page, ' a ');
    await assertEdgelessCanvasText(page, ' a ');

    await page.mouse.click(0, 0);
    await waitNextFrame(page);
    await page.mouse.click(105, 200);

    const addTextBtn = locatorComponentToolbar(page).getByRole('button', {
      name: 'Add text',
    });
    await expect(addTextBtn).toBeHidden();

    await page.mouse.dblclick(200, 250);
    await assertEdgelessCanvasText(page, 'a');

    await page.keyboard.press('Backspace');
    await assertEdgelessCanvasText(page, '');

    await page.mouse.click(0, 0);
    await waitNextFrame(page);
    await page.mouse.click(200, 250);

    await expect(addTextBtn).toBeVisible();
  });

  test('should insert at the place when double clicking on the path', async ({
    page,
  }) => {
    await commonSetup(page);
    await setEdgelessTool(page, 'connector');

    await page.mouse.move(0, 0);

    const menu = page.locator('edgeless-connector-menu');
    await expect(menu).toBeVisible();

    const straightBtn = menu.locator('edgeless-tool-icon-button', {
      hasText: 'Straight',
    });
    await expect(straightBtn).toBeVisible();
    await straightBtn.click();

    const start = { x: 250, y: 250 };
    const end = { x: 500, y: 250 };
    await addBasicConnectorElement(page, start, end);

    await page.mouse.dblclick(300, 250);
    await type(page, 'a');
    await assertEdgelessCanvasText(page, 'a');

    await page.mouse.click(0, 0);
    await waitNextFrame(page);

    await page.mouse.dblclick(300, 250);
    await waitNextFrame(page);

    await page.keyboard.press('ArrowRight');
    await type(page, 'b');
    await assertEdgelessCanvasText(page, 'ab');

    await page.mouse.click(0, 0);
    await waitNextFrame(page);

    await page.mouse.dblclick(300, 250);
    await waitNextFrame(page);

    await type(page, 'c');
    await assertEdgelessCanvasText(page, 'c');
    await waitNextFrame(page);

    const [cx, cy] = await getEditorCenter(page);
    assertPointAlmostEqual([cx, cy], [300, 250]);
    expect((cx - 250) / (500 - 250)).toBeCloseTo(50 / 250);
  });

  test('should move alone the path', async ({ page }) => {
    await commonSetup(page);

    await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
    await createShapeElement(page, [200, 0], [300, 100], Shape.Square);
    await createConnectorElement(page, [100, 50], [200, 50]);

    await dragBetweenViewCoords(page, [140, 40], [160, 60]);
    await triggerComponentToolbarAction(page, 'changeConnectorShape');
    const straightBtn = locatorComponentToolbar(page).getByRole('button', {
      name: 'Straight',
    });
    await straightBtn.click();

    await assertConnectorPath(page, [
      [100, 50],
      [200, 50],
    ]);

    const [x, y] = await toViewCoord(page, [150, 50]);
    await page.mouse.dblclick(x, y);
    await type(page, 'label');
    await assertEdgelessCanvasText(page, 'label');
    await waitNextFrame(page);

    let [cx, cy] = await getEditorCenter(page);
    assertPointAlmostEqual([cx, cy], [x, y]);

    await page.mouse.click(0, 0);
    await waitNextFrame(page);

    await dragBetweenViewCoords(page, [150, 50], [130, 30]);

    await page.mouse.click(0, 0);
    await waitNextFrame(page);

    await page.mouse.dblclick(x - 20, y);
    await waitNextFrame(page);

    [cx, cy] = await getEditorCenter(page);
    assertPointAlmostEqual([cx, cy], [x - 20, y]);

    await page.mouse.click(0, 0);
    await waitNextFrame(page);

    await dragBetweenViewCoords(page, [130, 50], [170, 70]);

    await page.mouse.click(0, 0);
    await waitNextFrame(page);

    await page.mouse.dblclick(x + 20, y);
    await waitNextFrame(page);

    [cx, cy] = await getEditorCenter(page);
    assertPointAlmostEqual([cx, cy], [x + 20, y]);
  });

  test('should only move within constraints', async ({ page }) => {
    await commonSetup(page);

    await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
    await createShapeElement(page, [200, 0], [300, 100], Shape.Square);
    await createConnectorElement(page, [100, 50], [200, 50]);

    await assertConnectorPath(page, [
      [100, 50],
      [200, 50],
    ]);

    const [x, y] = await toViewCoord(page, [150, 50]);
    await page.mouse.dblclick(x, y);
    await type(page, 'label');
    await assertEdgelessCanvasText(page, 'label');
    await waitNextFrame(page);

    await page.mouse.click(0, 0);
    await waitNextFrame(page);

    await dragBetweenViewCoords(page, [150, 50], [300, 110]);

    await page.mouse.click(0, 0);
    await waitNextFrame(page);

    await page.mouse.dblclick(x + 55, y);
    await waitNextFrame(page);

    let [cx, cy] = await getEditorCenter(page);
    assertPointAlmostEqual([cx, cy], [x + 50, y]);

    await page.mouse.click(0, 0);
    await waitNextFrame(page);

    await dragBetweenViewCoords(page, [200, 50], [0, 50]);

    await page.mouse.click(0, 0);
    await waitNextFrame(page);

    await page.mouse.dblclick(x - 55, y);
    await waitNextFrame(page);

    [cx, cy] = await getEditorCenter(page);
    assertPointAlmostEqual([cx, cy], [x - 50, y]);
  });

  test('should automatically adjust position via offset distance', async ({
    page,
  }) => {
    await commonSetup(page);

    await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
    await createShapeElement(page, [200, 0], [300, 100], Shape.Square);
    await createConnectorElement(page, [100, 50], [200, 50]);

    await dragBetweenViewCoords(page, [140, 40], [160, 60]);
    await triggerComponentToolbarAction(page, 'changeConnectorShape');
    const straightBtn = locatorComponentToolbar(page).getByRole('button', {
      name: 'Straight',
    });
    await straightBtn.click();

    const point = [170, 50];
    const offsetDistance = calcOffsetDistance([100, 50], [200, 50], point);
    let [x, y] = await toViewCoord(page, point);
    await page.mouse.dblclick(x, y);
    await type(page, 'label');

    await page.mouse.click(0, 0);
    await waitNextFrame(page);

    await page.mouse.dblclick(x, y);
    await waitNextFrame(page);

    let [cx, cy] = await getEditorCenter(page);
    assertPointAlmostEqual([cx, cy], [x, y]);

    await page.mouse.click(0, 0);
    await waitNextFrame(page);

    await page.mouse.click(50, 50);
    await waitNextFrame(page);
    await dragBetweenViewCoords(page, [50, 50], [-50, 50]);
    await waitNextFrame(page);

    await page.mouse.click(0, 0);
    await waitNextFrame(page);

    await page.mouse.click(250, 50);
    await waitNextFrame(page);
    await dragBetweenViewCoords(page, [250, 50], [350, 50]);
    await waitNextFrame(page);

    const start = [0, 50];
    const end = [300, 50];
    const mx = start[0] + offsetDistance * (end[0] - start[0]);
    const my = start[1] + offsetDistance * (end[1] - start[1]);
    [x, y] = await toViewCoord(page, [mx, my]);

    await page.mouse.dblclick(x, y);
    await waitNextFrame(page);

    [cx, cy] = await getEditorCenter(page);
    assertPointAlmostEqual([cx, cy], [x, y]);
  });

  test('should enter the label editing state when pressing `Enter`', async ({
    page,
  }) => {
    await commonSetup(page);
    const start = { x: 100, y: 200 };
    const end = { x: 300, y: 300 };
    await addBasicConnectorElement(page, start, end);
    await page.mouse.click(105, 200);

    await page.keyboard.press('Enter');
    await type(page, ' a ');
    await assertEdgelessCanvasText(page, ' a ');
  });

  test('should exit the label editing state when pressing `Mod-Enter` or `Escape`', async ({
    page,
  }) => {
    await commonSetup(page);
    const start = { x: 100, y: 200 };
    const end = { x: 300, y: 300 };
    await addBasicConnectorElement(page, start, end);
    await page.mouse.click(105, 200);

    await page.keyboard.press('Enter');
    await type(page, ' a ');
    await assertEdgelessCanvasText(page, ' a ');

    await page.keyboard.press(`${SHORT_KEY}+Enter`);

    await page.keyboard.press('Enter');
    await type(page, 'b');
    await assertEdgelessCanvasText(page, 'b');

    await page.keyboard.press('Escape');

    await page.keyboard.press('Enter');
    await type(page, 'c');
    await assertEdgelessCanvasText(page, 'c');
  });
});

test.describe('quick connect', () => {
  test('should create a connector when clicking on button', async ({
    page,
  }) => {
    await commonSetup(page);

    await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
    const [x, y] = await toViewCoord(page, [50, 50]);
    await page.mouse.click(x, y);

    const quickConnectBtn = page.getByRole('button', {
      name: 'Draw connector',
    });

    await expect(quickConnectBtn).toBeVisible();
    await quickConnectBtn.click();
    await expect(quickConnectBtn).toBeHidden();

    await assertConnectorPath(page, [
      [100, 50],
      [x, y],
    ]);
  });

  test('should be uncreated if the target is not found after clicking', async ({
    page,
  }) => {
    await commonSetup(page);

    await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
    const [x, y] = await toViewCoord(page, [50, 50]);
    await page.mouse.click(x, y);

    const quickConnectBtn = page.getByRole('button', {
      name: 'Draw connector',
    });

    const bounds = await quickConnectBtn.boundingBox();
    assertExists(bounds);

    await quickConnectBtn.click();

    await page.mouse.click(bounds.x, bounds.y);
    await assertEdgelessSelectedRect(page, [x - 50, y - 50, 100, 100]);
  });

  test('should be uncreated if the target is not found after pressing ESC', async ({
    page,
  }) => {
    await commonSetup(page);

    await createShapeElement(page, [0, 0], [100, 100], Shape.Square);

    // select shape
    const [x, y] = await toViewCoord(page, [50, 50]);
    await page.mouse.click(x, y);

    // click button
    await triggerComponentToolbarAction(page, 'quickConnect');

    await page.keyboard.press('Escape');

    await assertEdgelessNonSelectedRect(page);
  });

  test('should be connected if the target is found', async ({ page }) => {
    await commonSetup(page);

    await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
    await createShapeElement(page, [200, 0], [300, 100], Shape.Square);

    // select shape
    const [x, y] = await toViewCoord(page, [50, 50]);
    await page.mouse.click(x, y);

    // click button
    await triggerComponentToolbarAction(page, 'quickConnect');

    // click target
    const [tx, ty] = await toViewCoord(page, [200, 50]);
    await page.mouse.click(tx, ty);

    await assertConnectorPath(page, [
      [100, 50],
      [200, 50],
    ]);
  });

  test('should follow the mouse to automatically select the starting point', async ({
    page,
  }) => {
    await commonSetup(page);

    await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
    const shapeBounds = await toViewCoord(page, [0, 0]);

    // select shape
    const [x, y] = await toViewCoord(page, [50, 50]);
    await page.mouse.click(x, y);

    // click button
    const quickConnectBtn = page.getByRole('button', {
      name: 'Draw connector',
    });
    const bounds = await quickConnectBtn.boundingBox();
    assertExists(bounds);
    await quickConnectBtn.click();

    // at right
    let point: [number, number] = [bounds.x, bounds.y];
    let endpoint = await toModelCoord(page, point);
    await assertConnectorPath(page, [[100, 50], endpoint]);

    // at top
    point = [shapeBounds[0] + 50, shapeBounds[1] - 50];
    endpoint = await toModelCoord(page, point);
    await page.mouse.move(...point);
    await waitNextFrame(page);
    await assertConnectorPath(page, [[50, 0], endpoint]);

    // at left
    point = [shapeBounds[0] - 50, shapeBounds[1] + 50];
    endpoint = await toModelCoord(page, point);
    await page.mouse.move(...point);
    await assertConnectorPath(page, [[0, 50], endpoint]);

    // at bottom
    point = [shapeBounds[0] + 50, shapeBounds[1] + 100 + 50];
    endpoint = await toModelCoord(page, point);
    await page.mouse.move(...point);
    await assertConnectorPath(page, [[50, 100], endpoint]);
  });

  test.describe('groups connections', () => {
    async function groupsSetup(page: Page) {
      await commonSetup(page);

      // group 1
      await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
      await createShapeElement(page, [100, 100], [200, 200], Shape.Square);
      await selectAllByKeyboard(page);
      await triggerComponentToolbarAction(page, 'addGroup');

      // group 2
      await createShapeElement(page, [500, 0], [600, 100], Shape.Square);
      await createShapeElement(page, [600, 100], [700, 200], Shape.Square);
      await dragBetweenViewCoords(page, [550, -50], [650, 250]);
      await triggerComponentToolbarAction(page, 'addGroup');

      await waitNextFrame(page);
    }

    test('should connect to other groups', async ({ page }) => {
      await groupsSetup(page);

      // click button
      await triggerComponentToolbarAction(page, 'quickConnect');

      // move to group 1
      await moveView(page, [200, 50]);
      await waitNextFrame(page);

      await assertConnectorPath(page, [
        [500, 100],
        [200, 50],
      ]);
    });

    test('should connect to elements within other groups', async ({ page }) => {
      await groupsSetup(page);

      // click button
      await triggerComponentToolbarAction(page, 'quickConnect');

      // move to group 1
      await moveView(page, [200, 100]);
      await waitNextFrame(page);

      await assertConnectorPath(page, [
        [500, 100],
        [200, 100],
      ]);

      // move to elements within group 1
      await moveView(page, [190, 150]);
      await waitNextFrame(page);

      await assertConnectorPath(page, [
        [500, 100],
        [200, 150],
      ]);
    });

    test('elements within groups should connect to other groups', async ({
      page,
    }) => {
      await groupsSetup(page);

      // click elements within group 1
      await clickView(page, [40, 40]);
      await clickView(page, [60, 60]);

      // click button
      await triggerComponentToolbarAction(page, 'quickConnect');

      // move to elements within group 2
      await moveView(page, [610, 50]);
      await waitNextFrame(page);

      await assertConnectorPath(page, [
        [100, 50],
        [600, 50],
      ]);

      // move to group 2
      await moveView(page, [600, 100]);
      await waitNextFrame(page);

      await assertConnectorPath(page, [
        [100, 50],
        [600, 100],
      ]);
    });
  });
});
