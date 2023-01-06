import { test, expect } from '@playwright/test';
import {
  enterPlaygroundRoom,
  initEmptyParagraphState,
  initThreeParagraphs,
} from './utils/actions/index.js';
import { assertRichTexts } from './utils/asserts.js';

test('only have one drag handle in screen', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  const topLeft = await page.evaluate(() => {
    const paragraph = document.querySelector('[data-block-id="2"]');
    const bbox = paragraph?.getBoundingClientRect() as DOMRect;
    return { x: bbox.left, y: bbox.top + 2 };
  }, []);

  const rightBottom = await page.evaluate(() => {
    const paragraph = document.querySelector('[data-block-id="4"]');
    const bbox = paragraph?.getBoundingClientRect() as DOMRect;
    return { x: bbox.right, y: bbox.bottom - 2 };
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
  expect(length2).toBe(1);
});
