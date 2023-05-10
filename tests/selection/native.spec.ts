/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { expect } from '@playwright/test';

import {
  activeEmbed,
  activeFrameInEdgeless,
  addFrameByClick,
  copyByKeyboard,
  dragBetweenCoords,
  dragBetweenIndices,
  enterPlaygroundRoom,
  fillLine,
  focusRichText,
  focusTitle,
  getCenterPosition,
  getCursorBlockIdAndHeight,
  getIndexCoordinate,
  getRichTextBoundingBox,
  getSelectedText,
  getSelectedTextByVirgo,
  getVirgoSelectionIndex,
  getVirgoSelectionText,
  initEmptyEdgelessState,
  initEmptyParagraphState,
  initImageState,
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
  redoByKeyboard,
  SHORT_KEY,
  switchEditorMode,
  type,
  undoByKeyboard,
  waitNextFrame,
} from '../utils/actions/index.js';
import {
  assertBlockCount,
  assertClipItems,
  assertDivider,
  assertRichTexts,
  assertSelection,
  assertStoreMatchJSX,
  assertTitle,
} from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

test('click on blank area', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  const box123 = await getRichTextBoundingBox(page, '2');
  const inside123 = { x: box123.left, y: box123.top + 5 };
  await page.mouse.click(inside123.x, inside123.y);
  await assertSelection(page, 0, 0, 0);

  const box456 = await getRichTextBoundingBox(page, '3');
  const inside456 = { x: box456.left, y: box456.top + 5 };
  await page.mouse.click(inside456.x, inside456.y);
  await assertSelection(page, 1, 0, 0);

  const box789 = await getRichTextBoundingBox(page, '4');
  const inside789 = { x: box789.left, y: box789.bottom - 5 };
  await page.mouse.click(inside789.x, inside789.y);
  await assertSelection(page, 2, 0, 0);
});

test('native range delete', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  const box123 = await getRichTextBoundingBox(page, '2');
  const inside123 = { x: box123.left + 1, y: box123.top + 1 };

  const box789 = await getRichTextBoundingBox(page, '4');
  const inside789 = { x: box789.right - 1, y: box789.bottom - 1 };

  // from top to bottom
  await dragBetweenCoords(page, inside123, inside789);
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

  const box123 = await getRichTextBoundingBox(page, '2');
  const inside123 = { x: box123.left + 1, y: box123.top + 1 };

  const box789 = await getRichTextBoundingBox(page, '4');
  const inside789 = { x: box789.right - 1, y: box789.bottom - 1 };

  // from top to bottom
  await dragBetweenCoords(page, inside123, inside789);
  await page.keyboard.press('a');
  await assertBlockCount(page, 'paragraph', 1);
  await assertRichTexts(page, ['a']);
});

test('native range selection backwards', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  const box123 = await getRichTextBoundingBox(page, '2');
  const above123 = { x: box123.left, y: box123.top - 2 };

  const box789 = await getRichTextBoundingBox(page, '4');
  const bottomRight789 = { x: box789.right, y: box789.bottom };

  // from bottom to top
  await dragBetweenCoords(page, bottomRight789, above123);
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

  const hello = await getRichTextBoundingBox(page, '2');
  const helloPosition = { x: hello.x + 2, y: hello.y + 8 };

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

  const box123 = await getRichTextBoundingBox(page, '2');
  const above123 = { x: box123.left - 20, y: box123.top - 20 };

  const box789 = await getRichTextBoundingBox(page, '4');
  const below789 = { x: box789.right + 30, y: box789.bottom + 50 };

  await dragBetweenCoords(page, below789, above123, { steps: 50 });
  await page.keyboard.press('Enter', { delay: 50 });
  await type(page, 'abc');
  await assertRichTexts(page, ['123', '456', '789', 'abc']);
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

test('Change title when first content is divider', async ({ page }) => {
  test.info().annotations.push({
    type: 'issue',
    description: 'https://github.com/toeverything/blocksuite/issues/1004',
  });
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

  await pressBackspace(page);
  await waitNextFrame(page);
  await assertRichTexts(page, ['123456', '789']);

  await undoByKeyboard(page);
  await waitNextFrame(page);
  await page.mouse.click(rect.right + 50, rect.top + 5);

  await pressBackspace(page);
  await waitNextFrame(page);
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
  await pressArrowDown(page);
  await waitNextFrame(page);
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
  await waitNextFrame(page);

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
  await page.waitForTimeout(200);
  await type(page, 'ABC');
  await page.waitForTimeout(200);
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

  const box456 = await getRichTextBoundingBox(page, '3');
  const inside456 = { x: box456.left + 1, y: box456.top + 1 };

  const box789 = await getRichTextBoundingBox(page, '4');
  const inside789 = { x: box789.right - 1, y: box789.bottom - 1 };

  // from top to bottom
  await dragBetweenCoords(page, inside456, inside789);

  await page.keyboard.press('Tab');

  await assertStoreMatchJSX(
    page,
    `<affine:page>
  <affine:frame
    prop:background="--affine-background-secondary-color"
  >
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
  const rects = page.locator('affine-selected-blocks > *');
  await expect(rects).toHaveCount(1);
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

test('should not show option menu of image on native selection', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initImageState(page);
  await activeEmbed(page);

  await expect(
    page.locator('.affine-embed-editing-state-container')
  ).toHaveCount(1);

  await pressEnter(page);
  await type(page, '123');

  await page.mouse.click(0, 0);

  await dragBetweenIndices(
    page,
    [0, 1],
    [0, 0],
    { x: 0, y: 0 },
    { x: -40, y: 0 }
  );

  await page.waitForTimeout(50);

  await copyByKeyboard(page);
  await assertClipItems(page, 'text/plain', '123');

  await page.mouse.click(0, 0);

  await dragBetweenIndices(
    page,
    [0, 1],
    [0, 0],
    { x: 0, y: 0 },
    { x: -40, y: -100 }
  );

  await page.waitForTimeout(50);

  await copyByKeyboard(page);
  await assertClipItems(page, 'text/plain', '123');

  await expect(
    page.locator('.affine-embed-editing-state-container')
  ).toHaveCount(0);
});

test('should be cleared when dragging block card from BlockHub', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await dragBetweenIndices(page, [0, 0], [2, 3]);
  expect(await getSelectedText(page)).toBe('123456789');

  await page.click('.block-hub-menu-container [role="menuitem"]');
  await page.waitForTimeout(200);
  const blankMenu = '.block-hub-icon-container:nth-child(1)';

  const blankMenuRect = await getCenterPosition(page, blankMenu);
  const targetPos = await getCenterPosition(page, '[data-block-id="2"]');
  await dragBetweenCoords(
    page,
    { x: blankMenuRect.x, y: blankMenuRect.y },
    { x: targetPos.x, y: targetPos.y + 5 },
    { steps: 50 }
  );

  expect(await getSelectedText(page)).toBe('');
});

test('should select with shift-click', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await dragBetweenIndices(page, [0, 0], [1, 1]);
  expect(await getSelectedText(page)).toBe('1234');

  await page.click('[data-block-id="4"]', {
    modifiers: ['Shift'],
  });
  expect(await getSelectedText(page)).toBe('123456789');
});

test('should collapse to end when press arrow-right on multi-line selection', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);
  await dragBetweenIndices(page, [0, 0], [1, 2]);
  expect(await getSelectedText(page)).toBe('12345');
  await pressArrowRight(page);
  await pressBackspace(page);
  await assertRichTexts(page, ['123', '46', '789']);
});

test('should collapse to start when press arrow-left on multi-line selection', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await dragBetweenIndices(page, [0, 1], [1, 2]);
  expect(await getSelectedText(page)).toBe('2345');
  await pressArrowLeft(page);
  await pressBackspace(page);
  await assertRichTexts(page, ['23', '456', '789']);
});

test('should select when clicking on blank area in edgeless mode', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  const ids = await initEmptyEdgelessState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await switchEditorMode(page);
  await activeFrameInEdgeless(page, ids.frameId);

  const r1 = await page.locator('[data-block-id="3"]').boundingBox();
  const r2 = await page.locator('[data-block-id="4"]').boundingBox();
  const r3 = await page.locator('[data-block-id="5"]').boundingBox();
  if (!r1 || !r2 || !r3) {
    throw new Error();
  }

  await focusRichText(page, 2);

  await dragBetweenCoords(
    page,
    { x: r3.x + r3.width / 2, y: r3.y - (r3.y - (r2.y + r2.height)) / 2 },
    { x: r3.x + r3.width / 2, y: r2.y - (r2.y - (r1.y + r1.height)) / 2 },
    { steps: 50 }
  );

  expect(await getVirgoSelectionText(page)).toBe('456');
});
