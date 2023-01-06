import { test, expect } from '@playwright/test';
import {
  dragHandleFromBlockToBlockBottomById,
  enterPlaygroundRoom,
  initEmptyParagraphState,
  initThreeLists,
  initThreeParagraphs,
} from './utils/actions/index.js';
import { assertRichTexts } from './utils/asserts.js';

test('only have one drag handle in screen', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  const topLeft = await page.evaluate(() => {
    const paragraph = document.querySelector('[data-block-id="2"]');
    const box = paragraph?.getBoundingClientRect();
    if (!box) {
      throw new Error();
    }
    return { x: box.left, y: box.top + 2 };
  }, []);

  const rightBottom = await page.evaluate(() => {
    const paragraph = document.querySelector('[data-block-id="4"]');
    const box = paragraph?.getBoundingClientRect();
    if (!box) {
      throw new Error();
    }
    return { x: box.right, y: box.bottom - 2 };
  }, []);

  await page.mouse.move(topLeft.x, topLeft.y);
  const length1 = await page.evaluate(() => {
    const handles = document.querySelectorAll('affine-drag-handle');
    return handles.length;
  }, []);
  expect(length1).toBe(1);
  await page.mouse.move(rightBottom.x, rightBottom.y);
  const length2 = await page.evaluate(() => {
    const handles = document.querySelectorAll('affine-drag-handle');
    return handles.length;
  }, []);
  expect(await page.locator('affine-drag-indicator').count()).toBe(0);
  expect(length2).toBe(1);
});

test('move drag handle in paragraphs', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);
  await dragHandleFromBlockToBlockBottomById(page, '2', '4');
  expect(await page.locator('affine-drag-indicator').count()).toBe(0);
  await assertRichTexts(page, ['456', '789', '123']);
});

test('move drag handle in list', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeLists(page);
  await assertRichTexts(page, ['123', '456', '789']);
  await dragHandleFromBlockToBlockBottomById(page, '5', '3', false);
  expect(await page.locator('affine-drag-indicator').count()).toBe(0);
  await assertRichTexts(page, ['789', '123', '456']);
});
