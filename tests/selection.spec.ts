import { test } from '@playwright/test';
import {
  enterPlaygroundRoom,
  focusRichText,
  getQuillSelectionIndex,
  getQuillSelectionText,
  dragBetweenCoords,
  pressEnter,
  pressShiftTab,
  getCursorBlockIdAndHeight,
  fillLine,
  addGroupByClick,
  initThreeParagraphs,
  initEmptyState,
  undoByKeyboard,
  resetHistory,
  redoByKeyboard,
  undoByClick,
  redoByClick,
  clearLog,
  waitNextFrame,
  selectAllByKeyboard,
  dragBetweenIndices,
} from './utils/actions';
import { expect } from '@playwright/test';
import {
  assertBlockCount,
  assertRichTexts,
  assertSelection,
} from './utils/asserts';

test('click on blank area', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  const above123 = await page.evaluate(() => {
    const paragraph = document.querySelector('[data-block-id="2"] p');
    const bbox = paragraph?.getBoundingClientRect() as DOMRect;
    return { x: bbox.left, y: bbox.top + 5 };
  });
  await page.mouse.click(above123.x, above123.y);
  await assertSelection(page, 0, 0, 0);

  const above456 = await page.evaluate(() => {
    const paragraph = document.querySelector('[data-block-id="3"] p');
    const bbox = paragraph?.getBoundingClientRect() as DOMRect;
    return { x: bbox.left, y: bbox.top + 5 };
  });
  await page.mouse.click(above456.x, above456.y);
  await assertSelection(page, 1, 0, 0);

  const below789 = await page.evaluate(() => {
    const paragraph = document.querySelector('[data-block-id="4"] p');
    const bbox = paragraph?.getBoundingClientRect() as DOMRect;
    return { x: bbox.left, y: bbox.bottom - 5 };
  });
  await page.mouse.click(below789.x, below789.y);
  await assertSelection(page, 2, 0, 0);
});

test('native range delete', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  const topLeft123 = await page.evaluate(() => {
    const paragraph = document.querySelector('[data-block-id="2"] p');
    const bbox = paragraph?.getBoundingClientRect() as DOMRect;
    return { x: bbox.left, y: bbox.top - 2 };
  });

  const bottomRight789 = await page.evaluate(() => {
    const paragraph = document.querySelector('[data-block-id="4"] p');
    const bbox = paragraph?.getBoundingClientRect() as DOMRect;
    return { x: bbox.right, y: bbox.bottom };
  });

  // from top to bottom
  await dragBetweenCoords(page, topLeft123, bottomRight789);
  await page.keyboard.press('Backspace');
  await assertBlockCount(page, 'paragraph', 1);
  await assertRichTexts(page, ['\n']);

  await waitNextFrame(page);
  await undoByKeyboard(page);
  // FIXME
  // await assertRichTexts(page, ['123', '456', '789']);

  await redoByKeyboard(page);
  await assertRichTexts(page, ['\n']);
});

test('native range selection backwards', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  const topLeft123 = await page.evaluate(() => {
    const paragraph = document.querySelector('[data-block-id="2"] p');
    const bbox = paragraph?.getBoundingClientRect() as DOMRect;
    return { x: bbox.left, y: bbox.top - 2 };
  });

  const bottomRight789 = await page.evaluate(() => {
    const paragraph = document.querySelector('[data-block-id="4"] p');
    const bbox = paragraph?.getBoundingClientRect() as DOMRect;
    return { x: bbox.right, y: bbox.bottom };
  });

  // from bottom to top
  await dragBetweenCoords(page, bottomRight789, topLeft123);
  await page.keyboard.press('Backspace');
  await assertBlockCount(page, 'paragraph', 1);
  await assertRichTexts(page, ['\n']);

  await waitNextFrame(page);
  await undoByKeyboard(page);
  // FIXME
  // await assertRichTexts(page, ['123', '456', '789']);

  await redoByKeyboard(page);
  await assertRichTexts(page, ['\n']);
});

test('block level range delete', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);
  await resetHistory(page);

  const above123 = await page.evaluate(() => {
    const paragraph = document.querySelector('[data-block-id="2"] p');
    const bbox = paragraph?.getBoundingClientRect() as DOMRect;
    return { x: bbox.left, y: bbox.top - 10 };
  });

  const below789 = await page.evaluate(() => {
    const paragraph = document.querySelector('[data-block-id="4"] p');
    const bbox = paragraph?.getBoundingClientRect() as DOMRect;
    return { x: bbox.right - 10, y: bbox.bottom + 10 };
  });

  await dragBetweenCoords(page, below789, above123);
  await page.keyboard.press('Backspace');
  await assertBlockCount(page, 'paragraph', 1);
  await assertRichTexts(page, ['\n']);

  await waitNextFrame(page);
  await undoByKeyboard(page);
  // FIXME
  // await assertRichTexts(page, ['123', '456', '789']);

  await redoByKeyboard(page);
  await assertRichTexts(page, ['\n']);
});

test('cursor move up and down', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyState(page);
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
  await initEmptyState(page);
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
  await pressShiftTab(page);
  for (let i = 0; i < 2; i++) {
    await page.keyboard.press('ArrowRight');
  }
  await page.keyboard.press('ArrowUp');
  const indexOne = await getQuillSelectionIndex(page);
  const textOne = await getQuillSelectionText(page);
  await expect(textOne).toBe('arrow down test 2\n');
  await expect(indexOne).toBe(13);
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('ArrowLeft');
  }
  await page.keyboard.press('ArrowUp');
  const indexTwo = await getQuillSelectionIndex(page);
  const textTwo = await getQuillSelectionText(page);
  await expect(textTwo).toBe('arrow down test 1\n');
  await expect(indexTwo).toBeGreaterThanOrEqual(12);
  await expect(indexTwo).toBeLessThanOrEqual(17);
  await page.keyboard.press('ArrowDown');
  const textThree = await getQuillSelectionText(page);
  await expect(textThree).toBe('arrow down test 2\n');
});

test('cursor move left and right', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyState(page);
  await focusRichText(page);
  await page.keyboard.type('arrow down test 1');
  await pressEnter(page);
  await page.keyboard.type('arrow down test 2');
  for (let i = 0; i < 18; i++) {
    await page.keyboard.press('ArrowLeft');
  }
  const indexOne = await getQuillSelectionIndex(page);
  await expect(indexOne).toBe(17);
  await page.keyboard.press('ArrowRight');
  const indexTwo = await getQuillSelectionIndex(page);
  await expect(indexTwo).toBe(0);
});

test('cursor move up at edge of the second line', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyState(page);
  await focusRichText(page);
  await pressEnter(page);
  const [id, height] = await getCursorBlockIdAndHeight(page);
  if (id && height) {
    await fillLine(page, true);
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowUp');
    const [currentId] = await getCursorBlockIdAndHeight(page);
    await expect(currentId).toBe(id);
  }
});

test('cursor move down at edge of the last line', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyState(page);
  await focusRichText(page);
  await pressEnter(page);
  const [id] = await getCursorBlockIdAndHeight(page);
  await page.keyboard.press('ArrowUp');
  const [, height] = await getCursorBlockIdAndHeight(page);
  if (id && height) {
    await fillLine(page, true);
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowDown');
    const [currentId] = await getCursorBlockIdAndHeight(page);
    await expect(currentId).toBe(id);
  }
});

test.skip('cursor move up and down through group', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyState(page);
  await addGroupByClick(page);
  await focusRichText(page, 0);
  let currentId: string | null = null;
  const [id] = await getCursorBlockIdAndHeight(page);
  await page.keyboard.press('ArrowDown');
  currentId = (await getCursorBlockIdAndHeight(page))[0];
  await expect(id).not.toBe(currentId);
  await page.keyboard.press('ArrowUp');
  currentId = (await getCursorBlockIdAndHeight(page))[0];
  await expect(id).toBe(currentId);
});

test('double click choose words', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyState(page);
  await focusRichText(page);
  await page.keyboard.type('hello block suite');
  await assertRichTexts(page, ['hello block suite']);
  const helloPosition = await page.evaluate(() => {
    const paragraph = document.querySelector('[data-block-id="2"] p');
    const rect = paragraph?.getBoundingClientRect() as DOMRect;
    return { x: rect.left + 2, y: rect.top + 8 };
  });
  await page.mouse.dblclick(helloPosition.x, helloPosition.y);
  const text = await page.evaluate(() => {
    let text = '';
    const selection = window.getSelection();
    if (selection) {
      text = selection.toString();
    }
    return text;
  });
  await expect(text).toBe('hello');
});

test('select all text with hotkey and delete', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await selectAllByKeyboard(page);
  await page.keyboard.press('Backspace', { delay: 50 });
  await page.keyboard.type('abc');
  const textOne = await getQuillSelectionText(page);
  expect(textOne).toBe('abc\n');
});

test('select all text with dragging and delete', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await dragBetweenIndices(page, [0, 0], [2, 3]);
  await page.keyboard.press('Backspace', { delay: 50 });
  await page.keyboard.type('abc');
  const textOne = await getQuillSelectionText(page);
  expect(textOne).toBe('abc\n');
});

test('select text leaving a few words in the last line and delete', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await dragBetweenIndices(page, [0, 0], [2, 1]);
  await page.keyboard.press('Backspace', { delay: 50 });
  await page.keyboard.type('abc');
  const textOne = await getQuillSelectionText(page);
  expect(textOne).toBe('abc89\n');
});

test('select text in the same line with dragging leftward and move outside the editor-container', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await dragBetweenIndices(
    page,
    [1, 3],
    [1, 0],
    { x: 0, y: 0 },
    { x: -50, y: 0 }
  );
  await page.keyboard.press('Backspace', { delay: 50 });
  await page.keyboard.type('abc');
  const textOne = await getQuillSelectionText(page);
  expect(textOne).toBe('abc\n');
});

test('select text in the same line with dragging rightward and move outside the editor-container', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await dragBetweenIndices(
    page,
    [1, 0],
    [1, 3],
    { x: 0, y: 0 },
    { x: 50, y: 0 }
  );
  await page.keyboard.press('Backspace', { delay: 50 });
  await page.keyboard.type('abc');
  const textOne = await getQuillSelectionText(page);
  expect(textOne).toBe('abc\n');
});
