/* eslint-disable @typescript-eslint/no-restricted-imports */

import { assertExists } from '@blocksuite/global/utils';
import { expect, Page } from '@playwright/test';

import type { FrameBlockModel } from '../packages/blocks/src/index.js';
import {
  assertEdgelessHoverRect,
  clickBlockById,
  dragBetweenCoords,
  enterPlaygroundRoom,
  focusRichText,
  initEmptyEdgelessState,
  pressEnter,
  redoByClick,
  switchEditorMode,
  switchMouseMode,
  switchShapeColor,
  switchShapeType,
  type,
  undoByClick,
  waitNextFrame,
} from './utils/actions/index.js';
import {
  assertNativeSelectionRangeCount,
  assertRichTexts,
  assertSelection,
} from './utils/asserts.js';
import { test } from './utils/playwright.js';

async function getFrameSize(
  page: Page,
  ids: { pageId: string; frameId: string; paragraphId: string }
) {
  const result: string | null = await page.evaluate(
    ([id]) => {
      const page = window.workspace.getPage('page0');
      const block = page?.getBlockById(id.frameId);
      if (block?.flavour === 'affine:frame') {
        return (block as FrameBlockModel).xywh;
      } else {
        return null;
      }
    },
    [ids] as const
  );
  expect(result).not.toBeNull();
  return result as string;
}

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

test('cursor for active and inactive state', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await focusRichText(page);
  await type(page, 'hello');
  await pressEnter(page);
  await pressEnter(page);
  await assertRichTexts(page, ['hello', '\n', '\n']);

  // inactive
  await switchEditorMode(page);
  await undoByClick(page);
  await waitNextFrame(page);

  await redoByClick(page);
  await waitNextFrame(page);

  // active
  await page.mouse.dblclick(450, 300);
  await waitNextFrame(page);
  await assertNativeSelectionRangeCount(page, 1);

  await undoByClick(page);
  await waitNextFrame(page);
  await assertNativeSelectionRangeCount(page, 1);
});

test('resize block in edgeless mode', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const ids = await initEmptyEdgelessState(page);
  await focusRichText(page);
  await type(page, 'hello');
  await assertRichTexts(page, ['hello']);

  await switchEditorMode(page);
  await page.mouse.move(100, 100); // FIXME: no update until mousemove

  expect(ids.frameId).toBe('2'); // 0 for page, 1 for surface
  await clickBlockById(page, ids.frameId);

  const oldXywh = await getFrameSize(page, ids);
  const leftHandle = page.locator('[aria-label="handle-left"]');
  const box = await leftHandle.boundingBox();
  if (box === null) throw new Error();

  await dragBetweenCoords(
    page,
    { x: box.x + 5, y: box.y + 5 },
    { x: box.x + 105, y: box.y + 5 }
  );
  const xywh = await getFrameSize(page, ids);
  const [oldX, oldY, oldW, oldH] = JSON.parse(oldXywh);
  const [x, y, w, h] = JSON.parse(xywh);
  expect(x).toBe(oldX + 100);
  expect(y).toBe(oldY);
  expect(w).toBe(oldW - 100);
  expect(h).toBe(oldH);

  await switchEditorMode(page);
  await switchEditorMode(page);
  const newXywh = await getFrameSize(page, ids);
  expect(newXywh).toBe(xywh);
});

test.skip('add shape blocks', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await focusRichText(page);
  await type(page, 'hello');
  await assertRichTexts(page, ['hello']);

  await switchEditorMode(page);
  await switchMouseMode(page);
  const box = await page
    .locator('[data-test-id="affine-edgeless-block-child-1-container"]')
    ?.boundingBox();
  if (!box) {
    throw new Error('box is null');
  }
  const { x, y } = box;
  await dragBetweenCoords(page, { x, y }, { x: x + 100, y: y + 100 });
  await switchShapeColor(page, 'blue');
  await switchShapeType(page, 'triangle');
  await dragBetweenCoords(page, { x, y }, { x: x + 200, y: y + 200 });

  await switchMouseMode(page);

  /*
  const shapeModel = await getModel<ShapeBlockModel>(page, '3');
  expect(JSON.parse(shapeModel.xywh)).toStrictEqual([0, 0, 100, 100]);
  expect(shapeModel.color).toBe('black');
  expect(shapeModel.type).toBe('rectangle');
  const shapeModel2 = await getModel<ShapeBlockModel>(page, '4');
  expect(JSON.parse(shapeModel2.xywh)).toStrictEqual([0, 0, 200, 200]);
  expect(shapeModel2.color).toBe('blue');
  expect(shapeModel2.type).toBe('triangle');
  */

  const tag = await page.evaluate(() => {
    const element = document.querySelector(`[data-block-id="3"]`);
    return element?.tagName;
  });
  expect(tag).toBe('AFFINE-SHAPE');

  await page.mouse.move(100, 100);
  await page.mouse.wheel(10, 10);
  const newBox = await page
    .locator('[data-test-id="affine-edgeless-block-child-1-container"]')
    ?.boundingBox();
  if (!newBox) {
    throw new Error('box is null');
  }
  // TODO: detect the offset precisely because delta is different between different `window.devicePixelRatio`.
  //  Refs: https://bugzilla.mozilla.org/show_bug.cgi?id=970141
  expect(newBox.x).toBeLessThan(box.x);
  expect(newBox.y).toBeLessThan(box.y);
  await assertRichTexts(page, ['hello']);
});

test.skip('delete shape block by keyboard', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);

  await switchEditorMode(page);
  await switchMouseMode(page);
  await dragBetweenCoords(page, { x: 100, y: 100 }, { x: 200, y: 200 });

  await switchMouseMode(page);
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
  await page.waitForTimeout(50);
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

  const shapeTool = page.locator('.icon-container[data-test-id="shape"]');
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

  await focusRichText(page);

  await type(page, 'hello');
  await pressEnter(page);
  await type(page, 'world');
  await pressEnter(page);
  await type(page, 'foo');

  await switchEditorMode(page);

  await page.click('.affine-edgeless-block-child');
  // 0 for page, 1 for surface, 2 for frame, 3 for paragraph
  expect(ids.paragraphId).toBe('3');
  await clickBlockById(page, ids.paragraphId);

  await page.keyboard.press('ArrowDown');
  await assertSelection(page, 1, 4, 0);

  await page.keyboard.press('ArrowUp');
  await assertSelection(page, 0, 4, 0);

  await page.keyboard.press('ArrowUp');
  await assertSelection(page, 0, 4, 0);
});

test('selection box of shape element sync on fast dragging', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  await switchMouseMode(page);
  await dragBetweenCoords(page, { x: 100, y: 100 }, { x: 200, y: 200 });
  await switchMouseMode(page);
  await dragBetweenCoords(
    page,
    { x: 150, y: 150 },
    { x: 700, y: 500 },
    { click: true }
  );

  await assertEdgelessHoverRect(page, 650, 450, 100, 100);
});

test('hover state for shape element', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  await switchMouseMode(page);
  await dragBetweenCoords(page, { x: 100, y: 100 }, { x: 200, y: 200 });
  await switchMouseMode(page);

  await page.mouse.move(150, 150);
  await assertEdgelessHoverRect(page, 100, 100, 100, 100);
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

  await switchMouseMode(page);
  await dragBetweenCoords(page, { x, y }, { x: x + 100, y: y + 100 });
  await switchMouseMode(page);

  await page.mouse.move(x + 50, y + 50);
  await assertEdgelessHoverRect(page, x, y, 100, 100);
});
