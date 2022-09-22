import { test } from '@playwright/test';
import {
  emptyInput,
  enterPlaygroundRoom,
  mouseDragFromTo,
} from './utils/actions';
import { assertSelectBlocks } from './utils/asserts';

test(' select blocks ', async ({ page }) => {
  await enterPlaygroundRoom(page);

  await page.click(emptyInput);
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  const fromTo = await page.evaluate(() => {
    const textBoxes = document.querySelectorAll('rich-text');
    const firstTextBox = textBoxes[0];
    const lastTextBox = textBoxes[textBoxes.length - 1];
    const { left: x1, top: y1 } = firstTextBox.getBoundingClientRect();
    const { left: x2, bottom: y2 } = lastTextBox.getBoundingClientRect();
    return [
      { x: Math.floor(x1) - 5, y: Math.floor(y1) - 5 },
      { x: Math.floor(x2) + 40, y: Math.floor(y2) - 10 },
    ];
  });
  await mouseDragFromTo(page, fromTo[0], fromTo[1]);
  await assertSelectBlocks(page, 3);
  await page.pause();
});
