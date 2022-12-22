import { Page, test } from '@playwright/test';
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
  initEmptyParagraphState,
  undoByKeyboard,
  resetHistory,
  redoByKeyboard,
  waitNextFrame,
  selectAllByKeyboard,
  dragBetweenIndices,
  initThreeLists,
  copyByKeyboard,
  pasteByKeyboard,
  getSelectedTextByQuill,
  withCtrlOrMeta,
} from './utils/actions/index.js';
import { expect } from '@playwright/test';
import {
  assertBlockCount,
  assertRichTexts,
  assertSelection,
  assertAlmostEqual,
  assertDivider,
} from './utils/asserts.js';

test('click on blank area', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
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
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  const topLeft123 = await page.evaluate(() => {
    const paragraph = document.querySelector('[data-block-id="2"] p');
    const bbox = paragraph?.getBoundingClientRect() as DOMRect;
    return { x: bbox.left + 1, y: bbox.top + 1 };
  });

  const bottomRight789 = await page.evaluate(() => {
    const paragraph = document.querySelector('[data-block-id="4"] p');
    const bbox = paragraph?.getBoundingClientRect() as DOMRect;
    return { x: bbox.right - 1, y: bbox.bottom - 1 };
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

test('native range input', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  const topLeft123 = await page.evaluate(() => {
    const paragraph = document.querySelector('[data-block-id="2"] p');
    const bbox = paragraph?.getBoundingClientRect() as DOMRect;
    return { x: bbox.left + 1, y: bbox.top + 1 };
  });

  const bottomRight789 = await page.evaluate(() => {
    const paragraph = document.querySelector('[data-block-id="4"] p');
    const bbox = paragraph?.getBoundingClientRect() as DOMRect;
    return { x: bbox.right - 1, y: bbox.bottom - 1 };
  });

  // from top to bottom
  await dragBetweenCoords(page, topLeft123, bottomRight789);
  await page.keyboard.press('a');
  await assertBlockCount(page, 'paragraph', 1);
  await assertRichTexts(page, ['a']);
});

test('native range selection backwards', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
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
  await initEmptyParagraphState(page);
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
  await initEmptyParagraphState(page);
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
  await initEmptyParagraphState(page);
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
  await initEmptyParagraphState(page);
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
  await initEmptyParagraphState(page);
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
  await initEmptyParagraphState(page);
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
  await initEmptyParagraphState(page);
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
  await initEmptyParagraphState(page);
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
  await initEmptyParagraphState(page);
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
  await initEmptyParagraphState(page);
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
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await dragBetweenIndices(page, [0, 0], [2, 1]);
  await page.keyboard.press('Backspace');
  await page.keyboard.type('abc');
  const textOne = await getQuillSelectionText(page);
  expect(textOne).toBe('abc89\n');
});

test('select text in the same line with dragging leftward and move outside the editor-container', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
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
  await initEmptyParagraphState(page);
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

test('select text in the same line with dragging rightward and press enter create block', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);
  // blur the editor
  await page.mouse.click(0, 0);
  const above123 = await page.evaluate(() => {
    const paragraph = document.querySelector('[data-block-id="2"] p');
    const bbox = paragraph?.getBoundingClientRect() as DOMRect;
    return { x: bbox.left - 30, y: bbox.top - 20 };
  });
  const below789 = await page.evaluate(() => {
    const paragraph = document.querySelector('[data-block-id="4"] p');
    const bbox = paragraph?.getBoundingClientRect() as DOMRect;
    return { x: bbox.right + 30, y: bbox.bottom + 50 };
  });

  await dragBetweenCoords(page, below789, above123, {
    steps: 50,
  });
  await page.keyboard.press('Enter', { delay: 50 });
  await page.keyboard.type('abc');
  await assertRichTexts(page, ['123', '456', '789', 'abc']);
});

async function clickListIcon(page: Page, i = 0) {
  const locator = page.locator('.affine-list-block__prefix').nth(i);
  await locator.click();
}

test('click the list icon to select', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeLists(page);
  await assertRichTexts(page, ['123', '456', '789']);
  await clickListIcon(page, 0);
  await copyByKeyboard(page);
  await pasteByKeyboard(page);
  await assertRichTexts(page, ['123', '123', '456', '789']);
  await clickListIcon(page, 2);
  await copyByKeyboard(page);
  await pasteByKeyboard(page);
  await assertRichTexts(page, ['123', '123', '456', '789', '456', '789']);
  await clickListIcon(page, 4);
  await page.keyboard.press('Backspace', { delay: 50 });
  await assertRichTexts(page, ['123', '123', '456', '789', '\n']);
  // FIXME
  // This should be ['123', '123', '456', '789'] but there is another bug affecting it
  await clickListIcon(page, 1);
  await page.keyboard.press('Backspace', { delay: 50 });
  await assertRichTexts(page, ['123', '\n', '456', '789']);
  // FIXME
  // This should be ['123','456','789'] but there is another bug affecting it
});

test('drag to select tagged text, and copy', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await focusRichText(page);
  await page.keyboard.insertText('123456789');
  await assertRichTexts(page, ['123456789']);

  await dragBetweenIndices(page, [0, 1], [0, 3]);
  await withCtrlOrMeta(page, () => page.keyboard.press('B'));
  await dragBetweenIndices(page, [0, 0], [0, 5]);
  await withCtrlOrMeta(page, () => page.keyboard.press('C'));
  const textOne = await getSelectedTextByQuill(page);
  expect(textOne).toBe('12345');
});

test('drag to select tagged text, and input character', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await focusRichText(page);
  await page.keyboard.insertText('123456789');
  await assertRichTexts(page, ['123456789']);

  await dragBetweenIndices(page, [0, 1], [0, 3]);
  await withCtrlOrMeta(page, () => page.keyboard.press('B'));
  await dragBetweenIndices(page, [0, 0], [0, 5]);
  await page.keyboard.type('1');
  const textOne = await getQuillSelectionText(page);
  expect(textOne).toBe('16789\n');
});

test('selection on heavy page', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await page
    .locator('body')
    .evaluate(element => (element.style.padding = '50px'));
  await initEmptyParagraphState(page);
  await focusRichText(page);
  for (let i = 0; i < 5; i++) {
    await page.keyboard.insertText(`Line ${i + 1}`);
    await pressEnter(page);
  }
  const [first, last] = await page.evaluate(() => {
    const first = document.querySelector('[data-block-id="2"]');
    if (!first) {
      throw new Error();
    }

    const last = document.querySelector('[data-block-id="6"]');
    if (!last) {
      throw new Error();
    }
    return [first.getBoundingClientRect(), last.getBoundingClientRect()];
  });
  await dragBetweenCoords(
    page,
    {
      x: first.x - 1,
      y: first.y - 1,
    },
    {
      x: last.x + 1,
      y: last.y + 1,
    },
    {
      beforeMouseUp: async () => {
        const rect = await page
          .locator('.affine-page-frame-selection-rect')
          .evaluate(element => element.getBoundingClientRect());
        assertAlmostEqual(rect.x, first.x - 1, 1);
        assertAlmostEqual(rect.y, first.y - 1, 1);
        assertAlmostEqual(rect.right, last.x + 1, 1);
        assertAlmostEqual(rect.bottom, last.y + 1, 1);
      },
    }
  );
  const rectNum = await page.evaluate(() => {
    const container = document.querySelector(
      '.affine-page-selected-rects-container'
    );
    return container?.children.length;
  });
  expect(rectNum).toBe(5);
});

test('ArrowUp and ArrowDown to select divider and copy', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await page.keyboard.type('---');
  await page.keyboard.type(' ');
  await assertDivider(page, 1);
  await page.keyboard.press('ArrowUp');
  await copyByKeyboard(page);
  await page.waitForTimeout(500);
  await pasteByKeyboard(page);
  await page.keyboard.press('ArrowDown');
  await assertDivider(page, 2);
});
