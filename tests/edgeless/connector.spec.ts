import { expect } from '@playwright/test';

import {
  addBasicConnectorElement,
  changeConnectorStrokeColor,
  changeConnectorStrokeStyle,
  changeConnectorStrokeWidth,
  locatorConnectorStrokeStyleButton,
  locatorConnectorStrokeWidthButton,
  pickColorAtPoints,
  resizeConnectorByStartCapitalHandler,
  switchEditorEmbedMode,
  switchEditorMode,
  triggerComponentToolbarAction,
} from '../utils/actions/edgeless.js';
import {
  addBasicRectShapeElement,
  dragBetweenCoords,
  enterPlaygroundRoom,
  initEmptyEdgelessState,
  resizeElementByTopLeftHandle,
  waitNextFrame,
} from '../utils/actions/index.js';
import {
  assertEdgelessHoverRect,
  assertEdgelessSelectedRect,
} from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

test('add connector element', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  const start = { x: 100, y: 100 };
  const end = { x: 200, y: 200 };

  await addBasicConnectorElement(page, start, end);

  await page.mouse.move(start.x + 5, start.y + 5);
  await assertEdgelessHoverRect(page, [98, 98, 104, 107]);
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
  await assertEdgelessHoverRect(page, [148, 198, 157, 104]);

  const connector2 = {
    start: { x: 170, y: 150 },
    end: { x: 300, y: 170 },
  };
  // start point in rect and not be fixed
  await addBasicConnectorElement(page, connector2.start, connector2.end);

  await page.mouse.move(connector2.end.x - 5, connector2.end.y - 5);
  await assertEdgelessHoverRect(page, [168, 148, 137, 24]);
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
  await assertEdgelessHoverRect(page, [148, 198, 157, 104]);

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
  await assertEdgelessHoverRect(page, [178, 228, 127, 74]);
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
  await assertEdgelessHoverRect(page, [148, 198, 157, 104]);

  await page.mouse.click(rect.start.x + 5, rect.start.y + 5);
  await resizeElementByTopLeftHandle(page, { x: 20, y: 0 });

  await page.mouse.move(connector.end.x - 5, connector.end.y - 5);
  await assertEdgelessHoverRect(page, [158, 198, 147, 104]);
});

test('resize connector by capital resize handler', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  const start = { x: 100, y: 100 };
  const end = { x: 200, y: 200 };

  await addBasicConnectorElement(page, start, end);

  await page.mouse.move(start.x + 5, start.y + 5);
  await assertEdgelessHoverRect(page, [98, 98, 104, 107]);

  await page.mouse.click(start.x + 5, start.y + 5);

  await resizeConnectorByStartCapitalHandler(page, { x: -20, y: -20 }, 10);
  await assertEdgelessSelectedRect(page, [78, 78, 124, 127]);
});

test('resize connector by capital resize handler in embed mode', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);
  await switchEditorEmbedMode(page);

  const start = { x: 100, y: 100 };
  const end = { x: 200, y: 200 };

  await addBasicConnectorElement(page, start, end);

  await page.mouse.move(start.x + 5, start.y + 5);
  await assertEdgelessHoverRect(page, [98, 98, 104, 107]);

  await page.mouse.click(start.x + 5, start.y + 5);

  await resizeConnectorByStartCapitalHandler(page, { x: -20, y: -20 }, 10);
  await assertEdgelessSelectedRect(page, [78, 78, 124, 127]);
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
