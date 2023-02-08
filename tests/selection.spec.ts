/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Page } from '@playwright/test';
import { test } from './utils/playwright.js';
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
  addFrameByClick,
  initThreeParagraphs,
  initEmptyParagraphState,
  undoByKeyboard,
  resetHistory,
  redoByKeyboard,
  waitNextFrame,
  dragBetweenIndices,
  initThreeLists,
  copyByKeyboard,
  pasteByKeyboard,
  getSelectedTextByQuill,
  SHORT_KEY,
  switchEditorMode,
  type,
  getIndexCoordinate,
  focusTitle,
} from './utils/actions/index.js';
import { expect } from '@playwright/test';
import {
  assertBlockCount,
  assertRichTexts,
  assertSelection,
  assertAlmostEqual,
  assertDivider,
  assertClipItems,
  assertTitle,
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
  await type(page, 'arrow down test 1');
  await pressEnter(page);
  await type(page, 'arrow down test 2');
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
  await type(page, 'arrow down test 1');
  await pressEnter(page);
  await type(page, 'arrow down test 2');
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

test.skip('cursor move up and down through frame', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await addFrameByClick(page);
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
  await type(page, 'hello block suite');
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
  expect(text).toBe('hello');
});

// XXX: Doesn't simulate full user operation due to backspace cursor issue in Playwright.
test('select all and delete', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await page.evaluate(() => {
    const defaultPage = document.querySelector('affine-default-page')!;
    const rect = defaultPage.getBoundingClientRect();
    // dont focus any block
    defaultPage.selection.state.focusedBlockIndex = -1;
    defaultPage.selection.selectBlocksByRect(rect);
  });

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
  await page.keyboard.press('Backspace', { delay: 50 });
  await type(page, 'abc');
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
  await type(page, 'abc');
  const textOne = await getQuillSelectionText(page);
  expect(textOne).toBe('abc89\n');
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
  await page.keyboard.press('Backspace', { delay: 50 });
  await type(page, 'abc');
  await assertRichTexts(page, ['123', 'abc', '789']);
});

// FIXME: https://github.com/toeverything/blocksuite/issues/1066
test.skip('select text in the same line with dragging rightward and move outside the affine-frame', async ({
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
  await page.keyboard.press('Backspace', { delay: 50 });
  await type(page, 'abc');
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
    return { x: bbox.left - 20, y: bbox.top - 20 };
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
  await type(page, 'abc');
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
  page.keyboard.press(`${SHORT_KEY}+B`);
  await dragBetweenIndices(page, [0, 0], [0, 5]);
  page.keyboard.press(`${SHORT_KEY}+C`);
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
  page.keyboard.press(`${SHORT_KEY}+B`);
  await dragBetweenIndices(page, [0, 0], [0, 5]);
  await type(page, '1');
  const textOne = await getQuillSelectionText(page);
  expect(textOne).toBe('16789\n');
});

test('selection on heavy page', async ({ page }) => {
  await page
    .locator('body')
    .evaluate(element => (element.style.padding = '50px'));
  await enterPlaygroundRoom(page);
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
  await page.keyboard.press('ArrowUp');
  await copyByKeyboard(page);
  await page.keyboard.press('ArrowDown');
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
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Backspace');
  await assertDivider(page, 2);
  await assertRichTexts(page, ['\n']);
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
  page.keyboard.press(`${SHORT_KEY}+ArrowLeft`);
  await page.keyboard.press('Backspace');
  await page.waitForTimeout(10);
  await page.keyboard.press('Backspace');
  await assertDivider(page, 0);
  await assertRichTexts(page, ['\n', '123']);
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
      '[data-block-id="3"] .ql-editor'
    );
    if (!secondRichText) {
      throw new Error();
    }

    return secondRichText.getBoundingClientRect();
  });

  await page.mouse.move(rect.left - 50, rect.top + 5);
  await page.mouse.down();
  await page.mouse.up();

  await page.keyboard.press('Backspace');
  await assertRichTexts(page, ['123456', '789']);

  await undoByKeyboard(page);
  await page.mouse.move(rect.right + 50, rect.top + 5);
  await page.mouse.down();
  await page.mouse.up();

  await page.keyboard.press('Backspace');
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
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await switchEditorMode(page);
  await waitNextFrame(page);
  await page.dblclick('[data-block-id="1"]');
  await dragBetweenIndices(page, [2, 1], [0, 2]);
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
  await copyByKeyboard(page);
  await assertClipItems(page, 'text/plain', '1234567');
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
  await type(page, 'ABC');
  await assertRichTexts(page, [
    '123',
    '456',
    '789',
    `
`, // code block
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
  await page.mouse.move(coord.x - 20, coord.y);
  await page.mouse.up();
  expect(await getSelectedTextByQuill(page)).toBe('45');

  // blur
  await page.mouse.click(0, 0);
  await page.mouse.move(coord.x, coord.y);
  await page.mouse.down();
  // ←
  await page.mouse.move(coord.x - 20, coord.y);
  // ↓
  await page.mouse.move(coord.x - 20, coord.y + 90);
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

test('should keep selection state on scroll', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);

  await assertRichTexts(page, ['123', '456', '789']);

  for (let i = 0; i < 31; i++) {
    await pressEnter(page);
  }

  await type(page, '987');
  await pressEnter(page);
  await type(page, '654');
  await pressEnter(page);
  await type(page, '321');

  const data = new Array(30).fill(`
`);
  data.unshift(...['123', '456', '789']);
  data.push(...['987', '654', '321']);
  await assertRichTexts(page, data);
});
