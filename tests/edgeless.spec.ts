import { test, expect, Page } from '@playwright/test';
import type { GroupBlockModel } from '../packages/blocks/src/group-block/group-model';
import {
  dragBetweenCoords,
  enterPlaygroundRoom,
  focusRichText,
  initEmptyParagraphState,
  pressEnter,
  redoByClick,
  switchMode,
  switchMouseMode,
  undoByClick,
  waitNextFrame,
} from './utils/actions';
import {
  assertNativeSelectionRangeCount,
  assertRichTexts,
  assertSelection,
} from './utils/asserts';

async function getGroupSize(
  page: Page,
  ids: { pageId: string; groupId: string; paragraphId: string }
) {
  const result = await page.evaluate(
    ([id]) => {
      const block = window.workspace
        .getPage('page0')
        .getBlockById(id.groupId) as GroupBlockModel;
      return block.xywh;
    },
    [ids] as const
  );
  return result;
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
  await page.click('[test-id="1"]');
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

test('add shape block', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await page.keyboard.type('hello');
  await assertRichTexts(page, ['hello']);

  await switchMode(page);
  await switchMouseMode(page);
  const locator = await page.locator('[test-id="1"]');
  if (!locator) throw new Error();
  const box = await locator.boundingBox();
  if (!box) throw new Error();
  const { x, y } = box;
  await dragBetweenCoords(page, { x, y }, { x: x + 100, y: y + 100 });

  await switchMouseMode(page);
  const tag = await page.evaluate(() => {
    const element = document.querySelector(`[data-block-id="3"]`);
    return element?.tagName;
  });
  expect(tag).toBe('SHAPE-BLOCK');
  await assertRichTexts(page, ['hello']);
});
