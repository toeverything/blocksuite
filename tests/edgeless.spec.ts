import { test, expect } from '@playwright/test';
import type { GroupBlockModel } from '../packages/blocks/src/group-block/group-model';
import {
  dragBetweenCoords,
  enterPlaygroundRoom,
  focusRichText,
  initEmptyState,
  pressEnter,
  redoByClick,
  switchMode,
  undoByClick,
  waitNextFrame,
} from './utils/actions';
import {
  assertNativeSelectionRangeCount,
  assertRichTexts,
  assertSelection,
} from './utils/asserts';

test('switch to edgeless mode', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyState(page);
  await focusRichText(page);
  await page.keyboard.type('hello');
  await assertRichTexts(page, ['hello']);
  await assertSelection(page, 0, 5, 0);

  await switchMode(page);
  const locator = page.locator('.affine-edgeless-page-block-container');
  await expect(locator).toHaveCount(1);
  await assertRichTexts(page, ['hello']);

  await waitNextFrame(page);
  await assertNativeSelectionRangeCount(page, 0);
});

test('cursor for active and inactive state', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyState(page);
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
  const id = await initEmptyState(page);
  await focusRichText(page);
  await page.keyboard.type('hello');
  await assertRichTexts(page, ['hello']);
  await switchMode(page);
  await page.click('[test-id="1"]');
  const oldXywh = await page.evaluate(id => {
    const block = window.workspace.pages
      .get('space:page0')
      ?.getBlockById(id.groupId) as GroupBlockModel;
    return block.xywh;
  }, id);
  const lefthandle = await page.locator('[aria-label="handle-left"]');
  const box = await lefthandle.boundingBox();
  expect(box).not.toBeNull();
  if (box === null) {
    throw new Error();
  }
  await dragBetweenCoords(
    page,
    { x: box.x + 5, y: box.y + 5 },
    { x: box.x + 105, y: box.y + 5 }
  );
  const xywh = await page.evaluate(
    ([id, oldXywh]) => {
      const block = window.workspace.pages
        .get('space:page0')
        ?.getBlockById(id.groupId) as GroupBlockModel;
      return block.xywh;
    },
    [id, oldXywh] as const
  );
  const [oldX, oldY, oldW, oldH] = JSON.parse(oldXywh);
  const [x, y, w, h] = JSON.parse(xywh);
  expect(x).toBe(oldX + 100);
  expect(y).toBe(oldY);
  expect(w).toBe(oldW - 100);
  expect(h).toBe(oldH);
  await switchMode(page);
  await switchMode(page);
  const newXywh = await page.evaluate(
    ([id]) => {
      const block = window.workspace.pages
        .get('space:page0')
        ?.getBlockById(id.groupId) as GroupBlockModel;
      return block.xywh;
    },
    [id, oldXywh] as const
  );
  expect(newXywh).toBe(xywh);
});
