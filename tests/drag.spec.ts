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
  expect(length2).toBe(1);
});

test('move drag handle', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);
  const handle = await page.locator('affine-drag-handle').boundingBox();
  const paragraph = await page.locator('[data-block-id="4"]').boundingBox();
  if (!handle || !paragraph) {
    throw new Error();
  }
  await page.mouse.click(
    handle.x + handle.width / 2,
    handle.y + handle.height / 2
  );
  await page.mouse.move(
    handle.x + handle.width / 2,
    handle.y + handle.height / 2
  );
  await page.mouse.down();
  await page.mouse.move(
    paragraph.x + paragraph.width / 2,
    paragraph.y + paragraph.height / 2,
    {
      steps: 50,
    }
  );
  await page.mouse.up();

  await assertRichTexts(page, ['456', '123', '789']);
});
