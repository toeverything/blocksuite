import { expect } from '@playwright/test';

import {
  clickBlockTypeMenuItem,
  dragOverTitle,
  enterPlaygroundRoom,
  focusRichText,
  focusTitle,
  initEmptyEdgelessState,
  initEmptyParagraphState,
  initThreeParagraphs,
  pressArrowDown,
  pressArrowLeft,
  pressArrowUp,
  pressBackspace,
  pressEnter,
  pressShiftEnter,
  pressShiftTab,
  pressTab,
  redoByClick,
  redoByKeyboard,
  resetHistory,
  type,
  undoByClick,
  undoByKeyboard,
  waitDefaultPageLoaded,
  waitNextFrame,
} from './utils/actions/index.js';
import {
  assertBlockChildrenFlavours,
  assertBlockChildrenIds,
  assertBlockCount,
  assertBlockType,
  assertClassName,
  assertPageTitleFocus,
  assertRichTexts,
  assertSelection,
  assertStoreMatchJSX,
  assertTitle,
} from './utils/asserts.js';
import { test } from './utils/playwright.js';

test('init paragraph by page title enter at last', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await waitDefaultPageLoaded(page);
  await focusTitle(page);
  await type(page, 'hello');
  await pressEnter(page);
  await type(page, 'world');

  await assertTitle(page, 'hello');
  await assertRichTexts(page, ['world', '']);

  //#region Fixes: https://github.com/toeverything/blocksuite/issues/1007
  test.info().annotations.push({
    type: 'issue',
    description: 'https://github.com/toeverything/blocksuite/issues/1007',
  });
  await page.keyboard.press('ArrowLeft');
  await focusTitle(page);
  await pressEnter(page);
  await assertRichTexts(page, ['', 'world', '']);
  //#endregion
});

test('init paragraph by page title enter in middle', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await waitDefaultPageLoaded(page);
  await focusTitle(page);
  await type(page, 'hello');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await pressEnter(page);

  await assertTitle(page, 'he');
  await assertRichTexts(page, ['llo', '']);
});

test('drag over paragraph title', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await waitDefaultPageLoaded(page);
  await focusTitle(page);
  await type(page, 'hello');
  await assertTitle(page, 'hello');
  await resetHistory(page);

  await dragOverTitle(page);
  await page.keyboard.press('Backspace', { delay: 100 });
  await assertTitle(page, '');

  await undoByKeyboard(page);
  await assertTitle(page, 'hello');
});

test('backspace and arrow on title', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await waitDefaultPageLoaded(page);
  await focusTitle(page);
  await type(page, 'hello');
  await assertTitle(page, 'hello');
  await resetHistory(page);

  await pressBackspace(page);
  await assertTitle(page, 'hell');

  await page.keyboard.press('ArrowLeft', { delay: 50 });
  await page.keyboard.press('ArrowLeft', { delay: 50 });
  await pressBackspace(page);
  await assertTitle(page, 'hll');

  await page.keyboard.press('ArrowDown', { delay: 50 });
  await assertSelection(page, 0, 0, 0);

  await undoByKeyboard(page);
  await assertTitle(page, 'hello');

  await redoByKeyboard(page);
  await assertTitle(page, 'hll');
});

for (const { initState, desc } of [
  {
    initState: initEmptyParagraphState,
    desc: 'without surface',
  },
  {
    initState: initEmptyEdgelessState,
    desc: 'with surface',
  },
]) {
  test(`backspace on line start of the first block (${desc})`, async ({
    page,
  }) => {
    await enterPlaygroundRoom(page);
    await initState(page);
    await waitDefaultPageLoaded(page);
    await focusTitle(page);
    await type(page, 'hello');
    await assertTitle(page, 'hello');
    await resetHistory(page);

    await focusRichText(page, 0);
    await type(page, 'abc');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await assertSelection(page, 0, 0, 0);

    await pressBackspace(page);
    await assertTitle(page, 'helloabc');

    await pressEnter(page);
    await assertTitle(page, 'hello');
    await assertRichTexts(page, ['abc', '']);

    await pressBackspace(page);
    await assertTitle(page, 'helloabc');
    await assertRichTexts(page, ['']);
    await undoByClick(page);
    await assertTitle(page, 'hello');
    await assertRichTexts(page, ['abc', '']);

    await redoByClick(page);
    await assertTitle(page, 'helloabc');
    await assertRichTexts(page, ['']);
  });

  test(`backspace on line start of the first empty block (${desc})`, async ({
    page,
  }) => {
    await enterPlaygroundRoom(page);
    await initState(page);
    await focusTitle(page);

    await pressArrowDown(page);
    await pressBackspace(page);
    await assertBlockCount(page, 'paragraph', 1);

    await pressArrowDown(page);
    await assertSelection(page, 0, 0, 0);
  });
}

test('append new paragraph block by enter', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'hello');
  await assertSelection(page, 0, 5, 0);

  await pressEnter(page);
  await assertRichTexts(page, ['hello', '']);
  await assertSelection(page, 1, 0, 0);

  await undoByKeyboard(page);
  await waitNextFrame(page);
  await assertRichTexts(page, ['hello']);
  await assertSelection(page, 0, 5, 0);

  await redoByKeyboard(page);
  await waitNextFrame(page);
  await assertRichTexts(page, ['hello', '']);
  await assertSelection(page, 1, 0, 0);
});

test('insert new paragraph block by enter', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await pressEnter(page);
  await pressEnter(page);
  await assertRichTexts(page, ['', '', '']);

  await focusRichText(page, 1);
  await type(page, 'hello');
  await assertRichTexts(page, ['', 'hello', '']);

  await pressEnter(page);
  await type(page, 'world');
  await assertRichTexts(page, ['', 'hello', 'world', '']);
  await assertBlockChildrenFlavours(page, '1', [
    'affine:paragraph',
    'affine:paragraph',
    'affine:paragraph',
    'affine:paragraph',
  ]);
});

test('split paragraph block by enter', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  await type(page, 'hello');
  await assertRichTexts(page, ['hello']);

  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await assertSelection(page, 0, 2, 0);

  await pressEnter(page);
  await assertRichTexts(page, ['he', 'llo']);
  await assertBlockChildrenFlavours(page, '1', [
    'affine:paragraph',
    'affine:paragraph',
  ]);
  await assertSelection(page, 1, 0, 0);

  await undoByKeyboard(page);
  await assertRichTexts(page, ['hello']);

  await redoByKeyboard(page);
  await assertRichTexts(page, ['he', 'llo']);
});

test('split paragraph block with selected text by enter', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  await type(page, 'hello');
  await assertRichTexts(page, ['hello']);

  // select 'll'
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.down('Shift');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.up('Shift');
  await assertSelection(page, 0, 2, 2);

  await pressEnter(page);
  await assertRichTexts(page, ['he', 'o']);
  await assertBlockChildrenFlavours(page, '1', [
    'affine:paragraph',
    'affine:paragraph',
  ]);
  await assertSelection(page, 1, 0, 0);

  await undoByKeyboard(page);
  await assertRichTexts(page, ['hello']);

  await redoByKeyboard(page);
  await assertRichTexts(page, ['he', 'o']);
});

test('add multi line by soft enter', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  await type(page, 'hello');
  await assertRichTexts(page, ['hello']);

  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await assertSelection(page, 0, 2, 0);

  await pressShiftEnter(page);
  await assertRichTexts(page, ['he\nllo']);
  await assertSelection(page, 0, 3, 0);

  await undoByKeyboard(page);
  await assertRichTexts(page, ['hello']);

  await redoByKeyboard(page);
  await assertRichTexts(page, ['he\nllo']);
});

test('indent and unindent existing paragraph block', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'hello');

  await pressEnter(page);
  await focusRichText(page, 1);
  await type(page, 'world');
  await assertRichTexts(page, ['hello', 'world']);

  // indent
  await page.keyboard.press('Tab');
  await assertRichTexts(page, ['hello', 'world']);
  await assertBlockChildrenIds(page, '1', ['2']);
  await assertBlockChildrenIds(page, '2', ['3']);

  // unindent
  await pressShiftTab(page);
  await assertRichTexts(page, ['hello', 'world']);
  await assertBlockChildrenIds(page, '1', ['2', '3']);

  await undoByKeyboard(page);
  await assertBlockChildrenIds(page, '1', ['2']);

  await redoByKeyboard(page);
  await assertBlockChildrenIds(page, '1', ['2', '3']);
});

test('update paragraph with children to head type', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'aaa');

  await pressEnter(page);
  await focusRichText(page, 1);
  await type(page, 'bbb');
  await pressEnter(page);
  await focusRichText(page, 2);
  await type(page, 'ccc');
  await assertRichTexts(page, ['aaa', 'bbb', 'ccc']);

  // aaa
  //   bbc
  //   ccc
  await focusRichText(page, 1);
  await page.keyboard.press('Tab');
  await focusRichText(page, 2);
  await page.keyboard.press('Tab');
  await assertRichTexts(page, ['aaa', 'bbb', 'ccc']);
  await assertBlockChildrenIds(page, '1', ['2']);
  await assertBlockChildrenIds(page, '2', ['3', '4']);

  await focusRichText(page);
  await pressArrowLeft(page, 3);

  await type(page, '# ');

  await assertRichTexts(page, ['aaa', 'bbb', 'ccc']);
  await assertBlockChildrenIds(page, '2', []);
  await assertBlockChildrenIds(page, '3', ['4']);

  await undoByKeyboard(page);
  await assertRichTexts(page, ['# aaa', 'bbb', 'ccc']);
  await assertBlockChildrenIds(page, '1', ['2']);
  await assertBlockChildrenIds(page, '2', ['3', '4']);

  await redoByKeyboard(page);
  await assertRichTexts(page, ['aaa', 'bbb', 'ccc']);
  await assertBlockChildrenIds(page, '2', []);
  await assertBlockChildrenIds(page, '3', ['4']);
});

test('should indent and unindent works with children', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await pressEnter(page);
  await type(page, '012');

  // Focus 789
  await focusRichText(page, 2);
  await page.keyboard.press('Tab');
  // Focus 456
  await focusRichText(page, 1);
  await page.keyboard.press('Tab');
  // Focus 012
  await focusRichText(page, 3);
  await page.keyboard.press('Tab');
  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
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
    <affine:paragraph
      prop:text="012"
      prop:type="text"
    />
  </affine:paragraph>
</affine:note>`,
    noteId
  );

  // unindent
  await focusRichText(page, 2);
  await pressShiftTab(page);

  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
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
  </affine:paragraph>
  <affine:paragraph
    prop:text="789"
    prop:type="text"
  >
    <affine:paragraph
      prop:text="012"
      prop:type="text"
    />
  </affine:paragraph>
</affine:note>`,
    noteId
  );
});

// https://github.com/toeverything/blocksuite/issues/364
test('paragraph with child block should work at enter', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, '123');
  await pressEnter(page);
  await type(page, '456');

  await focusRichText(page, 1);
  await page.keyboard.press('Tab');
  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
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
  </affine:paragraph>
</affine:note>`,
    noteId
  );
  await focusRichText(page, 0);
  await pressEnter(page);
  await type(page, '789');
  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:index="a0"
>
  <affine:paragraph
    prop:text="123"
    prop:type="text"
  >
    <affine:paragraph
      prop:text="789"
      prop:type="text"
    />
    <affine:paragraph
      prop:text="456"
      prop:type="text"
    />
  </affine:paragraph>
</affine:note>`,
    noteId
  );
});

test('should delete paragraph block child can hold cursor in correct position', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, '123');
  await pressEnter(page);
  await page.keyboard.press('Tab');
  await waitNextFrame(page);
  await type(page, '456');
  await focusRichText(page, 0);
  await pressEnter(page);
  await page.keyboard.press('Backspace');
  await waitNextFrame(page);
  await type(page, 'now');

  // TODO FIXME wait for note bounding box update
  await page.waitForTimeout(20);

  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:index="a0"
>
  <affine:paragraph
    prop:text="123"
    prop:type="text"
  />
  <affine:paragraph
    prop:text="now"
    prop:type="text"
  >
    <affine:paragraph
      prop:text="456"
      prop:type="text"
    />
  </affine:paragraph>
</affine:note>`,
    noteId
  );
});

test('switch between paragraph types', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'hello');

  const selector = '.affine-paragraph-block-container';

  await clickBlockTypeMenuItem(page, 'H1');
  await assertClassName(page, selector, /h1/);

  await clickBlockTypeMenuItem(page, 'H2');
  await assertClassName(page, selector, /h2/);

  await clickBlockTypeMenuItem(page, 'H3');
  await assertClassName(page, selector, /h3/);

  await undoByClick(page);
  await assertClassName(page, selector, /h2/);

  await undoByClick(page);
  await assertClassName(page, selector, /h1/);
});

test('delete at start of paragraph block', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'hello');

  await pressEnter(page);
  await type(page, 'a');

  await clickBlockTypeMenuItem(page, 'H1');
  await focusRichText(page, 1);
  await assertBlockType(page, '2', 'text');
  await assertBlockType(page, '3', 'h1');

  await pressBackspace(page);
  await pressBackspace(page);
  await assertBlockType(page, '3', 'text');
  await assertBlockChildrenIds(page, '1', ['2', '3']);

  await page.keyboard.press('Backspace');
  await assertBlockChildrenIds(page, '1', ['2']);

  await undoByClick(page);
  await assertBlockChildrenIds(page, '1', ['2', '3']);
});

test('delete at start of paragraph immediately following list', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'hello');

  await pressEnter(page);
  await type(page, 'a');

  await clickBlockTypeMenuItem(page, 'Bulleted List');
  await focusRichText(page, 1);
  await assertBlockType(page, '2', 'text');
  await assertBlockType(page, '4', 'bulleted');

  await pressBackspace(page);
  await pressBackspace(page);
  await assertBlockType(page, '5', 'text');
  await assertBlockChildrenIds(page, '1', ['2', '5']);

  await waitNextFrame(page);
  await pressBackspace(page);
  await assertBlockChildrenIds(page, '1', ['2']);

  await undoByClick(page);
  await undoByClick(page);
  await clickBlockTypeMenuItem(page, 'Numbered List');
  await focusRichText(page, 1);
  await assertBlockType(page, '2', 'text');
  await assertBlockType(page, '4', 'numbered');

  await pressBackspace(page);
  await assertBlockType(page, '6', 'text');
  await assertBlockChildrenIds(page, '1', ['2', '6']);

  await pressBackspace(page);
  await assertBlockChildrenIds(page, '1', ['2']);

  await undoByClick(page);
  await undoByClick(page);
  await clickBlockTypeMenuItem(page, 'Todo List');
  await focusRichText(page, 1);
  await assertBlockType(page, '2', 'text');
  await assertBlockType(page, '4', 'todo');

  await pressBackspace(page);
  await assertBlockType(page, '7', 'text');
  await assertBlockChildrenIds(page, '1', ['2', '7']);

  await pressBackspace(page);
  await assertBlockChildrenIds(page, '1', ['2']);
});

test('delete at start of paragraph with content', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, '123');

  await pressEnter(page);
  await type(page, '456');
  await assertRichTexts(page, ['123', '456']);

  await pressArrowLeft(page, 3);
  await assertSelection(page, 1, 0, 0);

  await pressBackspace(page);
  await assertRichTexts(page, ['123456']);

  await undoByClick(page);
  await assertRichTexts(page, ['123', '456']);
});

test('get focus from page title enter', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusTitle(page);
  await type(page, 'hello');
  await assertRichTexts(page, ['']);

  await pressEnter(page);
  await type(page, 'world');
  await assertRichTexts(page, ['world', '']);
});

test('handling keyup when cursor located in first paragraph', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusTitle(page);
  await type(page, 'hello');
  await assertRichTexts(page, ['']);

  await pressEnter(page);
  await type(page, 'world');
  await assertRichTexts(page, ['world', '']);
  await page.keyboard.press('ArrowUp', { delay: 50 });
  await assertPageTitleFocus(page);
});

test('after deleting a text row, cursor should jump to the end of previous list row', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'hello');
  await assertSelection(page, 0, 5, 0);

  await pressEnter(page);
  await type(page, 'w');
  await assertRichTexts(page, ['hello', 'w']);
  await assertSelection(page, 1, 1, 0);
  await pressArrowUp(page);
  await pressArrowDown(page);

  await pressArrowLeft(page);
  await pressBackspace(page);
  await assertSelection(page, 0, 5, 0);
});

test('press tab in paragraph children', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await waitDefaultPageLoaded(page);
  await focusTitle(page);
  await pressEnter(page);
  await type(page, '1');
  await pressEnter(page);
  await pressTab(page);
  await type(page, '2');
  await pressEnter(page);
  await pressTab(page);
  await type(page, '3');
  await page.keyboard.press('ArrowUp', { delay: 50 });
  await page.keyboard.press('ArrowLeft', { delay: 50 });
  await type(page, '- ');
  await assertRichTexts(page, ['1', '2', '3', '']);
});

test('press left in first paragraph start should not change cursor position', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, '1');

  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await type(page, 'l');
  await assertRichTexts(page, ['l1']);
  await assertTitle(page, '');
});

test('press arrow down should move caret to the start of line', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await page.evaluate(() => {
    const { page } = window;
    const pageId = page.addBlock('affine:page', {
      title: new page.Text(),
    });
    const note = page.addBlock('affine:note', {}, pageId);
    page.addBlock(
      'affine:paragraph',
      {
        text: new page.Text('0'.repeat(100)),
      },
      note
    );
    page.addBlock(
      'affine:paragraph',
      {
        text: new page.Text('1'),
      },
      note
    );
  });

  // Focus the empty child paragraph
  await focusRichText(page, 1);
  await pressArrowLeft(page);
  await pressArrowUp(page);
  await pressArrowDown(page);
  await type(page, '2');
  await assertRichTexts(page, ['0'.repeat(100), '21']);
});

test('press arrow up in the second line should move caret to the first line', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await page.evaluate(() => {
    const { page } = window;
    const pageId = page.addBlock('affine:page', {
      title: new page.Text(),
    });
    const note = page.addBlock('affine:note', {}, pageId);
    const delta = Array.from({ length: 120 }, (v, i) => {
      return i % 2 === 0
        ? { insert: 'i', attributes: { italic: true } }
        : { insert: 'b', attributes: { bold: true } };
    });
    const text = page.Text.fromDelta(delta);
    page.addBlock('affine:paragraph', { text }, note);
    page.addBlock('affine:paragraph', {}, note);
  });

  // Focus the empty paragraph
  await focusRichText(page, 1);
  await page.keyboard.press('ArrowUp');
  // Now the caret is at the start of the second line of the first paragraph

  await pressArrowUp(page);
  await type(page, '0');
  await pressArrowUp(page);
  // At title
  await type(page, '1');
  await assertTitle(page, '1');

  // At the first line of the first paragraph
  await page.keyboard.press('ArrowDown', { delay: 50 });
  // At the second line of the first paragraph
  await page.keyboard.press('ArrowDown', { delay: 50 });
  // At the second paragraph
  await page.keyboard.press('ArrowDown', { delay: 50 });
  await type(page, '2');

  await assertRichTexts(page, ['0' + 'ib'.repeat(60), '2']);

  // Go to the start of the second paragraph
  await page.keyboard.press('ArrowLeft', { delay: 50 });
  await page.keyboard.press('ArrowUp', { delay: 50 });
  await page.keyboard.press('ArrowDown', { delay: 50 });
  // Should be inserted at the start of the second paragraph
  await type(page, '3');
  await assertRichTexts(page, ['0' + 'ib'.repeat(60), '32']);
});

test('press arrow down in indent line should not move caret to the start of line', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await page.evaluate(() => {
    const { page } = window;
    const pageId = page.addBlock('affine:page', {
      title: new page.Text(),
    });
    const note = page.addBlock('affine:note', {}, pageId);
    const p1 = page.addBlock('affine:paragraph', {}, note);
    const p2 = page.addBlock('affine:paragraph', {}, p1);
    page.addBlock('affine:paragraph', {}, p2);
    page.addBlock(
      'affine:paragraph',
      {
        text: new page.Text('0'),
      },
      note
    );
  });

  // Focus the empty child paragraph
  await focusRichText(page, 2);
  await page.keyboard.press('ArrowDown');
  await waitNextFrame(page);
  // Now the caret should be at the end of the last paragraph
  await type(page, '1');
  await assertRichTexts(page, ['', '', '', '01']);

  await focusRichText(page, 2);
  await waitNextFrame(page);
  // Insert a new long text to wrap the line
  await page.keyboard.insertText('0'.repeat(100));
  await waitNextFrame(page);

  await focusRichText(page, 1);
  // Through long text
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await type(page, '2');
  await assertRichTexts(page, ['', '', '0'.repeat(100), '012']);
});

test('should placeholder works', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  const placeholder = page.locator('.tips-placeholder');
  await expect(placeholder).toBeVisible();
  await expect(placeholder).toHaveCount(1);
  await expect(placeholder).toContainText('type');

  await type(page, '1');
  await expect(placeholder).not.toBeVisible();
  await pressBackspace(page);

  await expect(placeholder).toBeVisible();
  await clickBlockTypeMenuItem(page, 'H1');

  await expect(placeholder).toBeVisible();
  await expect(placeholder).toHaveText('Heading 1');
  await clickBlockTypeMenuItem(page, 'Text');
  await focusRichText(page, 0);
  await expect(placeholder).toBeVisible();
  await expect(placeholder).toContainText('type');

  await pressEnter(page);
  await expect(placeholder).toHaveCount(1);

  // should block hub icon works
  const blockHubPlaceholder = placeholder.locator('svg');
  const blockHubMenu = page.locator('.block-hub-icons-container');
  await expect(blockHubPlaceholder).toBeVisible();
  await expect(blockHubMenu).not.toBeVisible();
  await blockHubPlaceholder.click();
  await expect(placeholder).toHaveCount(1);
  await expect(blockHubMenu).toBeVisible();
});

test.describe('press ArrowDown when cursor is at the last line of a block', () => {
  test.beforeEach(async ({ page }) => {
    await enterPlaygroundRoom(page);
    await page.evaluate(() => {
      const { page } = window;
      const pageId = page.addBlock('affine:page', {
        title: new page.Text(),
      });
      const note = page.addBlock('affine:note', {}, pageId);
      page.addBlock(
        'affine:paragraph',
        {
          text: new page.Text('This is the 2nd last block.'),
        },
        note
      );
      page.addBlock(
        'affine:paragraph',
        {
          text: new page.Text('This is the last block.'),
        },
        note
      );
    });
  });

  test('move cursor to next block if this block is _not_ the last block in the page', async ({
    page,
  }) => {
    // Click at the top-left corner of the 2nd last block to place the cursor at its start
    await focusRichText(page, 0, { clickPosition: { x: 0, y: 0 } });
    // Cursor should have been moved to the start of the last block.
    await pressArrowDown(page);
    await type(page, "I'm here. ");
    await assertRichTexts(page, [
      'This is the 2nd last block.',
      "I'm here. This is the last block.",
    ]);
  });
  test('move cursor to the end of line if the block is the last block in the page', async ({
    page,
  }) => {
    // Click at the top-left corner of the last block to place the cursor at its start
    await focusRichText(page, 1, { clickPosition: { x: 0, y: 0 } });
    // Cursor should have been moved to the end of the only line.
    await pressArrowDown(page);
    await type(page, " I'm here.");
    await assertRichTexts(page, [
      'This is the 2nd last block.',
      "This is the last block. I'm here.",
    ]);
  });
});
