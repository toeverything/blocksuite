/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

import {
  activeFrameInEdgeless,
  addFrameByClick,
  copyByKeyboard,
  dragBetweenCoords,
  dragBetweenIndices,
  enterPlaygroundRoom,
  fillLine,
  focusRichText,
  focusTitle,
  getCursorBlockIdAndHeight,
  getIndexCoordinate,
  getSelectedTextByVirgo,
  getVirgoSelectionIndex,
  getVirgoSelectionText,
  initEmptyEdgelessState,
  initEmptyParagraphState,
  initThreeLists,
  initThreeParagraphs,
  pasteByKeyboard,
  pressArrowDown,
  pressArrowLeft,
  pressArrowRight,
  pressArrowUp,
  pressBackspace,
  pressEnter,
  pressShiftTab,
  pressTab,
  redoByKeyboard,
  resetHistory,
  shamefullyBlurActiveElement,
  SHORT_KEY,
  switchEditorMode,
  type,
  undoByKeyboard,
  waitNextFrame,
} from './utils/actions/index.js';
import {
  assertAlmostEqual,
  assertBlockCount,
  assertClipItems,
  assertDivider,
  assertRichTexts,
  assertSelection,
  assertStoreMatchJSX,
  assertTitle,
} from './utils/asserts.js';
import { test } from './utils/playwright.js';

test('click on blank area', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  const above123 = await page.evaluate(() => {
    const paragraph = document.querySelector(
      '[data-block-id="2"] .virgo-editor'
    );
    const bbox = paragraph?.getBoundingClientRect() as DOMRect;
    return { x: bbox.left, y: bbox.top + 5 }; // deepscan-disable-line NULL_POINTER
  });
  await page.mouse.click(above123.x, above123.y);
  await assertSelection(page, 0, 0, 0);

  const above456 = await page.evaluate(() => {
    const paragraph = document.querySelector(
      '[data-block-id="3"] .virgo-editor'
    );
    const bbox = paragraph?.getBoundingClientRect() as DOMRect;
    return { x: bbox.left, y: bbox.top + 5 };
  });
  await page.mouse.click(above456.x, above456.y);
  await assertSelection(page, 1, 0, 0);

  const below789 = await page.evaluate(() => {
    const paragraph = document.querySelector(
      '[data-block-id="4"] .virgo-editor'
    );
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
    const paragraph = document.querySelector(
      '[data-block-id="2"] .virgo-editor'
    );
    const bbox = paragraph?.getBoundingClientRect() as DOMRect;
    return { x: bbox.left + 1, y: bbox.top + 1 };
  });

  const bottomRight789 = await page.evaluate(() => {
    const paragraph = document.querySelector(
      '[data-block-id="4"] .virgo-editor'
    );
    const bbox = paragraph?.getBoundingClientRect() as DOMRect;
    return { x: bbox.right - 1, y: bbox.bottom - 1 };
  });

  // from top to bottom
  await dragBetweenCoords(page, topLeft123, bottomRight789);
  await page.keyboard.press('Backspace');
  await assertBlockCount(page, 'paragraph', 1);
  await assertRichTexts(page, ['']);

  await waitNextFrame(page);
  await undoByKeyboard(page);
  // FIXME
  // await assertRichTexts(page, ['123', '456', '789']);

  await redoByKeyboard(page);
  await assertRichTexts(page, ['']);
});

test('native range input', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  const topLeft123 = await page.evaluate(() => {
    const paragraph = document.querySelector(
      '[data-block-id="2"] .virgo-editor'
    );
    const bbox = paragraph?.getBoundingClientRect() as DOMRect;
    return { x: bbox.left + 1, y: bbox.top + 1 };
  });

  const bottomRight789 = await page.evaluate(() => {
    const paragraph = document.querySelector(
      '[data-block-id="4"] .virgo-editor'
    );
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
    const paragraph = document.querySelector(
      '[data-block-id="2"] .virgo-editor'
    );
    const bbox = paragraph?.getBoundingClientRect() as DOMRect;
    return { x: bbox.left, y: bbox.top - 2 };
  });

  const bottomRight789 = await page.evaluate(() => {
    const paragraph = document.querySelector(
      '[data-block-id="4"] .virgo-editor'
    );
    const bbox = paragraph?.getBoundingClientRect() as DOMRect;
    return { x: bbox.right, y: bbox.bottom };
  });

  // from bottom to top
  await dragBetweenCoords(page, bottomRight789, topLeft123);
  await pressBackspace(page);
  await assertBlockCount(page, 'paragraph', 1);
  await assertRichTexts(page, ['']);

  await waitNextFrame(page);
  await undoByKeyboard(page);
  // FIXME
  // await assertRichTexts(page, ['123', '456', '789']);

  await redoByKeyboard(page);
  await assertRichTexts(page, ['']);
});

test('block level range delete', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);
  await resetHistory(page);

  const above123 = await page.evaluate(() => {
    const paragraph = document.querySelector(
      '[data-block-id="2"] .virgo-editor'
    );
    const bbox = paragraph?.getBoundingClientRect() as DOMRect;
    return { x: bbox.left, y: bbox.top - 10 };
  });

  const below789 = await page.evaluate(() => {
    const paragraph = document.querySelector(
      '[data-block-id="4"] .virgo-editor'
    );
    const bbox = paragraph?.getBoundingClientRect() as DOMRect;
    return { x: bbox.right - 10, y: bbox.bottom + 10 };
  });

  await dragBetweenCoords(page, below789, above123);
  await pressBackspace(page);
  await assertBlockCount(page, 'paragraph', 1);
  await assertRichTexts(page, ['']);

  await waitNextFrame(page);
  await undoByKeyboard(page);
  // FIXME
  // await assertRichTexts(page, ['123', '456', '789']);

  await redoByKeyboard(page);
  await assertRichTexts(page, ['']);
});

test('cursor move up and down', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'arrow down test 1');
  await pressEnter(page);
  await type(page, 'arrow down test 2');
  await pressArrowLeft(page, 3);

  await page.keyboard.press('ArrowUp');
  const indexOne = await getVirgoSelectionIndex(page);
  const textOne = await getVirgoSelectionText(page);
  expect(indexOne).toBe(14);
  expect(textOne).toBe('arrow down test 1');

  await pressArrowLeft(page, 3);
  await page.keyboard.press('ArrowDown');
  const indexTwo = await getVirgoSelectionIndex(page);
  const textTwo = await getVirgoSelectionText(page);
  expect(indexTwo).toBe(11);
  expect(textTwo).toBe('arrow down test 2');
});

test('cursor move to up and down with children block', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'arrow down test 1');
  await pressEnter(page);
  await type(page, 'arrow down test 2');
  await page.keyboard.press('Tab');
  for (let i = 0; i <= 17; i++) {
    await page.keyboard.press('ArrowRight');
  }
  await pressEnter(page);
  await type(page, 'arrow down test 3');
  await pressShiftTab(page);
  for (let i = 0; i < 2; i++) {
    await page.keyboard.press('ArrowRight');
  }
  await page.keyboard.press('ArrowUp');
  const indexOne = await getVirgoSelectionIndex(page);
  const textOne = await getVirgoSelectionText(page);
  expect(textOne).toBe('arrow down test 2');
  expect(indexOne).toBe(13);
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('ArrowLeft');
  }
  await page.keyboard.press('ArrowUp');
  const indexTwo = await getVirgoSelectionIndex(page);
  const textTwo = await getVirgoSelectionText(page);
  expect(textTwo).toBe('arrow down test 1');
  expect(indexTwo).toBeGreaterThanOrEqual(12);
  expect(indexTwo).toBeLessThanOrEqual(17);
  await page.keyboard.press('ArrowDown');
  const textThree = await getVirgoSelectionText(page);
  expect(textThree).toBe('arrow down test 2');
});

test('cursor move left and right', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'arrow down test 1');
  await pressEnter(page);
  await type(page, 'arrow down test 2');
  await pressArrowLeft(page, 18);
  const indexOne = await getVirgoSelectionIndex(page);
  expect(indexOne).toBe(17);
  await pressArrowRight(page);
  const indexTwo = await getVirgoSelectionIndex(page);
  expect(indexTwo).toBe(0);
});

test('cursor move up at edge of the second line', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await pressEnter(page);
  const [id, height] = await getCursorBlockIdAndHeight(page);
  if (id && height) {
    await fillLine(page, true);
    await pressArrowLeft(page);
    await pressArrowUp(page);
    const [currentId] = await getCursorBlockIdAndHeight(page);
    expect(currentId).toBe(id);
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
    await pressArrowLeft(page);
    await pressArrowDown(page);
    const [currentId] = await getCursorBlockIdAndHeight(page);
    expect(currentId).toBe(id);
  }
});

test('cursor move up and down through frame', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await addFrameByClick(page);
  await focusRichText(page, 0);
  let currentId: string | null = null;
  const [id] = await getCursorBlockIdAndHeight(page);
  await page.keyboard.press('ArrowDown');
  currentId = (await getCursorBlockIdAndHeight(page))[0];
  expect(id).not.toBe(currentId);
  await page.keyboard.press('ArrowUp');
  currentId = (await getCursorBlockIdAndHeight(page))[0];
  expect(id).toBe(currentId);
});

test('double click choose words', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'hello block suite');
  await assertRichTexts(page, ['hello block suite']);
  const helloPosition = await page.evaluate(() => {
    const paragraph = document.querySelector(
      '[data-block-id="2"] .virgo-editor'
    );
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
  expect(text).toBe('hello');
});

// XXX: Doesn't simulate full user operation due to backspace cursor issue in Playwright.
test('select all and delete', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);
  await page.keyboard.press(`${SHORT_KEY}+a`);
  await page.keyboard.press(`${SHORT_KEY}+a`);
  await shamefullyBlurActiveElement(page);
  await page.keyboard.press('Backspace');
  await focusRichText(page, 0);
  await type(page, 'abc');
  await assertRichTexts(page, ['abc']);
});

test('select all text with dragging and delete', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await dragBetweenIndices(page, [0, 0], [2, 3]);
  await pressBackspace(page);
  await type(page, 'abc');
  const textOne = await getVirgoSelectionText(page);
  expect(textOne).toBe('abc');
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
  await waitNextFrame(page);
  await type(page, 'abc');
  const textOne = await getVirgoSelectionText(page);
  expect(textOne).toBe('abc89');
});

test('select text in the same line with dragging leftward and move outside the affine-frame', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  const frameLeft = await page.evaluate(() => {
    const frame = document.querySelector('affine-frame');
    if (!frame) {
      throw new Error();
    }
    return frame.getBoundingClientRect().left;
  });

  // `456`
  const blockRect = await page.evaluate(() => {
    const block = document.querySelector('[data-block-id="3"]');
    if (!block) {
      throw new Error();
    }
    return block.getBoundingClientRect();
  });

  await dragBetweenIndices(
    page,
    [1, 3],
    [1, 0],
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    {
      async beforeMouseUp() {
        await page.mouse.move(
          frameLeft - 1,
          blockRect.top + blockRect.height / 2
        );
      },
    }
  );
  await pressBackspace(page);
  await type(page, 'abc');
  await assertRichTexts(page, ['123', 'abc', '789']);
});

test('select text in the same line with dragging rightward and move outside the affine-frame', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  const frameRight = await page.evaluate(() => {
    const frame = document.querySelector('affine-frame');
    if (!frame) {
      throw new Error();
    }
    return frame.getBoundingClientRect().right;
  });

  // `456`
  const blockRect = await page.evaluate(() => {
    const block = document.querySelector('[data-block-id="3"]');
    if (!block) {
      throw new Error();
    }
    return block.getBoundingClientRect();
  });

  await dragBetweenIndices(
    page,
    [1, 0],
    [1, 3],
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    {
      async beforeMouseUp() {
        await page.mouse.move(
          frameRight + 1,
          blockRect.top + blockRect.height / 2
        );
      },
    }
  );
  await pressBackspace(page);
  await type(page, 'abc');
  const textOne = await getVirgoSelectionText(page);
  expect(textOne).toBe('abc');
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
    const paragraph = document.querySelector(
      '[data-block-id="2"] .virgo-editor'
    );
    const bbox = paragraph?.getBoundingClientRect() as DOMRect;
    return { x: bbox.left - 20, y: bbox.top - 20 };
  });
  const below789 = await page.evaluate(() => {
    const paragraph = document.querySelector(
      '[data-block-id="4"] .virgo-editor'
    );
    const bbox = paragraph?.getBoundingClientRect() as DOMRect;
    return { x: bbox.right + 30, y: bbox.bottom + 50 };
  });

  await dragBetweenCoords(page, below789, above123, {
    steps: 50,
  });
  await page.keyboard.press('Enter', { delay: 50 });
  await type(page, 'abc');
  await assertRichTexts(page, ['123', '456', '789', 'abc']);
});

async function clickListIcon(page: Page, i = 0) {
  const locator = page.locator('.affine-list-block__prefix').nth(i);
  await locator.click();
}

test('click the list icon can select and copy', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeLists(page);
  await assertRichTexts(page, ['123', '456', '789']);
  await clickListIcon(page, 0);
  // copy 123
  await copyByKeyboard(page);

  await focusRichText(page, 2);
  await pasteByKeyboard(page);
  await assertRichTexts(page, ['123', '456', '789123']);

  // copy 789123
  await clickListIcon(page, 2);
  await copyByKeyboard(page);

  await focusRichText(page, 0);
  await pasteByKeyboard(page);
  await assertRichTexts(page, ['123789123', '456', '789123']);
});

test('click the list icon can select and delete', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeLists(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await clickListIcon(page, 0);
  await pressBackspace(page);
  await shamefullyBlurActiveElement(page);
  await pressBackspace(page);
  await assertRichTexts(page, ['', '456', '789']);
  await clickListIcon(page, 0);
  await shamefullyBlurActiveElement(page);
  await pressBackspace(page);
  await assertRichTexts(page, ['', '']);
});

test('drag to select tagged text, and copy', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await focusRichText(page);
  await page.keyboard.insertText('123456789');
  await assertRichTexts(page, ['123456789']);

  await dragBetweenIndices(page, [0, 1], [0, 3]);
  page.keyboard.press(`${SHORT_KEY}+B`);
  await dragBetweenIndices(page, [0, 0], [0, 5]);
  page.keyboard.press(`${SHORT_KEY}+C`);
  const textOne = await getSelectedTextByVirgo(page);
  expect(textOne).toBe('12345');
});

test('drag to select tagged text, and input character', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await focusRichText(page);
  await page.keyboard.insertText('123456789');
  await assertRichTexts(page, ['123456789']);

  await dragBetweenIndices(page, [0, 1], [0, 3]);
  page.keyboard.press(`${SHORT_KEY}+B`);
  await dragBetweenIndices(page, [0, 0], [0, 5]);
  await type(page, '1');
  const textOne = await getVirgoSelectionText(page);
  expect(textOne).toBe('16789');
});

test('selection on heavy page', async ({ page }) => {
  await page
    .locator('body')
    .evaluate(element => (element.style.padding = '50px'));
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  for (let i = 0; i < 5; i++) {
    await type(page, `Line ${i + 1}`);
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
          .locator('.affine-page-dragging-area')
          .evaluate(element => element.getBoundingClientRect());
        assertAlmostEqual(rect.x, first.x - 1, 1);
        assertAlmostEqual(rect.y, first.y - 1, 1);
        assertAlmostEqual(rect.right, last.x + 1, 1);
        assertAlmostEqual(rect.bottom, last.y + 1, 1);
      },
    }
  );
  const rects = page.locator('.affine-page-selected-rects-container > *');
  await expect(rects).toHaveCount(5);
});

// Refs: https://github.com/toeverything/blocksuite/issues/1004
test('Change title when first content is divider', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, '--- ');
  await assertDivider(page, 1);
  await focusTitle(page);
  await type(page, 'title');
  await assertTitle(page, 'title');
});

test('ArrowUp and ArrowDown to select divider and copy', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, '--- ');
  await assertDivider(page, 1);
  await pressArrowUp(page);
  await copyByKeyboard(page);
  await pressArrowDown(page);
  await pasteByKeyboard(page);
  await assertDivider(page, 2);
});

test('Delete the blank line between two dividers', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, '--- ');
  await assertDivider(page, 1);

  await pressEnter(page);
  await type(page, '--- ');
  await pressArrowUp(page, 2);
  await pressBackspace(page);
  await assertDivider(page, 2);
  await assertRichTexts(page, ['']);
});

test('should delete line with content after divider should not lost content', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, '--- ');
  await type(page, '123');
  await assertDivider(page, 1);
  // Jump to line start
  page.keyboard.press(`${SHORT_KEY}+ArrowLeft`, { delay: 50 });
  await page.waitForTimeout(50);
  await page.keyboard.press('Backspace');
  await page.waitForTimeout(50);
  await page.keyboard.press('Backspace');
  await assertDivider(page, 0);
  await assertRichTexts(page, ['', '123']);
});

test('the cursor should move to closest editor block when clicking outside container', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  const rect = await page.evaluate(() => {
    const secondRichText = document.querySelector(
      '[data-block-id="3"] .virgo-editor'
    );
    if (!secondRichText) {
      throw new Error();
    }

    return secondRichText.getBoundingClientRect();
  });

  await page.mouse.click(rect.left - 50, rect.top + 5);

  await page.keyboard.press('Backspace');
  await assertRichTexts(page, ['123456', '789']);

  await undoByKeyboard(page);
  await page.waitForTimeout(50);
  await page.mouse.click(rect.right + 50, rect.top + 5);

  await pressBackspace(page);
  await assertRichTexts(page, ['123', '45', '789']);
});

test('should not crash when mouse over the left side of the list block prefix', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeLists(page);
  await assertRichTexts(page, ['123', '456', '789']);
  await dragBetweenIndices(page, [1, 2], [1, 0]);
  await copyByKeyboard(page);
  await assertClipItems(page, 'text/plain', '45');

  // `456`
  const prefixIconRect = await page.evaluate(() => {
    const block = document.querySelector('[data-block-id="4"]');
    if (!block) {
      throw new Error();
    }
    const prefixIcon = block.querySelector('.affine-list-block__prefix ');
    if (!prefixIcon) {
      throw new Error();
    }
    return prefixIcon.getBoundingClientRect();
  });

  await dragBetweenIndices(
    page,
    [1, 2],
    [1, 0],
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    {
      beforeMouseUp: async () => {
        await page.mouse.move(prefixIconRect.left - 1, prefixIconRect.top);
      },
    }
  );

  await copyByKeyboard(page);
  await assertClipItems(page, 'text/plain', '45');
});

test('should set the last block to end the range after when leaving the affine-frame', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await dragBetweenIndices(page, [0, 2], [2, 1]);
  await copyByKeyboard(page);
  await assertClipItems(page, 'text/plain', '34567');
  // blur
  await page.mouse.click(0, 0);

  await dragBetweenIndices(
    page,
    [0, 2],
    [2, 1],
    { x: 0, y: 0 },
    { x: 0, y: 30 } // drag below the bottom of the last block
  );
  await copyByKeyboard(page);
  await assertClipItems(page, 'text/plain', '3456789');
});

test('should set the first block to start the range before when leaving the affine-frame-block-container', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await dragBetweenIndices(page, [2, 1], [0, 2]);
  await copyByKeyboard(page);
  await assertClipItems(page, 'text/plain', '34567');
  // blur
  await page.mouse.click(0, 0);

  await dragBetweenIndices(
    page,
    [2, 1],
    [0, 2],
    { x: 0, y: 0 },
    { x: 0, y: -30 } // drag above the top of the first block
  );
  await copyByKeyboard(page);
  await assertClipItems(page, 'text/plain', '1234567');
});

test('should select texts on cross-frame dragging', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { pageId } = await initEmptyParagraphState(page);
  await initThreeParagraphs(page);

  await initEmptyParagraphState(page, pageId);

  // focus last block in first frame
  await focusRichText(page, 2);
  // goto next frame
  await page.keyboard.press('ArrowDown');
  await type(page, 'ABC');

  await assertRichTexts(page, ['123', '456', '789', 'ABC']);

  // blur
  await page.mouse.click(0, 0);

  await dragBetweenIndices(
    page,
    [0, 2],
    [3, 1],
    { x: 0, y: 0 },
    { x: 0, y: 30 } // drag below the bottom of the last block
  );

  await copyByKeyboard(page);
  await assertClipItems(page, 'text/plain', '3456789ABC');
});

test('should select full text of the first block when leaving the affine-frame-block-container in edgeless mode', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  const ids = await initEmptyEdgelessState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await switchEditorMode(page);
  await activeFrameInEdgeless(page, ids.frameId);
  await dragBetweenIndices(page, [2, 1], [0, 2], undefined, undefined, {
    click: true,
  });
  await copyByKeyboard(page);
  await assertClipItems(page, 'text/plain', '34567');

  const containerRect = await page.evaluate(() => {
    const container = document.querySelector('.affine-frame-block-container');
    if (!container) {
      throw new Error();
    }
    return container.getBoundingClientRect();
  });

  await dragBetweenIndices(
    page,
    [2, 1],
    [0, 2],
    { x: 0, y: 0 },
    { x: 0, y: 0 }, // drag above the top of the first block
    {
      beforeMouseUp: async () => {
        await page.mouse.move(containerRect.left, containerRect.top - 30);
      },
    }
  );
});

test('should add a new line when clicking the bottom of the last non-text block', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);
  await pressEnter(page);

  // code block
  await type(page, '```');
  await pressEnter(page);

  const locator = page.locator('affine-code');
  await expect(locator).toBeVisible();

  const rect = await page.evaluate(() => {
    const secondRichText = document.querySelector('affine-code');
    if (!secondRichText) {
      throw new Error();
    }

    return secondRichText.getBoundingClientRect();
  });
  await page.mouse.click(rect.left + rect.width / 2, rect.bottom + 10);
  await waitNextFrame(page);
  await type(page, 'ABC');
  await waitNextFrame(page);
  await assertRichTexts(page, [
    '123',
    '456',
    '789',
    '', // code block
    'ABC',
  ]);
});

test('should select texts on dragging around the page', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  const coord = await getIndexCoordinate(page, [1, 2]);

  // blur
  await page.mouse.click(0, 0);
  await page.mouse.move(coord.x, coord.y);
  await page.mouse.down();
  // ←
  await page.mouse.move(coord.x - 26 - 24, coord.y);
  await page.mouse.up();
  expect(await getSelectedTextByVirgo(page)).toBe('45');

  // blur
  await page.mouse.click(0, 0);
  await page.mouse.move(coord.x, coord.y);
  await page.mouse.down();
  // ←
  await page.mouse.move(coord.x - 26 - 24, coord.y);
  // ↓
  await page.mouse.move(coord.x - 26 - 24, coord.y + 90);
  await page.mouse.up();
  await page.keyboard.press('Backspace');
  await assertRichTexts(page, ['123', '45']);

  await waitNextFrame(page);
  await undoByKeyboard(page);

  // blur
  await page.mouse.click(0, 0);
  await page.mouse.move(coord.x, coord.y);
  await page.mouse.down();
  // →
  await page.mouse.move(coord.x + 20, coord.y);
  // ↓
  await page.mouse.move(coord.x + 20, coord.y + 90);
  await page.mouse.up();
  await page.keyboard.press('Backspace');
  await assertRichTexts(page, ['123', '45']);
});

test('should indent native multi-selection block', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);
  const topLeft456 = await page.evaluate(() => {
    const paragraph = document.querySelector(
      '[data-block-id="3"] .virgo-editor'
    );
    const bbox = paragraph?.getBoundingClientRect() as DOMRect;
    return { x: bbox.left + 1, y: bbox.top + 1 };
  });

  const bottomRight789 = await page.evaluate(() => {
    const paragraph = document.querySelector(
      '[data-block-id="4"] .virgo-editor'
    );
    const bbox = paragraph?.getBoundingClientRect() as DOMRect;
    return { x: bbox.right - 1, y: bbox.bottom - 1 };
  });

  // from top to bottom
  await dragBetweenCoords(page, topLeft456, bottomRight789);

  await page.keyboard.press('Tab');

  await assertStoreMatchJSX(
    page,
    `<affine:page>
  <affine:frame>
    <affine:paragraph
      prop:text="123"
      prop:type="text"
    >
      <affine:paragraph
        prop:text="456"
        prop:type="text"
      />
      <affine:paragraph
        prop:text="789"
        prop:type="text"
      />
    </affine:paragraph>
  </affine:frame>
</affine:page>`
  );
});

test('should indent multi-selection block', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);
  const coord = await getIndexCoordinate(page, [1, 2]);

  // blur
  await page.mouse.click(0, 0);
  await page.mouse.move(coord.x - 26 - 24, coord.y - 10);
  await page.mouse.down();
  // ←
  await page.mouse.move(coord.x + 20, coord.y + 50);
  await page.mouse.up();

  await page.keyboard.press('Tab');

  await assertStoreMatchJSX(
    page,
    `<affine:page>
  <affine:frame>
    <affine:paragraph
      prop:text="123"
      prop:type="text"
    >
      <affine:paragraph
        prop:text="456"
        prop:type="text"
      />
      <affine:paragraph
        prop:text="789"
        prop:type="text"
      />
    </affine:paragraph>
  </affine:frame>
</affine:page>`
  );
});

// ↑
test('should keep selection state when scrolling backward', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);

  await assertRichTexts(page, ['123', '456', '789']);

  for (let i = 0; i < 6; i++) {
    await pressEnter(page);
  }

  await type(page, '987');
  await pressEnter(page);
  await type(page, '654');
  await pressEnter(page);
  await type(page, '321');

  const data = new Array(5).fill('');
  data.unshift(...['123', '456', '789']);
  data.push(...['987', '654', '321']);
  await assertRichTexts(page, data);

  const [viewport, container, distance] = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    const distance = viewport.scrollHeight - viewport.clientHeight;
    viewport.scrollTo(0, distance);

    const container = viewport.querySelector(
      '.affine-block-children-container'
    );
    if (!container) {
      throw new Error();
    }
    return [
      viewport.getBoundingClientRect(),
      container.getBoundingClientRect(),
      distance,
    ] as const;
  });

  await page.mouse.move(0, 0);

  await dragBetweenCoords(
    page,
    {
      x: container.right + 1,
      y: viewport.height - 1,
    },
    {
      x: container.right - 1,
      y: 1,
    },
    {
      // dont release mouse
      beforeMouseUp: async () => {
        const count = distance / (10 * 0.25);
        await page.waitForTimeout((1000 / 60) * count);
      },
    }
  );

  const scrollTop = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    return viewport.scrollTop;
  });

  const rects = page.locator('.affine-page-selected-rects-container > *');
  await expect(rects).toHaveCount(3 + 5 + 3);
  expect(scrollTop).toBe(0);
});

// ↓
test('should keep selection state when scrolling forward', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  for (let i = 0; i < 6; i++) {
    await pressEnter(page);
  }

  await type(page, '987');
  await pressEnter(page);
  await type(page, '654');
  await pressEnter(page);
  await type(page, '321');

  const data = new Array(5).fill('');
  data.unshift(...['123', '456', '789']);
  data.push(...['987', '654', '321']);
  await assertRichTexts(page, data);

  const [viewport, container, distance] = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    const distance = viewport.scrollHeight - viewport.clientHeight;
    const container = viewport.querySelector(
      '.affine-block-children-container'
    );
    if (!container) {
      throw new Error();
    }
    return [
      viewport.getBoundingClientRect(),
      container.getBoundingClientRect(),
      distance,
    ] as const;
  });

  await page.mouse.move(0, 0);

  await dragBetweenCoords(
    page,
    {
      x: container.right + 1,
      y: 1,
    },
    {
      x: container.right - 1,
      y: viewport.height - 1,
    },
    {
      // dont release mouse
      beforeMouseUp: async () => {
        const count = distance / (10 * 0.25);
        await page.waitForTimeout((1000 / 60) * count);
      },
    }
  );

  const scrollTop = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    return viewport.scrollTop;
  });
  const rects = page.locator('.affine-page-selected-rects-container > *');
  await expect(rects).toHaveCount(3 + 5 + 3);
  // See https://jestjs.io/docs/expect#tobeclosetonumber-numdigits
  // Math.abs(scrollTop - distance) < Math.pow(10, -1 * -0.01)/2 = 0.511646496140377
  expect(scrollTop).toBeCloseTo(distance, -0.01);
});

// ↑
test('should keep selection state when scrolling backward with the scroll wheel', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  for (let i = 0; i < 6; i++) {
    await pressEnter(page);
  }

  await type(page, '987');
  await pressEnter(page);
  await type(page, '654');
  await pressEnter(page);
  await type(page, '321');

  const data = new Array(5).fill('');
  data.unshift(...['123', '456', '789']);
  data.push(...['987', '654', '321']);
  await assertRichTexts(page, data);

  const [last, distance] = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    const distance = viewport.scrollHeight - viewport.clientHeight;
    viewport.scrollTo(0, distance);
    const container = viewport.querySelector(
      'affine-frame .affine-block-children-container'
    );
    if (!container) {
      throw new Error();
    }
    const last = container.lastElementChild;
    if (!last) {
      throw new Error();
    }
    return [last.getBoundingClientRect(), distance] as const;
  });
  await page.waitForTimeout(250);

  await page.mouse.move(0, 0);

  await dragBetweenCoords(
    page,
    {
      x: last.right + 1,
      y: last.top + 1,
    },
    {
      x: last.right - 1,
      y: last.top - 1,
    },
    {
      // dont release mouse
      beforeMouseUp: async () => {
        await page.mouse.wheel(0, -distance * 2);
        await page.waitForTimeout(250);
      },
    }
  );

  // get count with scroll wheel
  const rects = page.locator('.affine-page-selected-rects-container > *');
  const count0 = await rects.count();
  const scrollTop0 = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    return viewport.scrollTop;
  });

  await page.mouse.move(0, 0);

  await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    const distance = viewport.scrollHeight - viewport.clientHeight;
    viewport.scrollTo(0, distance);
  });
  await page.waitForTimeout(250);

  await dragBetweenCoords(
    page,
    {
      x: last.right + 1,
      y: last.top + 1,
    },
    {
      x: last.right - 1,
      y: last.top - 1 - distance,
    }
  );

  // get count with moving mouse
  const count1 = await rects.count();
  const scrollTop1 = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    return viewport.scrollTop;
  });

  expect(count0).toBe(count1);
  expect(scrollTop0).toBe(0);
  expect(scrollTop1).toBeCloseTo(distance, -0.5);
});

// ↓
test('should keep selection state when scrolling forward with the scroll wheel', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  for (let i = 0; i < 6; i++) {
    await pressEnter(page);
  }

  await type(page, '987');
  await pressEnter(page);
  await type(page, '654');
  await pressEnter(page);
  await type(page, '321');

  const data = new Array(5).fill('');
  data.unshift(...['123', '456', '789']);
  data.push(...['987', '654', '321']);
  await assertRichTexts(page, data);

  const [first, distance] = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    const distance = viewport.scrollHeight - viewport.clientHeight;
    const container = viewport.querySelector(
      'affine-frame .affine-block-children-container'
    );
    if (!container) {
      throw new Error();
    }
    const first = container.firstElementChild;
    if (!first) {
      throw new Error();
    }
    return [first.getBoundingClientRect(), distance] as const;
  });

  await page.mouse.move(0, 0);

  await dragBetweenCoords(
    page,
    {
      x: first.left - 1,
      y: first.top - 1,
    },
    {
      x: first.left + 1,
      y: first.top + 1,
    },
    {
      // dont release mouse
      beforeMouseUp: async () => {
        await page.mouse.wheel(0, distance * 2);
        await page.waitForTimeout(250);
      },
    }
  );

  // get count with scroll wheel
  const rects = page.locator('.affine-page-selected-rects-container > *');
  const count0 = await rects.count();
  const scrollTop0 = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    return viewport.scrollTop;
  });

  await page.mouse.move(0, 0);

  await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    viewport.scrollTo(0, 0);
  });
  await page.waitForTimeout(250);

  await dragBetweenCoords(
    page,
    {
      x: first.left - 1,
      y: first.top - 1,
    },
    {
      x: first.left + 1,
      y: first.top + 1 + distance,
    }
  );

  // get count with moving mouse
  const count1 = await rects.count();
  const scrollTop1 = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    return viewport.scrollTop;
  });

  expect(count0).toBe(count1);
  expect(scrollTop0).toBeCloseTo(distance, -0.8);
  expect(scrollTop1).toBe(0);
});

test('should not clear selected rects when clicking on scrollbar', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  for (let i = 0; i < 6; i++) {
    await pressEnter(page);
  }

  await type(page, '987');
  await pressEnter(page);
  await type(page, '654');
  await pressEnter(page);
  await type(page, '321');

  const [viewport, first, distance] = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    const distance = viewport.scrollHeight - viewport.clientHeight;
    viewport.scrollTo(0, distance / 2);
    const container = viewport.querySelector(
      'affine-frame .affine-block-children-container'
    );
    if (!container) {
      throw new Error();
    }
    const first = container.firstElementChild;
    if (!first) {
      throw new Error();
    }
    return [
      viewport.getBoundingClientRect(),
      first.getBoundingClientRect(),
      distance,
    ] as const;
  });

  await page.mouse.move(0, 0);

  await dragBetweenCoords(
    page,
    {
      x: first.left - 1,
      y: first.top - 1,
    },
    {
      x: first.left + 1,
      y: first.top + distance / 2,
    }
  );

  const rects = page.locator('.affine-page-selected-rects-container > *');
  const count0 = await rects.count();
  const scrollTop0 = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    return viewport.scrollTop;
  });

  await page.mouse.click(viewport.right, distance / 2);

  const count1 = await rects.count();
  const scrollTop1 = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    return viewport.scrollTop;
  });

  expect(count0).toBeGreaterThan(0);
  expect(scrollTop0).toBeCloseTo(distance / 2, -0.01);
  expect(count0).toBe(count1);
  expect(scrollTop0).toBeCloseTo(scrollTop1, -0.01);
});

test('should not clear selected rects when scrolling the wheel', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  for (let i = 0; i < 6; i++) {
    await pressEnter(page);
  }

  await type(page, '987');
  await pressEnter(page);
  await type(page, '654');
  await pressEnter(page);
  await type(page, '321');

  const [viewport, first, distance] = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    const distance = viewport.scrollHeight - viewport.clientHeight;
    viewport.scrollTo(0, distance / 2);
    const container = viewport.querySelector(
      'affine-frame .affine-block-children-container'
    );
    if (!container) {
      throw new Error();
    }
    const first = container.firstElementChild;
    if (!first) {
      throw new Error();
    }
    return [
      viewport.getBoundingClientRect(),
      first.getBoundingClientRect(),
      distance,
    ] as const;
  });

  await page.mouse.move(0, 0);

  await dragBetweenCoords(
    page,
    {
      x: first.left - 1,
      y: first.top - 1,
    },
    {
      x: first.left + 1,
      y: first.top + distance / 2,
    }
  );

  const rects = page.locator('.affine-page-selected-rects-container > *');
  const count0 = await rects.count();
  const scrollTop0 = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    return viewport.scrollTop;
  });

  await page.mouse.wheel(viewport.right, -distance / 4);
  await page.waitForTimeout(250);

  const count1 = await rects.count();
  const scrollTop1 = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    return viewport.scrollTop;
  });

  expect(count0).toBeGreaterThan(0);
  expect(scrollTop0).toBeCloseTo(distance / 2, -0.01);
  expect(count0).toBe(count1);
  expect(scrollTop0).toBeCloseTo(scrollTop1 + distance / 4, -0.01);

  await page.mouse.wheel(viewport.right, distance / 4);
  await page.waitForTimeout(250);

  const [count2, scrollTop2] = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    return [
      viewport.querySelector('.affine-page-selected-rects-container')?.children
        .length || 0,
      viewport.scrollTop,
    ] as const;
  });

  expect(count0).toBe(count2);
  expect(scrollTop0).toBeCloseTo(scrollTop2, -0.01);
});

test('should refresh selected rects when resizing the window/viewport', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  for (let i = 0; i < 6; i++) {
    await pressEnter(page);
  }

  await type(page, '987');
  await pressEnter(page);
  await type(page, '654');
  await pressEnter(page);
  await type(page, '321');

  const [viewport, first, distance] = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    const distance = viewport.scrollHeight - viewport.clientHeight;
    viewport.scrollTo(0, distance / 2);
    const container = viewport.querySelector(
      'affine-frame .affine-block-children-container'
    );
    if (!container) {
      throw new Error();
    }
    const first = container.firstElementChild;
    if (!first) {
      throw new Error();
    }
    return [
      viewport.getBoundingClientRect(),
      first.getBoundingClientRect(),
      distance,
    ] as const;
  });

  await page.mouse.move(0, 0);

  await dragBetweenCoords(
    page,
    {
      x: first.left - 1,
      y: first.top - 1,
    },
    {
      x: first.left + 1,
      y: first.top + distance / 2,
    }
  );

  const rects = page.locator('.affine-page-selected-rects-container > *');
  const count0 = await rects.count();
  const scrollTop0 = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    return viewport.scrollTop;
  });

  await page.mouse.click(viewport.right, first.top + distance / 2);

  const size = page.viewportSize();

  if (!size) {
    throw new Error();
  }

  await page.setViewportSize({
    width: size.width - 100,
    height: size.height - 100,
  });
  await page.waitForTimeout(250);

  const count1 = await rects.count();
  const scrollTop1 = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    return viewport.scrollTop;
  });

  expect(count0).toBe(count1);
  expect(scrollTop0).toBeCloseTo(scrollTop1, -0.01);
});

test('should clear block selection before native selection', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  // `123`
  const first = await page.evaluate(() => {
    const first = document.querySelector('[data-block-id="2"]');
    if (!first) {
      throw new Error();
    }
    return first.getBoundingClientRect();
  });

  await dragBetweenCoords(
    page,
    {
      x: first.left - 1,
      y: first.top - 1,
    },
    {
      x: first.left + 1,
      y: first.top + 1,
    }
  );

  const rects = page.locator('.affine-page-selected-rects-container > *');
  const count0 = await rects.count();

  await dragBetweenIndices(
    page,
    [1, 3],
    [1, 0],
    { x: 0, y: 0 },
    { x: 0, y: 0 }
  );

  const count1 = await rects.count();
  const textCount = await page.evaluate(() => {
    return window.getSelection()?.rangeCount || 0;
  });

  expect(count0).toBe(1);
  expect(count1).toBe(0);
  expect(textCount).toBe(1);
});

test('should clear native selection before block selection', async ({
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
    { x: 0, y: 0 }
  );

  const text0 = await getVirgoSelectionText(page);

  // `123`
  const first = await page.evaluate(() => {
    const first = document.querySelector('[data-block-id="2"]');
    if (!first) {
      throw new Error();
    }
    return first.getBoundingClientRect();
  });

  await dragBetweenCoords(
    page,
    {
      x: first.right + 1,
      y: first.top - 1,
    },
    {
      x: first.right - 1,
      y: first.top + 1,
    }
  );

  const textCount = await page.evaluate(() => {
    return window.getSelection()?.rangeCount || 0;
  });

  expect(text0).toBe('456');
  expect(textCount).toBe(0);
  const rects = page.locator('.affine-page-selected-rects-container > *');
  await expect(rects).toHaveCount(1);
});

test('should not be misaligned when the editor container has padding or margin', async ({
  page,
}) => {
  await page.locator('body').evaluate(element => {
    element.style.margin = '50px';
    element.style.padding = '50px';
  });
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  // `123`, `789`
  const [first, last] = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    const container = viewport.querySelector(
      'affine-frame .affine-block-children-container'
    );
    if (!container) {
      throw new Error();
    }
    const first = container.firstElementChild;
    if (!first) {
      throw new Error();
    }
    const last = container.lastElementChild;
    if (!last) {
      throw new Error();
    }
    return [first.getBoundingClientRect(), last.getBoundingClientRect()];
  });

  await dragBetweenCoords(
    page,
    {
      x: first.left - 1,
      y: first.top - 1,
    },
    {
      x: last.left + 1,
      y: last.top + 1,
    }
  );

  const rects = page.locator('.affine-page-selected-rects-container > *');
  await expect(rects).toHaveCount(3);
});

// ↑
test('should keep native range selection when scrolling backward with the scroll wheel', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  for (let i = 0; i < 10; i++) {
    await pressEnter(page);
  }

  await type(page, '987');
  await pressEnter(page);
  await type(page, '654');
  await pressEnter(page);
  await type(page, '321');

  const data = new Array(9).fill('');
  data.unshift(...['123', '456', '789']);
  data.push(...['987', '654', '321']);
  await assertRichTexts(page, data);

  const blockHeight = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    const distance = viewport.scrollHeight - viewport.clientHeight;
    viewport.scrollTo(0, distance);
    const container = viewport.querySelector(
      'affine-frame .affine-block-children-container'
    );
    if (!container) {
      throw new Error();
    }
    const first = container.firstElementChild;
    if (!first) {
      throw new Error();
    }
    const second = first.nextElementSibling;
    if (!second) {
      throw new Error();
    }
    return (
      second.getBoundingClientRect().top - first.getBoundingClientRect().top
    );
  });
  await page.waitForTimeout(250);

  await page.mouse.move(0, 0);

  await dragBetweenIndices(
    page,
    [14, 3],
    [14, 0],
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    {
      // dont release mouse
      beforeMouseUp: async () => {
        await page.mouse.wheel(0, -blockHeight * 4);
        await page.waitForTimeout(250);
      },
    }
  );

  await copyByKeyboard(page);
  await assertClipItems(page, 'text/plain', '987654321');
});

// ↓
test('should keep native range selection when scrolling forward with the scroll wheel', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  for (let i = 0; i < 10; i++) {
    await pressEnter(page);
  }

  await type(page, '987');
  await pressEnter(page);
  await type(page, '654');
  await pressEnter(page);
  await type(page, '321');

  const data = new Array(9).fill('');
  data.unshift(...['123', '456', '789']);
  data.push(...['987', '654', '321']);
  await assertRichTexts(page, data);

  const blockHeight = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    const container = viewport.querySelector(
      'affine-frame .affine-block-children-container'
    );
    if (!container) {
      throw new Error();
    }
    const first = container.firstElementChild;
    if (!first) {
      throw new Error();
    }
    const second = first.nextElementSibling;
    if (!second) {
      throw new Error();
    }
    return (
      second.getBoundingClientRect().top - first.getBoundingClientRect().top
    );
  });
  await page.waitForTimeout(250);

  await page.evaluate(() => {
    document.querySelector('.affine-default-viewport')?.scrollTo(0, 0);
  });
  await page.mouse.move(0, 0);

  await dragBetweenIndices(
    page,
    [0, 0],
    [0, 3],
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    {
      // dont release mouse
      beforeMouseUp: async () => {
        await page.mouse.wheel(0, blockHeight * 3);
        await page.waitForTimeout(250);
      },
    }
  );

  await copyByKeyboard(page);
  await assertClipItems(page, 'text/plain', '123456789');
});

test('undo should clear block selection', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  await type(page, 'hello');
  await pressEnter(page);
  await type(page, 'world');
  await pressEnter(page);

  const rect = await page
    .locator('[data-block-id="2"] .virgo-editor')
    .boundingBox();
  if (!rect) {
    throw new Error();
  }
  await dragBetweenCoords(
    page,
    { x: rect.x - 5, y: rect.y - 5 },
    { x: rect.x + 5, y: rect.y + rect.height }
  );

  await redoByKeyboard(page);
  const selectedBlocks = page.locator(
    '.affine-page-selected-rects-container > *'
  );
  await expect(selectedBlocks).toHaveCount(1);

  await undoByKeyboard(page);
  await expect(selectedBlocks).toHaveCount(0);
});

test('should not draw rect for sub selected blocks when entering tab key', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);
  const coord = await getIndexCoordinate(page, [1, 2]);

  // blur
  await page.mouse.click(0, 0);
  await dragBetweenCoords(
    page,
    { x: coord.x - 26 - 24, y: coord.y - 10 },
    { x: coord.x + 20, y: coord.y + 50 }
  );
  await pressTab(page);

  await assertStoreMatchJSX(
    page,
    `
<affine:page>
  <affine:frame>
    <affine:paragraph
      prop:text="123"
      prop:type="text"
    >
      <affine:paragraph
        prop:text="456"
        prop:type="text"
      />
      <affine:paragraph
        prop:text="789"
        prop:type="text"
      />
    </affine:paragraph>
  </affine:frame>
</affine:page>`
  );

  await page.mouse.click(0, 0);
  await page.mouse.click(coord.x - 40, coord.y - 40);
  await pressTab(page);

  const rects = page.locator('.affine-page-selected-rects-container > *');
  await expect(rects).toHaveCount(1);
});

test('should blur rich-text first when block selection', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await expect(page.locator('*:focus')).toHaveCount(1);

  const coord = await getIndexCoordinate(page, [1, 2]);
  await dragBetweenCoords(
    page,
    { x: coord.x - 30, y: coord.y - 10 },
    { x: coord.x + 20, y: coord.y + 50 }
  );

  await expect(page.locator('*:focus')).toHaveCount(0);
});
