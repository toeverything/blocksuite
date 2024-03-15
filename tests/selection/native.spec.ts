/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { expect } from '@playwright/test';

import {
  activeEmbed,
  activeNoteInEdgeless,
  addNoteByClick,
  click,
  copyByKeyboard,
  dragBetweenCoords,
  dragBetweenIndices,
  enterPlaygroundRoom,
  fillLine,
  focusRichText,
  focusTitle,
  getCenterPosition,
  getCursorBlockIdAndHeight,
  getEditorHostLocator,
  getIndexCoordinate,
  getInlineSelectionIndex,
  getInlineSelectionText,
  getRichTextBoundingBox,
  getSelectedText,
  getSelectedTextByInlineEditor,
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
  pressEscape,
  pressForwardDelete,
  pressShiftEnter,
  pressShiftTab,
  pressTab,
  redoByKeyboard,
  resetHistory,
  scrollToTop,
  selectAllByKeyboard,
  setInlineRangeInInlineEditor,
  SHORT_KEY,
  switchEditorMode,
  type,
  undoByKeyboard,
  waitNextFrame,
} from '../utils/actions/index.js';
import {
  assertBlockCount,
  assertBlockSelections,
  assertClipItems,
  assertDivider,
  assertExists,
  assertNativeSelectionRangeCount,
  assertRichTextInlineRange,
  assertRichTexts,
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
  await assertRichTextInlineRange(page, 0, 0, 0);

  const box456 = await getRichTextBoundingBox(page, '3');
  const inside456 = { x: box456.left, y: box456.top + 5 };
  await page.mouse.click(inside456.x, inside456.y);
  await assertRichTextInlineRange(page, 1, 0, 0);

  const box789 = await getRichTextBoundingBox(page, '4');
  const inside789 = { x: box789.left, y: box789.bottom - 5 };
  await page.mouse.click(inside789.x, inside789.y);
  await assertRichTextInlineRange(page, 2, 0, 0);
});

test('native range delete', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await dragBetweenIndices(page, [0, 0], [2, 3]);
  await pressBackspace(page);
  await assertBlockCount(page, 'paragraph', 1);
  await assertRichTexts(page, ['']);

  await waitNextFrame(page);
  await undoByKeyboard(page);
  await assertRichTexts(page, ['123', '456', '789']);
  await redoByKeyboard(page);
  await assertRichTexts(page, ['']);
});

test('native range delete with indent', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyParagraphState(page);

  await focusRichText(page);
  await type(page, '123');
  await pressEnter(page);
  await type(page, '456');
  await pressEnter(page);
  await type(page, '789');
  await pressEnter(page);
  await type(page, 'abc');
  await pressEnter(page);
  await type(page, 'def');
  await pressEnter(page);
  await type(page, 'ghi');
  await resetHistory(page);

  await focusRichText(page, 1);
  await pressTab(page);
  await focusRichText(page, 2);
  await pressTab(page, 2);
  await focusRichText(page, 4);
  await pressTab(page);
  await focusRichText(page, 5);
  await pressTab(page, 2);

  // 123
  //   456
  //     789
  // abc
  //   def
  //     ghi

  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:displayMode="both"
  prop:edgeless={
    Object {
      "style": Object {
        "borderRadius": 8,
        "borderSize": 4,
        "borderStyle": "solid",
        "shadowType": "--affine-note-shadow-box",
      },
    }
  }
  prop:hidden={false}
  prop:index="a0"
>
  <affine:paragraph
    prop:text="123"
    prop:type="text"
  >
    <affine:paragraph
      prop:text="456"
      prop:type="text"
    >
      <affine:paragraph
        prop:text="789"
        prop:type="text"
      />
    </affine:paragraph>
  </affine:paragraph>
  <affine:paragraph
    prop:text="abc"
    prop:type="text"
  >
    <affine:paragraph
      prop:text="def"
      prop:type="text"
    >
      <affine:paragraph
        prop:text="ghi"
        prop:type="text"
      />
    </affine:paragraph>
  </affine:paragraph>
</affine:note>`,
    noteId
  );

  await dragBetweenIndices(page, [0, 2], [4, 1]);

  // 12|3
  //   456
  //     789
  // abc
  //   d|ef
  //     ghi

  await pressBackspace(page);
  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:displayMode="both"
  prop:edgeless={
    Object {
      "style": Object {
        "borderRadius": 8,
        "borderSize": 4,
        "borderStyle": "solid",
        "shadowType": "--affine-note-shadow-box",
      },
    }
  }
  prop:hidden={false}
  prop:index="a0"
>
  <affine:paragraph
    prop:text="12ef"
    prop:type="text"
  />
  <affine:paragraph
    prop:text="ghi"
    prop:type="text"
  />
</affine:note>`,
    noteId
  );

  await waitNextFrame(page);
  await undoByKeyboard(page);

  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:displayMode="both"
  prop:edgeless={
    Object {
      "style": Object {
        "borderRadius": 8,
        "borderSize": 4,
        "borderStyle": "solid",
        "shadowType": "--affine-note-shadow-box",
      },
    }
  }
  prop:hidden={false}
  prop:index="a0"
>
  <affine:paragraph
    prop:text="123"
    prop:type="text"
  >
    <affine:paragraph
      prop:text="456"
      prop:type="text"
    >
      <affine:paragraph
        prop:text="789"
        prop:type="text"
      />
    </affine:paragraph>
  </affine:paragraph>
  <affine:paragraph
    prop:text="abc"
    prop:type="text"
  >
    <affine:paragraph
      prop:text="def"
      prop:type="text"
    >
      <affine:paragraph
        prop:text="ghi"
        prop:type="text"
      />
    </affine:paragraph>
  </affine:paragraph>
</affine:note>`,
    noteId
  );
  await redoByKeyboard(page);
  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:displayMode="both"
  prop:edgeless={
    Object {
      "style": Object {
        "borderRadius": 8,
        "borderSize": 4,
        "borderStyle": "solid",
        "shadowType": "--affine-note-shadow-box",
      },
    }
  }
  prop:hidden={false}
  prop:index="a0"
>
  <affine:paragraph
    prop:text="12ef"
    prop:type="text"
  />
  <affine:paragraph
    prop:text="ghi"
    prop:type="text"
  />
</affine:note>`,
    noteId
  );
});

test('native range delete by forwardDelete', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  const box123 = await getRichTextBoundingBox(page, '2');
  const inside123 = { x: box123.left - 1, y: box123.top + 1 };

  const box789 = await getRichTextBoundingBox(page, '4');
  const inside789 = { x: box789.right - 1, y: box789.bottom - 1 };

  // from top to bottom
  await dragBetweenCoords(page, inside123, inside789, { steps: 50 });
  await pressForwardDelete(page);
  await assertBlockCount(page, 'paragraph', 1);
  await assertRichTexts(page, ['']);

  await waitNextFrame(page);
  await undoByKeyboard(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await redoByKeyboard(page);
  await assertRichTexts(page, ['']);
});

test('native range input', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  const box123 = await getRichTextBoundingBox(page, '2');
  const inside123 = { x: box123.left - 1, y: box123.top + 1 };

  const box789 = await getRichTextBoundingBox(page, '4');
  const inside789 = { x: box789.right - 1, y: box789.bottom - 1 };

  // from top to bottom
  await dragBetweenCoords(page, inside123, inside789, { steps: 50 });
  await pressForwardDelete(page);
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
  await dragBetweenCoords(page, bottomRight789, above123, { steps: 10 });
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

test('native range selection backwards by forwardDelete', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  const box123 = await getRichTextBoundingBox(page, '2');
  const above123 = { x: box123.left, y: box123.top - 2 };

  const box789 = await getRichTextBoundingBox(page, '4');
  const bottomRight789 = { x: box789.right, y: box789.bottom };

  // from bottom to top
  await dragBetweenCoords(page, bottomRight789, above123, { steps: 10 });
  await pressForwardDelete(page);
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

  await pressArrowUp(page);
  const textOne = await getInlineSelectionText(page);
  expect(textOne).toBe('arrow down test 1');

  await pressArrowDown(page);
  const textTwo = await getInlineSelectionText(page);
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
  const indexOne = await getInlineSelectionIndex(page);
  const textOne = await getInlineSelectionText(page);
  expect(textOne).toBe('arrow down test 2');
  expect(indexOne).toBe(13);
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('ArrowLeft');
  }
  await page.keyboard.press('ArrowUp');
  const indexTwo = await getInlineSelectionIndex(page);
  const textTwo = await getInlineSelectionText(page);
  expect(textTwo).toBe('arrow down test 1');
  expect(indexTwo).toBeGreaterThanOrEqual(12);
  expect(indexTwo).toBeLessThanOrEqual(17);
  await page.keyboard.press('ArrowDown');
  const textThree = await getInlineSelectionText(page);
  expect(textThree).toBe('arrow down test 2');
});

test('cursor move left and right', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'arrow down test 1');
  await pressEnter(page);
  await type(page, 'arrow down test 2');
  const index1 = await getInlineSelectionIndex(page);
  expect(index1).toBe(17);
  await pressArrowLeft(page, 17);
  const index2 = await getInlineSelectionIndex(page);
  expect(index2).toBe(0);
  await pressArrowLeft(page);
  const index3 = await getInlineSelectionIndex(page);
  expect(index3).toBe(17);
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

test('cursor move up and down through note', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await addNoteByClick(page);
  await focusRichText(page, 0);
  let currentId: string | null;
  const [id] = await getCursorBlockIdAndHeight(page);
  await pressArrowDown(page);
  currentId = (await getCursorBlockIdAndHeight(page))[0];
  expect(id).not.toBe(currentId);
  await pressArrowUp(page);
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

  await dragBetweenIndices(page, [0, 0], [2, 3], undefined, undefined, {
    steps: 20,
  });
  await pressBackspace(page);
  await type(page, 'abc');
  const textOne = await getInlineSelectionText(page);
  expect(textOne).toBe('abc');
});

test('select all text with dragging and delete by forwardDelete', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await dragBetweenIndices(page, [0, 0], [2, 3], undefined, undefined, {
    steps: 20,
  });
  await pressForwardDelete(page);
  await type(page, 'abc');
  const textOne = await getInlineSelectionText(page);
  expect(textOne).toBe('abc');
});

test('select all text with keyboard delete', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await focusRichText(page);
  await selectAllByKeyboard(page);
  await pressBackspace(page);
  const text1 = await getInlineSelectionText(page);
  expect(text1).toBe('');
  await type(page, 'abc');
  const text2 = await getInlineSelectionText(page);
  expect(text2).toBe('abc');

  await selectAllByKeyboard(page);
  await selectAllByKeyboard(page);
  await pressBackspace(page);
  await assertRichTexts(page, ['', '456', '789']);

  await type(page, 'abc');
  await selectAllByKeyboard(page);
  await selectAllByKeyboard(page);
  await selectAllByKeyboard(page);
  await pressBackspace(page);
  await assertRichTexts(page, ['']);
});

test('select text leaving a few words in the last line and delete', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await dragBetweenIndices(page, [0, 0], [2, 1], undefined, undefined, {
    steps: 20,
  });
  await page.keyboard.press('Backspace');
  await waitNextFrame(page);
  await type(page, 'abc');
  const textOne = await getInlineSelectionText(page);
  expect(textOne).toBe('abc89');
});

test('select text leaving a few words in the last line and delete by forwardDelete', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await dragBetweenIndices(page, [0, 0], [2, 1], undefined, undefined, {
    steps: 20,
  });
  await pressForwardDelete(page);
  await waitNextFrame(page);
  await type(page, 'abc');
  const textOne = await getInlineSelectionText(page);
  expect(textOne).toBe('abc89');
});

test('select text in the same line with dragging leftward and move outside the affine-note', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  const noteLeft = await page.evaluate(() => {
    const note = document.querySelector('affine-note');
    if (!note) {
      throw new Error();
    }
    return note.getBoundingClientRect().left;
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
      steps: 20,
      async beforeMouseUp() {
        await page.mouse.move(
          noteLeft - 1,
          blockRect.top + blockRect.height / 2
        );
      },
    }
  );
  await pressBackspace(page);
  await type(page, 'abc');
  await assertRichTexts(page, ['123', 'abc', '789']);
});

test('select text in the same line with dragging leftward and move outside the affine-note by forwardDelete', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  const noteLeft = await page.evaluate(() => {
    const note = document.querySelector('affine-note');
    if (!note) {
      throw new Error();
    }
    return note.getBoundingClientRect().left;
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
      steps: 20,
      async beforeMouseUp() {
        await page.mouse.move(
          noteLeft - 1,
          blockRect.top + blockRect.height / 2
        );
      },
    }
  );
  await pressForwardDelete(page);
  await type(page, 'abc');
  await assertRichTexts(page, ['123', 'abc', '789']);
});

test('select text in the same line with dragging rightward and move outside the affine-note', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  const noteRight = await page.evaluate(() => {
    const note = document.querySelector('affine-note');
    if (!note) {
      throw new Error();
    }
    return note.getBoundingClientRect().right;
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
      steps: 20,
      async beforeMouseUp() {
        await page.mouse.move(
          noteRight + 1,
          blockRect.top + blockRect.height / 2
        );
      },
    }
  );
  await pressBackspace(page);
  await type(page, 'abc');
  const textOne = await getInlineSelectionText(page);
  expect(textOne).toBe('abc');
});

test('select text in the same line with dragging rightward and move outside the affine-note by forwardDelete', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  const noteRight = await page.evaluate(() => {
    const note = document.querySelector('affine-note');
    if (!note) {
      throw new Error();
    }
    return note.getBoundingClientRect().right;
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
      steps: 20,
      async beforeMouseUp() {
        await page.mouse.move(
          noteRight + 1,
          blockRect.top + blockRect.height / 2
        );
      },
    }
  );
  await pressForwardDelete(page);
  await type(page, 'abc');
  const textOne = await getInlineSelectionText(page);
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
  await page.mouse.click(20, 20);

  const box123 = await getRichTextBoundingBox(page, '2');
  const above123 = { x: box123.left + 100, y: box123.top };

  const box789 = await getRichTextBoundingBox(page, '4');
  const below789 = { x: box789.right + 30, y: box789.bottom + 50 };

  await dragBetweenCoords(page, below789, above123, { steps: 50 });
  await page.waitForTimeout(300);

  await pressEnter(page);
  await pressEnter(page);
  await type(page, 'abc');
  await assertRichTexts(page, ['123', '456', '789', 'abc']);
});

test('drag to select tagged text, and copy', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await focusRichText(page);
  await page.keyboard.insertText('123456789');
  await assertRichTexts(page, ['123456789']);

  await dragBetweenIndices(page, [0, 1], [0, 3], undefined, undefined, {
    steps: 20,
  });
  await page.keyboard.press(`${SHORT_KEY}+B`);
  await dragBetweenIndices(page, [0, 0], [0, 5], undefined, undefined, {
    steps: 20,
  });
  await page.keyboard.press(`${SHORT_KEY}+C`);
  const textOne = await getSelectedTextByInlineEditor(page);
  expect(textOne).toBe('12345');
});

test('drag to select tagged text, and input character', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await focusRichText(page);
  await page.keyboard.insertText('123456789');
  await assertRichTexts(page, ['123456789']);

  await dragBetweenIndices(page, [0, 1], [0, 3], undefined, undefined, {
    steps: 20,
  });
  await page.keyboard.press(`${SHORT_KEY}+B`);
  await dragBetweenIndices(page, [0, 0], [0, 5], undefined, undefined, {
    steps: 20,
  });
  await type(page, '1');
  const textOne = await getInlineSelectionText(page);
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
  await pressEscape(page);
  await pressArrowUp(page);
  await copyByKeyboard(page);
  await pressArrowDown(page);
  await pressEnter(page);
  await pasteByKeyboard(page);
  await assertDivider(page, 2);
});

test('Delete the blank line between two dividers', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, '--- ');
  await assertDivider(page, 1);

  await waitNextFrame(page);
  await pressEnter(page);
  await type(page, '--- ');
  await assertDivider(page, 2);
  await assertRichTexts(page, ['', '']);

  await pressArrowUp(page);
  await assertBlockSelections(page, [['0', '1', '5']]);
  await pressArrowUp(page);
  await assertBlockSelections(page, []);
  await assertRichTextInlineRange(page, 0, 0);
  await pressBackspace(page);
  await assertRichTexts(page, ['']);
  await assertBlockSelections(page, [['0', '1', '3']]);
  await assertDivider(page, 2);
});

test('Delete the second divider between two dividers by forwardDelete', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, '--- ');
  await assertDivider(page, 1);

  await pressEnter(page);
  await type(page, '--- ');
  await assertDivider(page, 2);
  await pressEscape(page);
  await pressArrowUp(page);
  await pressForwardDelete(page);
  await assertDivider(page, 1);
  await assertRichTexts(page, ['', '', '']);
});

test('should delete line with content after divider not lose content', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, '--- ');
  await type(page, '123');
  await assertDivider(page, 1);
  // Jump to line start
  await page.keyboard.press(`${SHORT_KEY}+ArrowLeft`, { delay: 50 });
  await waitNextFrame(page);
  await pressBackspace(page, 2);
  await assertDivider(page, 0);
  await assertRichTexts(page, ['', '123']);
});

test('should forwardDelete divider works properly', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, '123');
  await pressEnter(page);
  await type(page, '--- ');
  await assertDivider(page, 1);
  // Jump to first line start
  await pressEscape(page);
  await pressArrowUp(page);
  await page.keyboard.press(`${SHORT_KEY}+ArrowRight`, { delay: 50 });
  await pressForwardDelete(page);
  await assertDivider(page, 0);
  await assertRichTexts(page, ['123', '', '']);
});

test('the cursor should move to closest editor block when clicking outside container', async ({
  page,
}) => {
  test.info().annotations.push({
    type: 'issue',
    description: 'https://github.com/toeverything/blocksuite/pull/570',
  });
  // This test only works in playwright or touch device!
  test.fail();
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  const text2 = page.locator('[data-block-id="3"] .inline-editor');
  const rect = await text2.boundingBox();
  assertExists(rect);

  // The behavior of mouse click is similar to touch in mobile device
  // await page.mouse.click(rect.x - 50, rect.y + 5);
  await page.mouse.move(rect.x - 50, rect.y + 5);
  await page.mouse.down();
  await page.mouse.up();

  await pressArrowLeft(page, 4);
  await pressBackspace(page);
  await waitNextFrame(page);
  await assertRichTexts(page, ['123456', '789']);

  await undoByKeyboard(page);
  await waitNextFrame(page);

  // await page.mouse.click(rect.x + rect.width + 50, rect.y + 5);
  await page.mouse.move(rect.x + rect.width + 50, rect.y + 5);
  await page.mouse.down();
  await page.mouse.up();
  await waitNextFrame(page);

  await pressArrowLeft(page);
  await pressBackspace(page);
  await waitNextFrame(page);
  await assertRichTexts(page, ['123', '46', '789']);
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
  assertClipItems(page, 'text/plain', '45');

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
  assertClipItems(page, 'text/plain', '45');
});

test('should set the last block to end the range after when leaving the affine-note', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await dragBetweenIndices(page, [0, 2], [2, 1]);
  await copyByKeyboard(page);
  assertClipItems(page, 'text/plain', '34567');
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
  assertClipItems(page, 'text/plain', '3456789');
});

test('should set the first block to start the range before when leaving the affine-note-block-container', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await dragBetweenIndices(page, [2, 1], [0, 2]);
  await copyByKeyboard(page);
  assertClipItems(page, 'text/plain', '34567');
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
  assertClipItems(page, 'text/plain', '1234567');
});

test('should select texts on cross-note dragging', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { rootId } = await initEmptyParagraphState(page);
  await initThreeParagraphs(page);

  await initEmptyParagraphState(page, rootId);

  // focus last block in first note
  await setInlineRangeInInlineEditor(
    page,
    {
      index: 3,
      length: 0,
    },
    3
  );
  // goto next note
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
  assertClipItems(page, 'text/plain', '3456789ABC');
});

test('should select full text of the first block when leaving the affine-note-block-container in edgeless mode', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  const ids = await initEmptyEdgelessState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await switchEditorMode(page);
  await activeNoteInEdgeless(page, ids.noteId);
  await dragBetweenIndices(page, [2, 1], [0, 2], undefined, undefined, {
    click: true,
  });
  await copyByKeyboard(page);
  assertClipItems(page, 'text/plain', '34567');

  const containerRect = await page.evaluate(() => {
    const container = document.querySelector('.affine-note-block-container');
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

  await type(page, 'ABC');
  await waitNextFrame(page);
  await assertRichTexts(page, ['123', '456', '789', 'ABC']);
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
  // 123
  // 45|6
  // 789|
  await page.mouse.move(coord.x + 26, coord.y + 90, { steps: 20 });
  await page.mouse.up();
  await page.keyboard.press('Backspace');
  await waitNextFrame(page);
  await assertRichTexts(page, ['123', '45']);

  await waitNextFrame(page);
  await undoByKeyboard(page);

  // blur
  await page.mouse.click(0, 0);
  await page.mouse.move(coord.x, coord.y);
  await page.mouse.down();
  await page.mouse.move(coord.x + 26, coord.y + 90, { steps: 20 });
  await page.mouse.up();
  await page.keyboard.press('Backspace');
  await waitNextFrame(page);
  await assertRichTexts(page, ['123', '45']);
});

test('should ndent native multi-selection block', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  const box456 = await getRichTextBoundingBox(page, '3');
  const inside456 = { x: box456.left + 1, y: box456.top + 1 };

  const box789 = await getRichTextBoundingBox(page, '4');
  const inside789 = { x: box789.right - 1, y: box789.bottom - 1 };

  // from top to bottom
  await dragBetweenCoords(page, inside456, inside789, { steps: 50 });

  await page.keyboard.press('Tab');

  await assertStoreMatchJSX(
    page,
    `
<affine:page>
  <affine:note
    prop:background="--affine-background-secondary-color"
    prop:displayMode="both"
    prop:edgeless={
      Object {
        "style": Object {
          "borderRadius": 8,
          "borderSize": 4,
          "borderStyle": "solid",
          "shadowType": "--affine-note-shadow-box",
        },
      }
    }
    prop:hidden={false}
    prop:index="a0"
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
  </affine:note>
</affine:page>`
  );
});

test('should unindent native multi-selection block', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  let box456 = await getRichTextBoundingBox(page, '3');
  let inside456 = { x: box456.left + 1, y: box456.top + 1 };

  let box789 = await getRichTextBoundingBox(page, '4');
  let inside789 = { x: box789.right - 1, y: box789.bottom - 1 };

  // from top to bottom
  await dragBetweenCoords(page, inside456, inside789, { steps: 50 });

  await page.keyboard.press('Tab');

  await assertStoreMatchJSX(
    page,
    `
<affine:page>
  <affine:note
    prop:background="--affine-background-secondary-color"
    prop:displayMode="both"
    prop:edgeless={
      Object {
        "style": Object {
          "borderRadius": 8,
          "borderSize": 4,
          "borderStyle": "solid",
          "shadowType": "--affine-note-shadow-box",
        },
      }
    }
    prop:hidden={false}
    prop:index="a0"
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
  </affine:note>
</affine:page>`
  );

  box456 = await getRichTextBoundingBox(page, '3');
  inside456 = { x: box456.left + 1, y: box456.top + 1 };

  box789 = await getRichTextBoundingBox(page, '4');
  inside789 = { x: box789.right - 1, y: box789.bottom - 1 };

  // from top to bottom
  await dragBetweenCoords(page, inside456, inside789, { steps: 50 });

  await pressShiftTab(page);

  await assertStoreMatchJSX(
    page,
    `
<affine:page>
  <affine:note
    prop:background="--affine-background-secondary-color"
    prop:displayMode="both"
    prop:edgeless={
      Object {
        "style": Object {
          "borderRadius": 8,
          "borderSize": 4,
          "borderStyle": "solid",
          "shadowType": "--affine-note-shadow-box",
        },
      }
    }
    prop:hidden={false}
    prop:index="a0"
  >
    <affine:paragraph
      prop:text="123"
      prop:type="text"
    />
    <affine:paragraph
      prop:text="456"
      prop:type="text"
    />
    <affine:paragraph
      prop:text="789"
      prop:type="text"
    />
  </affine:note>
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
    { x: 0, y: 0 },
    { steps: 20 }
  );

  const text0 = await getInlineSelectionText(page);

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
      x: first.right + 10,
      y: first.top + 1,
    },
    {
      x: first.right - 10,
      y: first.top + 2,
    }
  );

  await waitNextFrame(page);
  const textCount = await page.evaluate(() => {
    return window.getSelection()?.rangeCount || 0;
  });

  expect(text0).toBe('456');
  expect(textCount).toBe(0);
  const rects = page.locator('affine-block-selection').locator('visible=true');
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

  const data = Array.from({ length: 9 }, () => '');
  data.unshift('123', '456', '789');
  data.push('987', '654', '321');
  await assertRichTexts(page, data);

  const blockHeight = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-page-viewport');
    if (!viewport) {
      throw new Error();
    }
    const distance = viewport.scrollHeight - viewport.clientHeight;
    viewport.scrollTo(0, distance);
    const container = viewport.querySelector(
      'affine-note .affine-block-children-container'
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
  assertClipItems(page, 'text/plain', '987654321');
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

  const data = Array.from({ length: 9 }, () => '');
  data.unshift('123', '456', '789');
  data.push('987', '654', '321');
  await assertRichTexts(page, data);

  const blockHeight = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-page-viewport');
    if (!viewport) {
      throw new Error();
    }
    const container = viewport.querySelector(
      'affine-note .affine-block-children-container'
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
    document.querySelector('.affine-page-viewport')?.scrollTo(0, 0);
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
  assertClipItems(page, 'text/plain', '123456789');
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

  await pressEscape(page);
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

  await waitNextFrame(page);

  await copyByKeyboard(page);
  assertClipItems(page, 'text/plain', '123');

  await page.mouse.click(0, 0);

  await dragBetweenIndices(
    page,
    [0, 1],
    [0, 0],
    { x: 0, y: 0 },
    { x: -40, y: -100 }
  );

  await waitNextFrame(page);

  await copyByKeyboard(page);
  assertClipItems(page, 'text/plain', '123');

  await expect(
    page.locator('.affine-embed-editing-state-container')
  ).toHaveCount(0);
});

test.skip('should be cleared when dragging block card from BlockHub', async ({
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

  await focusRichText(page);

  await page.click('[data-block-id="4"] [data-v-text]', {
    modifiers: ['Shift'],
  });
  expect(await getSelectedText(page)).toContain('4567');
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
  await activeNoteInEdgeless(page, ids.noteId);

  const r1 = await page.locator('[data-block-id="3"]').boundingBox();
  const r2 = await page.locator('[data-block-id="4"]').boundingBox();
  const r3 = await page.locator('[data-block-id="5"]').boundingBox();
  if (!r1 || !r2 || !r3) {
    throw new Error();
  }

  await click(page, { x: r3.x + 40, y: r3.y + 5 });
  await waitNextFrame(page);

  expect(await getInlineSelectionText(page)).toBe('789');
});

test('press ArrowLeft in the start of first paragraph should not focus on title', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await focusRichText(page, 0);
  await type(page, '123');
  await pressArrowLeft(page, 5);

  await type(page, 'title');
  await assertTitle(page, '');
});

test('press ArrowUp and ArrowDown in the edge of two line', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await focusRichText(page, 0);
  await type(
    page,
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
  );
  await waitNextFrame(page);
  // - aaa... (no \n)
  //   a|
  await pressEnter(page);
  await waitNextFrame(page);
  await type(page, 'b');
  await pressShiftEnter(page);
  await waitNextFrame(page);
  await pressEnter(page);
  await assertRichTextInlineRange(page, 2, 0);
  // - aaa... (no \n)
  //   a
  // - b  (have \n)
  //
  // - |

  await pressArrowUp(page);
  await waitNextFrame(page);
  await assertRichTextInlineRange(page, 1, 2);
  // - aaa... (no \n)
  //   a
  // - b  (have \n)
  //   |
  // -

  await pressArrowUp(page);
  await waitNextFrame(page);
  await assertRichTextInlineRange(page, 1, 0);
  // - aaa... (no \n)
  //   a
  // - |b  (have \n)
  //
  // -

  await pressArrowRight(page);
  await waitNextFrame(page);
  await assertRichTextInlineRange(page, 1, 1);
  // - aaa... (no \n)
  //   a
  // - b|  (have \n)
  //
  // -

  await pressArrowUp(page);
  await pressArrowLeft(page);
  await waitNextFrame(page);
  await assertRichTextInlineRange(page, 0, 90);
  // - aaa... (no \n)
  //   |a
  // - b  (have \n)
  //
  // -

  await pressArrowUp(page);
  await waitNextFrame(page);
  await assertRichTextInlineRange(page, 0, 0);
  // - |aaa... (no \n)
  //   a
  // - b  (have \n)
  //
  // -

  await pressArrowUp(page);
  await waitNextFrame(page);
  await type(page, 'title');
  await assertTitle(page, 'title');

  await pressArrowDown(page);
  await waitNextFrame(page);
  await assertRichTextInlineRange(page, 0, 0);
  // - |aaa... (no \n)
  //   a
  // - b  (have \n)
  //
  // -

  await pressArrowDown(page);
  await waitNextFrame(page);
  await assertRichTextInlineRange(page, 0, 90);
  // - aaa... (no \n)
  //   |a
  // - b  (have \n)
  //
  // -

  await pressArrowDown(page);
  await waitNextFrame(page);
  await assertRichTextInlineRange(page, 1, 0);
  // - aaa... (no \n)
  //   a
  // - |b  (have \n)
  //
  // -

  await pressArrowRight(page);
  await waitNextFrame(page);
  await assertRichTextInlineRange(page, 1, 1);
  // - aaa... (no \n)
  //   a
  // - b|  (have \n)
  //
  // -

  await pressArrowDown(page);
  await waitNextFrame(page);
  await assertRichTextInlineRange(page, 1, 2);
  // - aaa... (no \n)
  //   a
  // - b  (have \n)
  //   |
  // -

  await pressArrowDown(page);
  await waitNextFrame(page);
  await assertRichTextInlineRange(page, 2, 0);
  // - aaa... (no \n)
  //   a
  // - b  (have \n)
  //
  // - |
});

test('should not scroll page when mouse is click down', async ({ page }) => {
  test.info().annotations.push({
    type: 'issue',
    description: 'https://github.com/toeverything/blocksuite/issues/5034',
  });
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  for (let i = 0; i < 10; i++) {
    await pressEnter(page);
  }
  for (let i = 0; i < 20; i++) {
    await type(page, String(i));
    await pressShiftEnter(page);
  }
  await assertRichTexts(page, [
    ...' '.repeat(9).split(' '), // 10 empty paragraph
    '0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12\n13\n14\n15\n16\n17\n18\n19\n',
  ]);

  await scrollToTop(page);
  await focusRichText(page, 0);

  const editorHost = getEditorHostLocator(page);
  const longText = editorHost.locator('rich-text').nth(10);
  const rect = await longText.boundingBox();
  if (!rect) throw new Error();
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
  await assertRichTextInlineRange(page, 0, 0);

  await page.mouse.down();
  await assertRichTextInlineRange(page, 10, 22);
  // simulate user click down and wait for 500ms
  await waitNextFrame(page, 500);
  await page.mouse.up();
  await assertRichTextInlineRange(page, 10, 22);
});

test('scroll vertically when inputting long text in a block', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  for (let i = 0; i < 40; i++) {
    await type(page, String(i));
    await pressShiftEnter(page);
  }

  const viewportScrollTop = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-page-viewport');
    if (!viewport) {
      throw new Error('viewport not found');
    }
    return viewport.scrollTop;
  });

  expect(viewportScrollTop).toBeGreaterThan(100);
});

test('scroll vertically when adding multiple blocks', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  for (let i = 0; i < 40; i++) {
    await type(page, String(i));
    await pressEnter(page);
  }

  const viewportScrollTop = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-page-viewport');
    if (!viewport) {
      throw new Error('viewport not found');
    }
    return viewport.scrollTop;
  });

  expect(viewportScrollTop).toBeGreaterThan(400);
});

test('click to select divided', async ({ page }) => {
  test.info().annotations.push({
    type: 'issue',
    description: 'https://github.com/toeverything/blocksuite/issues/4547',
  });

  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await focusRichText(page);
  await type(page, '--- ');
  await assertDivider(page, 1);

  await page.click('affine-divider');
  const selectedBlocks = page
    .locator('affine-block-selection')
    .locator('visible=true');
  await expect(selectedBlocks).toHaveCount(1);

  await pressForwardDelete(page);
  await assertDivider(page, 0);
});

test('auto-scroll when creating a new paragraph-block by pressing enter', async ({
  page,
}) => {
  test.info().annotations.push({
    type: 'issue',
    description: 'https://github.com/toeverything/blocksuite/issues/4547',
  });

  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await focusRichText(page);
  await pressEnter(page, 50);

  const scrollTop = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-page-viewport');
    if (!viewport) {
      throw new Error();
    }
    return viewport.scrollTop;
  });
  expect(scrollTop).toBeGreaterThan(1000);
});

test('Use arrow up and down to select two types of block', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, '123');
  await pressEnter(page);
  await type(page, '--- --- ');
  await type(page, '123');
  await pressEnter(page);
  await type(page, '--- 123');
  // 123
  // ---
  // ---
  // 123
  // ---
  // 123

  await assertDivider(page, 3);
  await assertRichTexts(page, ['123', '123', '123']);

  // from bottom to top
  await assertNativeSelectionRangeCount(page, 1);
  await assertRichTextInlineRange(page, 2, 3);
  await pressArrowUp(page);
  await assertNativeSelectionRangeCount(page, 0);
  await assertBlockSelections(page, [['0', '1', '7']]);
  await pressArrowUp(page);
  await assertNativeSelectionRangeCount(page, 1);
  await assertRichTextInlineRange(page, 1, 3);
  await pressArrowUp(page);
  await assertNativeSelectionRangeCount(page, 0);
  await assertBlockSelections(page, [['0', '1', '5']]);
  await pressArrowUp(page);
  await assertNativeSelectionRangeCount(page, 0);
  await assertBlockSelections(page, [['0', '1', '4']]);
  await pressArrowUp(page);
  await assertNativeSelectionRangeCount(page, 1);
  await assertRichTextInlineRange(page, 0, 3);

  // from top to bottom
  await pressArrowDown(page);
  await assertNativeSelectionRangeCount(page, 0);
  await assertBlockSelections(page, [['0', '1', '4']]);
  await pressArrowDown(page);
  await assertNativeSelectionRangeCount(page, 0);
  await assertBlockSelections(page, [['0', '1', '5']]);
  await pressArrowDown(page);
  await assertNativeSelectionRangeCount(page, 1);
  await assertRichTextInlineRange(page, 1, 0);
  await pressArrowDown(page);
  await assertNativeSelectionRangeCount(page, 0);
  await assertBlockSelections(page, [['0', '1', '7']]);
  await pressArrowDown(page);
  await assertNativeSelectionRangeCount(page, 1);
  await assertRichTextInlineRange(page, 2, 0);
});
