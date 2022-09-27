import { test } from '@playwright/test';
import {
  enterPlaygroundRoom,
  focusRichText,
  getQuillSelectionIndex,
  getQuillSelectionText,
  mouseDragFromTo,
  pressEnter,
  shiftTab,
} from './utils/actions';
import { assertSelectedBlockCount } from './utils/asserts';
import { expect } from '@playwright/test';

test('drag to select blocks', async ({ page }) => {
  await enterPlaygroundRoom(page);

  await focusRichText(page);
  await pressEnter(page);
  await pressEnter(page);

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
  await assertSelectedBlockCount(page, 3);
});

test('cursor move up and down', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);
  await page.keyboard.type('arrow down test 1');
  await pressEnter(page);
  await page.keyboard.type('arrow down test 2');
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('ArrowLeft');
  }
  await page.keyboard.press('ArrowUp');
  const indexOne = await getQuillSelectionIndex(page);
  const textOne = await getQuillSelectionText(page);
  expect(indexOne).toBe(14);
  expect(textOne).toBe('arrow down test 1\n');
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('ArrowLeft');
  }
  await page.keyboard.press('ArrowDown');
  const indexTwo = await getQuillSelectionIndex(page);
  const textTwo = await getQuillSelectionText(page);
  expect(indexTwo).toBe(11);
  expect(textTwo).toBe('arrow down test 2\n');
});


test('cursor move to up and down with children block', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);
  await page.keyboard.type('arrow down test 1');
  await pressEnter(page);
  await page.keyboard.type('arrow down test 2');
  await page.keyboard.press('Tab');
  for (let i = 0; i <= 17; i++) {
    await page.keyboard.press('ArrowRight');
  }
  await pressEnter(page);
  await page.keyboard.type('arrow down test 3');
  await shiftTab(page);
  for (let i = 0; i < 2; i++) {
    await page.keyboard.press('ArrowRight');
  }
  await page.keyboard.press('ArrowUp');
  const indexOne = await getQuillSelectionIndex(page);
  const textOne = await getQuillSelectionText(page);
  expect(textOne).toBe('arrow down test 2\n');
  expect(indexOne).toBe(0);
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('ArrowLeft');
  }
  await page.keyboard.press('ArrowUp');
  const indexTwo = await getQuillSelectionIndex(page);
  const textTwo = await getQuillSelectionText(page);
  expect(textTwo).toBe('arrow down test 1\n');
  expect(indexTwo).toBeGreaterThanOrEqual(12);
  expect(indexTwo).toBeLessThanOrEqual(17);
  await page.keyboard.press('ArrowDown');
  const textThree = await getQuillSelectionText(page);
  expect(textThree).toBe('arrow down test 2\n');
});

test('cursor move left and right', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);
  await page.keyboard.type('arrow down test 1');
  await pressEnter(page);
  await page.keyboard.type('arrow down test 2');
  for (let i = 0; i < 18; i++) {
    await page.keyboard.press('ArrowLeft');
  }
  const indexOne = await getQuillSelectionIndex(page);
  expect(indexOne).toBe(17);
  await page.keyboard.press('ArrowRight');
  const indexTwo = await getQuillSelectionIndex(page);
  expect(indexTwo).toBe(0);
});