import {
  clickBlockTypeMenuItem,
  dragOverTitle,
  enterPlaygroundRoom,
  focusRichText,
  focusTitle,
  initEmptyParagraphState,
  initThreeParagraphs,
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
  await type(page, 'hello');
  await pressEnter(page);
  await type(page, 'world');

  await assertTitle(page, 'hello');
  await assertRichTexts(page, ['world', '\n']);

  //#region Fixes: https://github.com/toeverything/blocksuite/issues/1007
  await page.keyboard.press('ArrowLeft');
  await focusTitle(page);
  await pressEnter(page);
  await assertRichTexts(page, ['\n', 'world', '\n']);
  //#endregion
});

test('init paragraph by page title enter in middle', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await waitDefaultPageLoaded(page);
  await type(page, 'hello');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await pressEnter(page);

  await assertTitle(page, 'he');
  await assertRichTexts(page, ['llo', '\n']);
});

test('drag over paragraph title', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await waitDefaultPageLoaded(page);
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
  await type(page, 'hello');
  await assertTitle(page, 'hello');
  await resetHistory(page);

  await page.keyboard.press('Backspace', { delay: 50 });
  await assertTitle(page, 'hell');

  await page.keyboard.press('ArrowLeft', { delay: 50 });
  await page.keyboard.press('ArrowLeft', { delay: 50 });
  await page.keyboard.press('Backspace', { delay: 50 });
  await assertTitle(page, 'hll');

  await page.keyboard.press('ArrowDown', { delay: 50 });
  await assertSelection(page, 0, 0, 0);

  await undoByKeyboard(page);
  await assertTitle(page, 'hello');

  await redoByKeyboard(page);
  await assertTitle(page, 'hll');
});

test('backspace on line start of the first block', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await waitDefaultPageLoaded(page);
  await type(page, 'hello');
  await assertTitle(page, 'hello');
  await resetHistory(page);

  await focusRichText(page, 0);
  await type(page, 'abc');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await assertSelection(page, 0, 0, 0);

  await page.keyboard.press('Backspace', { delay: 50 });
  await assertTitle(page, 'helloabc');

  await pressEnter(page);
  await assertTitle(page, 'hello');
  await assertRichTexts(page, ['abc']);

  await page.keyboard.press('Backspace', { delay: 50 });
  await assertTitle(page, 'helloabc');
  await assertRichTexts(page, []);
  await undoByClick(page);
  await assertTitle(page, 'hello');
  await assertRichTexts(page, ['abc']);

  await redoByClick(page);
  await assertTitle(page, 'helloabc');
  await assertRichTexts(page, []);
});

test('append new paragraph block by enter', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'hello');
  await assertSelection(page, 0, 5, 0);

  await pressEnter(page);
  await assertRichTexts(page, ['hello', '\n']);
  await assertSelection(page, 1, 0, 0);

  await undoByKeyboard(page);
  await assertRichTexts(page, ['hello']);
  await assertSelection(page, 0, 5, 0);

  await redoByKeyboard(page);
  await assertRichTexts(page, ['hello', '\n']);
  await assertSelection(page, 1, 0, 0);
});

test('insert new paragraph block by enter', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await pressEnter(page);
  await pressEnter(page);
  await assertRichTexts(page, ['\n', '\n', '\n']);

  await focusRichText(page, 1);
  await type(page, 'hello');
  await assertRichTexts(page, ['\n', 'hello', '\n']);

  await pressEnter(page);
  await type(page, 'world');
  await assertRichTexts(page, ['\n', 'hello', 'world', '\n']);
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
  await assertRichTexts(page, ['he\n\nllo']);
  await assertSelection(page, 0, 3, 0);

  await undoByKeyboard(page);
  await assertRichTexts(page, ['hello']);

  await redoByKeyboard(page);
  await assertRichTexts(page, ['he\n\nllo']);
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
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');

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
  const { frameId } = await initEmptyParagraphState(page);
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
    <affine:paragraph
      prop:text="012"
      prop:type="text"
    />
  </affine:paragraph>
</affine:frame>`,
    frameId
  );

  // unindent
  await focusRichText(page, 2);
  await pressShiftTab(page);

  await assertStoreMatchJSX(
    page,
    `
<affine:frame>
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
</affine:frame>`,
    frameId
  );
});

// https://github.com/toeverything/blocksuite/issues/364
test('paragraph with child block should work at enter', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { frameId } = await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, '123');
  await pressEnter(page);
  await type(page, '456');

  await focusRichText(page, 1);
  await page.keyboard.press('Tab');
  await assertStoreMatchJSX(
    page,
    `
<affine:frame>
  <affine:paragraph
    prop:text="123"
    prop:type="text"
  >
    <affine:paragraph
      prop:text="456"
      prop:type="text"
    />
  </affine:paragraph>
</affine:frame>`,
    frameId
  );
  await focusRichText(page, 0);
  await pressEnter(page);
  await type(page, '789');
  await assertStoreMatchJSX(
    page,
    `
<affine:frame>
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
</affine:frame>`,
    frameId
  );
});

test('should delete paragraph block child can hold cursor in correct position', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  const { frameId } = await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, '123');
  await pressEnter(page);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(10);
  await type(page, '456');
  await focusRichText(page, 0);
  await pressEnter(page);
  await page.keyboard.press('Backspace');
  await page.waitForTimeout(10);
  await type(page, 'now');

  // TODO FIXME wait for frame bounding box update
  await page.waitForTimeout(20);

  await assertStoreMatchJSX(
    page,
    `
<affine:frame>
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
</affine:frame>`,
    frameId
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

  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');
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

  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');
  await assertBlockType(page, '5', 'text');
  await assertBlockChildrenIds(page, '1', ['2', '5']);

  await waitNextFrame(page);
  await page.keyboard.press('Backspace');
  await assertBlockChildrenIds(page, '1', ['2']);

  await undoByClick(page);
  await undoByClick(page);
  await clickBlockTypeMenuItem(page, 'Numbered List');
  await focusRichText(page, 1);
  await assertBlockType(page, '2', 'text');
  await assertBlockType(page, '4', 'numbered');

  await page.keyboard.press('Backspace');
  await assertBlockType(page, '6', 'text');
  await assertBlockChildrenIds(page, '1', ['2', '6']);

  await page.keyboard.press('Backspace');
  await assertBlockChildrenIds(page, '1', ['2']);

  await undoByClick(page);
  await undoByClick(page);
  await clickBlockTypeMenuItem(page, 'Todo List');
  await focusRichText(page, 1);
  await assertBlockType(page, '2', 'text');
  await assertBlockType(page, '4', 'todo');

  await page.keyboard.press('Backspace');
  await assertBlockType(page, '7', 'text');
  await assertBlockChildrenIds(page, '1', ['2', '7']);

  await page.keyboard.press('Backspace');
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

  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await assertSelection(page, 1, 0, 0);

  await page.keyboard.press('Backspace');
  await assertRichTexts(page, ['123456']);

  await undoByClick(page);
  await assertRichTexts(page, ['123', '456']);
});

test('get focus from page title enter', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await type(page, 'hello');
  await assertRichTexts(page, ['\n']);

  await pressEnter(page);
  await type(page, 'world');
  await assertRichTexts(page, ['world', '\n']);
});

test('handling keyup when cursor located in first paragraph', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await type(page, 'hello');
  await assertRichTexts(page, ['\n']);

  await pressEnter(page);
  await type(page, 'world');
  await assertRichTexts(page, ['world', '\n']);
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
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowDown');

  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Backspace');
  await assertSelection(page, 0, 5, 0);
});

test('press tab in paragraph children', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await waitDefaultPageLoaded(page);
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
  await assertRichTexts(page, ['1', '2', '3', '\n']);
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
    const pageId = page.addBlockByFlavour('affine:page', {
      title: new page.Text(),
    });
    const frame = page.addBlockByFlavour('affine:frame', {}, pageId);
    page.addBlockByFlavour(
      'affine:paragraph',
      {
        text: new page.Text('0'.repeat(100)),
      },
      frame
    );
    page.addBlockByFlavour(
      'affine:paragraph',
      {
        text: new page.Text('1'),
      },
      frame
    );
  });

  // Focus the empty child paragraph
  await focusRichText(page, 1);
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowDown');
  await type(page, '2');
  await assertRichTexts(page, ['0'.repeat(100), '21']);
});

test('press arrow up in the second line should move caret to the first line', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await page.evaluate(() => {
    const { page } = window;
    const pageId = page.addBlockByFlavour('affine:page', {
      title: new page.Text(),
    });
    const frame = page.addBlockByFlavour('affine:frame', {}, pageId);
    const delta = Array.from({ length: 120 }, (v, i) => {
      return i % 2 === 0
        ? { insert: 'i', attributes: { italic: true } }
        : { insert: 'b', attributes: { bold: true } };
    });
    const text = page.Text.fromDelta(delta);
    page.addBlockByFlavour('affine:paragraph', { text }, frame);
    page.addBlockByFlavour('affine:paragraph', {}, frame);
  });

  // Focus the empty paragraph
  await focusRichText(page, 1);
  await page.keyboard.press('ArrowUp');
  // Now the caret is at the start of the second line of the first paragraph

  await page.keyboard.press('ArrowUp');
  await type(page, '0');
  await page.keyboard.press('ArrowUp');
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
    const pageId = page.addBlockByFlavour('affine:page', {
      title: new page.Text(),
    });
    const frame = page.addBlockByFlavour('affine:frame', {}, pageId);
    const p1 = page.addBlockByFlavour('affine:paragraph', {}, frame);
    const p2 = page.addBlockByFlavour('affine:paragraph', {}, p1);
    page.addBlockByFlavour('affine:paragraph', {}, p2);
    page.addBlockByFlavour(
      'affine:paragraph',
      {
        text: new page.Text('0'),
      },
      frame
    );
  });

  // Focus the empty child paragraph
  await focusRichText(page, 2);
  await page.keyboard.press('ArrowDown');
  // Now the caret should be at the end of the last paragraph
  await type(page, '1');
  await assertRichTexts(page, ['\n', '\n', '\n', '01']);

  await focusRichText(page, 2);
  // Insert a new long text to wrap the line
  await page.keyboard.insertText('0'.repeat(100));

  await focusRichText(page, 1);
  // Through long text
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await type(page, '2');
  await assertRichTexts(page, ['\n', '\n', '0'.repeat(100), '012']);
});
