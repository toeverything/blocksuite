/* eslint-disable @typescript-eslint/no-restricted-imports */
import { expect, Page, test } from '@playwright/test';
import type {
  GroupBlockModel,
  ShapeBlockModel,
} from '../packages/blocks/src/index.js';
import {
  dragBetweenCoords,
  enterPlaygroundRoom,
  focusRichText,
  initEmptyParagraphState,
  pressEnter,
  redoByClick,
  switchMode,
  switchMouseMode,
  switchShapeColor,
  switchShapeType,
  undoByClick,
  waitNextFrame,
} from './utils/actions/index.js';
import {
  assertNativeSelectionRangeCount,
  assertRichTexts,
  assertSelection,
} from './utils/asserts.js';
import type { BaseBlockModel } from '../packages/store/src/index.js';

async function getGroupSize(
  page: Page,
  ids: { pageId: string; groupId: string; paragraphId: string }
) {
  const result: string | null = await page.evaluate(
    ([id]) => {
      const page = window.workspace.getPage('page0');
      const block = page?.getBlockById(id.groupId);
      if (block?.flavour === 'affine:group') {
        return (block as GroupBlockModel).xywh;
      } else {
        return null;
      }
    },
    [ids] as const
  );
  expect(result).not.toBeNull();
  return result as string;
}

async function getModel<Model extends BaseBlockModel>(
  page: Page,
  blockId: string
) {
  const result: BaseBlockModel | null | undefined = await page.evaluate(
    blockId => {
      const page = window.workspace.getPage('page0');
      return page?.getBlockById(blockId);
    },
    blockId
  );
  expect(result).not.toBeNull();
  return result as Model;
}

test('switch to edgeless mode', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await page.keyboard.type('hello');
  await assertRichTexts(page, ['hello']);
  await assertSelection(page, 0, 5, 0);

  await switchMode(page);
  const locator = page.locator('.affine-edgeless-page-block-container');
  await expect(locator).toHaveCount(1);
  await assertRichTexts(page, ['hello']);

  await waitNextFrame(page);
  await assertNativeSelectionRangeCount(page, 1);
});

test('cursor for active and inactive state', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await page.keyboard.type('hello');
  await pressEnter(page);
  await pressEnter(page);
  await assertRichTexts(page, ['hello', '\n', '\n']);

  // inactive
  await switchMode(page);
  await undoByClick(page);
  await waitNextFrame(page);
  await assertNativeSelectionRangeCount(page, 0);

  await redoByClick(page);
  await waitNextFrame(page);
  await assertNativeSelectionRangeCount(page, 0);

  // active
  await page.mouse.dblclick(450, 300);
  await waitNextFrame(page);
  await assertNativeSelectionRangeCount(page, 1);

  await undoByClick(page);
  await waitNextFrame(page);
  await assertNativeSelectionRangeCount(page, 1);
});

test('resize the block', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const ids = await initEmptyParagraphState(page);
  await focusRichText(page);
  await page.keyboard.type('hello');
  await assertRichTexts(page, ['hello']);

  await switchMode(page);
  await page.click('[data-block-id="1"]');
  const oldXywh = await getGroupSize(page, ids);
  const leftHandle = page.locator('[aria-label="handle-left"]');
  const box = await leftHandle.boundingBox();
  if (box === null) throw new Error();

  await dragBetweenCoords(
    page,
    { x: box.x + 5, y: box.y + 5 },
    { x: box.x + 105, y: box.y + 5 }
  );
  const xywh = await getGroupSize(page, ids);
  const [oldX, oldY, oldW, oldH] = JSON.parse(oldXywh);
  const [x, y, w, h] = JSON.parse(xywh);
  expect(x).toBe(oldX + 100);
  expect(y).toBe(oldY);
  expect(w).toBe(oldW - 100);
  expect(h).toBe(oldH);

  await switchMode(page);
  await switchMode(page);
  const newXywh = await getGroupSize(page, ids);
  expect(newXywh).toBe(xywh);
});

test('add shape blocks', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await page.keyboard.type('hello');
  await assertRichTexts(page, ['hello']);

  await switchMode(page);
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

  const shapeModel = await getModel<ShapeBlockModel>(page, '3');
  expect(JSON.parse(shapeModel.xywh)).toStrictEqual([0, 0, 100, 100]);
  expect(shapeModel.color).toBe('black');
  expect(shapeModel.type).toBe('rectangle');
  const shapeModel2 = await getModel<ShapeBlockModel>(page, '4');
  expect(JSON.parse(shapeModel2.xywh)).toStrictEqual([0, 0, 200, 200]);
  expect(shapeModel2.color).toBe('blue');
  expect(shapeModel2.type).toBe('triangle');

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

test('delete shape block by keyboard', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await switchMode(page);
  await switchMouseMode(page);
  await dragBetweenCoords(page, { x: 100, y: 100 }, { x: 200, y: 200 });

  await switchMouseMode(page);
  const rect = await page.evaluate(() =>
    window.std.getShapeBlockHitBox('3')?.getBoundingClientRect()
  );
  await page.keyboard.press('Delete', {
    delay: 10,
  });
});
