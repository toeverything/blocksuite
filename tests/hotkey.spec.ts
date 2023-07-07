import { expect } from '@playwright/test';

import {
  clickBlockTypeMenuItem,
  dragBetweenIndices,
  dragOverTitle,
  enterPlaygroundRoom,
  focusRichText,
  focusTitle,
  formatType,
  initEmptyParagraphState,
  initThreeParagraphs,
  inlineCode,
  MODIFIER_KEY,
  pressArrowDown,
  pressArrowLeft,
  pressArrowRight,
  pressArrowUp,
  pressEnter,
  pressForwardDelete,
  readClipboardText,
  redoByClick,
  redoByKeyboard,
  resetHistory,
  selectAllByKeyboard,
  setVirgoSelection,
  SHORT_KEY,
  strikethrough,
  type,
  undoByClick,
  undoByKeyboard,
  waitNextFrame,
} from './utils/actions/index.js';
import {
  assertRichTexts,
  assertSelection,
  assertStoreMatchJSX,
  assertTextFormat,
  assertTitle,
  assertTypeFormat,
} from './utils/asserts.js';
import { test } from './utils/playwright.js';

test('rich-text hotkey scope on single press', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'hello');
  await pressEnter(page);
  await type(page, 'world');
  await assertRichTexts(page, ['hello', 'world']);

  await dragBetweenIndices(page, [0, 0], [1, 5]);
  await page.keyboard.press('Backspace');
  await assertRichTexts(page, ['']);
});

test('single line rich-text inline code hotkey', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'hello');
  await dragBetweenIndices(page, [0, 0], [0, 5]);
  await inlineCode(page);
  await assertTextFormat(page, 0, 0, { code: true });

  // undo
  await undoByKeyboard(page);
  await assertTextFormat(page, 0, 0, {});
  // redo
  await redoByKeyboard(page);
  await waitNextFrame(page);
  await assertTextFormat(page, 0, 0, { code: true });

  // the format should be removed after trigger the hotkey again
  await inlineCode(page);
  await assertTextFormat(page, 0, 0, {});
});

test('type character jump out code node', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { paragraphId } = await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'Hello');
  await selectAllByKeyboard(page);
  await inlineCode(page);
  await assertStoreMatchJSX(
    page,
    `
<affine:paragraph
  prop:text={
    <>
      <text
        code={true}
        insert="Hello"
      />
    </>
  }
  prop:type="text"
/>`,
    paragraphId
  );
  await focusRichText(page);
  await page.keyboard.press(`${SHORT_KEY}+ArrowRight`);
  await type(page, 'block suite');
  await assertStoreMatchJSX(
    page,
    `
<affine:paragraph
  prop:text={
    <>
      <text
        code={true}
        insert="Hello"
      />
      <text
        insert="block suite"
      />
    </>
  }
  prop:type="text"
/>`,
    paragraphId
  );
});

test('multi line rich-text inline code hotkey', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  // 0    1   2
  // 1|23 456 78|9
  await dragBetweenIndices(page, [0, 1], [2, 2]);
  await inlineCode(page);

  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:hidden={false}
  prop:index="a0"
>
  <affine:paragraph
    prop:text={
      <>
        <text
          insert="1"
        />
        <text
          code={true}
          insert="23"
        />
      </>
    }
    prop:type="text"
  />
  <affine:paragraph
    prop:text={
      <>
        <text
          code={true}
          insert="456"
        />
      </>
    }
    prop:type="text"
  />
  <affine:paragraph
    prop:text={
      <>
        <text
          code={true}
          insert="78"
        />
        <text
          insert="9"
        />
      </>
    }
    prop:type="text"
  />
</affine:note>`,
    noteId
  );

  await undoByClick(page);

  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
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
</affine:note>`,
    noteId
  );

  await redoByClick(page);

  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:hidden={false}
  prop:index="a0"
>
  <affine:paragraph
    prop:text={
      <>
        <text
          insert="1"
        />
        <text
          code={true}
          insert="23"
        />
      </>
    }
    prop:type="text"
  />
  <affine:paragraph
    prop:text={
      <>
        <text
          code={true}
          insert="456"
        />
      </>
    }
    prop:type="text"
  />
  <affine:paragraph
    prop:text={
      <>
        <text
          code={true}
          insert="78"
        />
        <text
          insert="9"
        />
      </>
    }
    prop:type="text"
  />
</affine:note>`,
    noteId
  );
});

test('single line rich-text strikethrough hotkey', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'hello');
  await dragBetweenIndices(page, [0, 0], [0, 5]);
  await strikethrough(page);
  await assertTextFormat(page, 0, 0, { strike: true });

  await undoByClick(page);
  await assertTextFormat(page, 0, 0, {});

  await redoByClick(page);
  await assertTextFormat(page, 0, 0, { strike: true });

  await waitNextFrame(page);
  // the format should be removed after trigger the hotkey again
  await strikethrough(page);
  await assertTextFormat(page, 0, 0, {});
});

test('use formatted cursor with hotkey', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'aaa');
  // format italic
  await page.keyboard.press(`${SHORT_KEY}+i`, { delay: 50 });
  await type(page, 'bbb');
  // format bold
  await page.keyboard.press(`${SHORT_KEY}+b`, { delay: 50 });
  await type(page, 'ccc');
  // unformat italic
  await page.keyboard.press(`${SHORT_KEY}+i`, { delay: 50 });
  await type(page, 'ddd');
  // unformat bold
  await page.keyboard.press(`${SHORT_KEY}+b`, { delay: 50 });
  await type(page, 'eee');

  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:hidden={false}
  prop:index="a0"
>
  <affine:paragraph
    prop:text={
      <>
        <text
          insert="aaa"
        />
        <text
          insert="bbb"
          italic={true}
        />
        <text
          bold={true}
          insert="ccc"
          italic={true}
        />
        <text
          bold={true}
          insert="ddd"
        />
        <text
          insert="eee"
        />
      </>
    }
    prop:type="text"
  />
</affine:note>`,
    noteId
  );

  // format bold
  await page.keyboard.press(`${SHORT_KEY}+b`, { delay: 50 });
  await type(page, 'fff');

  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:hidden={false}
  prop:index="a0"
>
  <affine:paragraph
    prop:text={
      <>
        <text
          insert="aaa"
        />
        <text
          insert="bbb"
          italic={true}
        />
        <text
          bold={true}
          insert="ccc"
          italic={true}
        />
        <text
          bold={true}
          insert="ddd"
        />
        <text
          insert="eee"
        />
        <text
          bold={true}
          insert="fff"
        />
      </>
    }
    prop:type="text"
  />
</affine:note>`,
    noteId
  );

  await pressArrowLeft(page);
  await pressArrowRight(page);
  await type(page, 'ggg');

  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:hidden={false}
  prop:index="a0"
>
  <affine:paragraph
    prop:text={
      <>
        <text
          insert="aaa"
        />
        <text
          insert="bbb"
          italic={true}
        />
        <text
          bold={true}
          insert="ccc"
          italic={true}
        />
        <text
          bold={true}
          insert="ddd"
        />
        <text
          insert="eee"
        />
        <text
          bold={true}
          insert="fffggg"
        />
      </>
    }
    prop:type="text"
  />
</affine:note>`,
    noteId
  );

  await setVirgoSelection(page, 3, 0);
  await waitNextFrame(page);
  await type(page, 'hhh');

  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:hidden={false}
  prop:index="a0"
>
  <affine:paragraph
    prop:text={
      <>
        <text
          insert="aaahhh"
        />
        <text
          insert="bbb"
          italic={true}
        />
        <text
          bold={true}
          insert="ccc"
          italic={true}
        />
        <text
          bold={true}
          insert="ddd"
        />
        <text
          insert="eee"
        />
        <text
          bold={true}
          insert="fffggg"
        />
      </>
    }
    prop:type="text"
  />
</affine:note>`,
    noteId
  );
});

test('should single line format hotkey work', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'hello');
  await dragBetweenIndices(page, [0, 1], [0, 4]);

  // bold
  await page.keyboard.press(`${SHORT_KEY}+b`, { delay: 50 });
  // italic
  await page.keyboard.press(`${SHORT_KEY}+i`, { delay: 50 });
  // underline
  await page.keyboard.press(`${SHORT_KEY}+u`, { delay: 50 });
  // strikethrough
  await page.keyboard.press(`${SHORT_KEY}+Shift+s`, { delay: 50 });

  await waitNextFrame(page);

  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:hidden={false}
  prop:index="a0"
>
  <affine:paragraph
    prop:text={
      <>
        <text
          insert="h"
        />
        <text
          bold={true}
          insert="ell"
          italic={true}
          strike={true}
          underline={true}
        />
        <text
          insert="o"
        />
      </>
    }
    prop:type="text"
  />
</affine:note>`,
    noteId
  );

  // bold
  await page.keyboard.press(`${SHORT_KEY}+b`, { delay: 50 });
  // italic
  await page.keyboard.press(`${SHORT_KEY}+i`, { delay: 50 });
  // underline
  await page.keyboard.press(`${SHORT_KEY}+u`, { delay: 50 });
  // strikethrough
  await page.keyboard.press(`${SHORT_KEY}+Shift+s`, { delay: 50 });

  await waitNextFrame(page);

  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:hidden={false}
  prop:index="a0"
>
  <affine:paragraph
    prop:text="hello"
    prop:type="text"
  />
</affine:note>`,
    noteId
  );
});

test('should multiple line format hotkey work', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  // 0    1   2
  // 1|23 456 78|9
  await dragBetweenIndices(page, [0, 1], [2, 2]);

  // bold
  await page.keyboard.press(`${SHORT_KEY}+b`);
  // italic
  await page.keyboard.press(`${SHORT_KEY}+i`);
  // underline
  await page.keyboard.press(`${SHORT_KEY}+u`);
  // strikethrough
  await page.keyboard.press(`${SHORT_KEY}+Shift+s`);

  await waitNextFrame(page);

  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:hidden={false}
  prop:index="a0"
>
  <affine:paragraph
    prop:text={
      <>
        <text
          insert="1"
        />
        <text
          bold={true}
          insert="23"
          italic={true}
          strike={true}
          underline={true}
        />
      </>
    }
    prop:type="text"
  />
  <affine:paragraph
    prop:text={
      <>
        <text
          bold={true}
          insert="456"
          italic={true}
          strike={true}
          underline={true}
        />
      </>
    }
    prop:type="text"
  />
  <affine:paragraph
    prop:text={
      <>
        <text
          bold={true}
          insert="78"
          italic={true}
          strike={true}
          underline={true}
        />
        <text
          insert="9"
        />
      </>
    }
    prop:type="text"
  />
</affine:note>`,
    noteId
  );

  // bold
  await page.keyboard.press(`${SHORT_KEY}+b`, { delay: 50 });
  // italic
  await page.keyboard.press(`${SHORT_KEY}+i`, { delay: 50 });
  // underline
  await page.keyboard.press(`${SHORT_KEY}+u`, { delay: 50 });
  // strikethrough
  await page.keyboard.press(`${SHORT_KEY}+Shift+s`, { delay: 50 });

  await waitNextFrame(page);

  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
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
</affine:note>`,
    noteId
  );
});

test('should hotkey work in paragraph', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyParagraphState(page);

  await focusRichText(page, 0);
  await type(page, 'hello');

  // XXX wait for group to be updated
  await page.waitForTimeout(10);
  await page.keyboard.press(`${SHORT_KEY}+${MODIFIER_KEY}+1`);
  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:hidden={false}
  prop:index="a0"
>
  <affine:paragraph
    prop:text="hello"
    prop:type="h1"
  />
</affine:note>`,
    noteId
  );
  await page.keyboard.press(`${SHORT_KEY}+${MODIFIER_KEY}+6`);
  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:hidden={false}
  prop:index="a0"
>
  <affine:paragraph
    prop:text="hello"
    prop:type="h6"
  />
</affine:note>`,
    noteId
  );
  await page.waitForTimeout(50);
  await page.keyboard.press(`${SHORT_KEY}+${MODIFIER_KEY}+8`);
  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:hidden={false}
  prop:index="a0"
>
  <affine:list
    prop:checked={false}
    prop:text="hello"
    prop:type="bulleted"
  />
</affine:note>`,
    noteId
  );
  await page.waitForTimeout(50);
  await page.keyboard.press(`${SHORT_KEY}+${MODIFIER_KEY}+9`);
  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:hidden={false}
  prop:index="a0"
>
  <affine:list
    prop:checked={false}
    prop:text="hello"
    prop:type="numbered"
  />
</affine:note>`,
    noteId
  );
  await page.keyboard.press(`${SHORT_KEY}+${MODIFIER_KEY}+0`);
  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:hidden={false}
  prop:index="a0"
>
  <affine:paragraph
    prop:text="hello"
    prop:type="text"
  />
</affine:note>`,
    noteId
  );
  await page.waitForTimeout(50);
  await page.keyboard.press(`${SHORT_KEY}+${MODIFIER_KEY}+d`);
  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:hidden={false}
  prop:index="a0"
>
  <affine:paragraph
    prop:text="hello"
    prop:type="text"
  />
  <affine:divider />
  <affine:paragraph
    prop:type="text"
  />
</affine:note>`,
    noteId
  );
});

test('format list to h1', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await focusRichText(page, 0);
  await clickBlockTypeMenuItem(page, 'Bulleted List');
  await type(page, 'aa');
  await focusRichText(page, 0);
  await formatType(page);
  await assertTypeFormat(page, 'h1');
  await undoByKeyboard(page);
  await assertTypeFormat(page, 'bulleted');
  await redoByKeyboard(page);
  await assertTypeFormat(page, 'h1');
});

test('should cut work single line', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'hello');
  await resetHistory(page);
  await dragBetweenIndices(page, [0, 1], [0, 4]);
  // cut
  await page.keyboard.press(`${SHORT_KEY}+x`);
  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:hidden={false}
  prop:index="a0"
>
  <affine:paragraph
    prop:text="ho"
    prop:type="text"
  />
</affine:note>`,
    noteId
  );
  await undoByKeyboard(page);
  const text = await readClipboardText(page);
  expect(text).toBe('ell');
  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:hidden={false}
  prop:index="a0"
>
  <affine:paragraph
    prop:text="hello"
    prop:type="text"
  />
</affine:note>`,
    noteId
  );
});

test.skip('should cut work multiple line', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await resetHistory(page);
  // 0    1   2
  // 1|23 456 78|9
  await dragBetweenIndices(page, [0, 1], [2, 2]);
  // cut
  await page.keyboard.press(`${SHORT_KEY}+x`);
  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:hidden={false}
  prop:index="a0"
>
  <affine:paragraph
    prop:text="19"
    prop:type="text"
  />
</affine:note>`,
    noteId
  );
  await undoByKeyboard(page);
  const text = await readClipboardText(page);
  expect(text).toBe(`23\n456\n78`);
  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
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
</affine:note>`,
    noteId
  );
});

test('should ctrl+enter create new block', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await focusRichText(page);
  await type(page, '123');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await pressEnter(page);
  await waitNextFrame(page);
  await assertRichTexts(page, ['1', '23']);
  await page.keyboard.press(`${SHORT_KEY}+Enter`);
  await assertRichTexts(page, ['1', '23', '']);
});

test('should bracket complete works', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, '([{');
  // type without selection should not trigger bracket complete
  await assertRichTexts(page, ['([{']);

  await dragBetweenIndices(page, [0, 1], [0, 2]);
  await type(page, '(');
  await assertRichTexts(page, ['(([){']);

  await type(page, ')');
  // Should not trigger bracket complete when type right bracket
  await assertRichTexts(page, ['(()){']);
});

test('should bracket complete with backtick works', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { paragraphId } = await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'hello world');

  await dragBetweenIndices(page, [0, 2], [0, 5]);
  await resetHistory(page);
  await type(page, '`');
  await assertStoreMatchJSX(
    page,
    `
<affine:paragraph
  prop:text={
    <>
      <text
        insert="he"
      />
      <text
        code={true}
        insert="llo"
      />
      <text
        insert=" world"
      />
    </>
  }
  prop:type="text"
/>`,
    paragraphId
  );

  await undoByClick(page);
  await assertStoreMatchJSX(
    page,
    `
<affine:paragraph
  prop:text="hello world"
  prop:type="text"
/>`,
    paragraphId
  );
});

test('pressing enter when selecting multiple blocks should create new block', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await dragBetweenIndices(page, [0, 1], [2, 1]);
  await waitNextFrame(page);
  await pressEnter(page);
  await assertRichTexts(page, ['1', '89']);
  await assertSelection(page, 1, 0, 0);
  await undoByKeyboard(page);
  await assertRichTexts(page, ['123', '456', '789']);
});

// FIXME: getCurrentBlockRange need to handle comment node
test.skip('should left/right key navigator works', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await focusRichText(page, 0);
  await assertSelection(page, 0, 3);
  await page.keyboard.press(`${SHORT_KEY}+ArrowLeft`, { delay: 50 });
  await assertSelection(page, 0, 0);
  await pressArrowLeft(page);
  await assertSelection(page, 0, 0);
  await page.keyboard.press(`${SHORT_KEY}+ArrowRight`, { delay: 50 });
  await assertSelection(page, 0, 3);
  await pressArrowRight(page);
  await assertSelection(page, 1, 0);
  await pressArrowLeft(page);
  await assertSelection(page, 0, 3);
  await pressArrowRight(page, 4);
  await assertSelection(page, 1, 3);
  await pressArrowRight(page);
  await assertSelection(page, 2, 0);
  await pressArrowLeft(page);
  await assertSelection(page, 1, 3);
});

test('should up/down key navigator works', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await focusRichText(page, 0);
  await assertSelection(page, 0, 3);
  await pressArrowDown(page);
  await assertSelection(page, 1, 3);
  await pressArrowDown(page);
  await assertSelection(page, 2, 3);
  await page.keyboard.press(`${SHORT_KEY}+ArrowLeft`, { delay: 50 });
  await assertSelection(page, 2, 0);
  await pressArrowUp(page);
  await assertSelection(page, 1, 0);
  await pressArrowRight(page);
  await pressArrowUp(page);
  await assertSelection(page, 0, 1);
  await pressArrowDown(page);
  await assertSelection(page, 1, 1);
});

test('should cut in title works', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await focusTitle(page);
  await type(page, 'hello');
  await assertTitle(page, 'hello');

  await dragOverTitle(page);
  await page.keyboard.press(`${SHORT_KEY}+x`);
  await assertTitle(page, '');

  await focusRichText(page);
  await page.keyboard.press(`${SHORT_KEY}+v`);
  await assertRichTexts(page, ['hello']);
});

test('should support ctrl/cmd+g convert to database', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);

  await dragBetweenIndices(
    page,
    [2, 3],
    [0, 0],
    { x: 20, y: 20 },
    { x: 0, y: 0 }
  );

  await page.keyboard.press(`${SHORT_KEY}+g`);
  const tableView = page.locator('.modal-view-item.table');
  await tableView.click();
  const database = page.locator('affine-database');
  await expect(database).toBeVisible();
  const rows = page.locator('.affine-database-block-row');
  expect(await rows.count()).toBe(3);
});

test('should forwardDelete works when delete single character', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page, 0);
  await type(page, 'hello');
  await pressArrowLeft(page, 5);
  await pressForwardDelete(page);
  await assertRichTexts(page, ['ello']);
});

test('should forwardDelete works when delete multi characters', async ({
  page,
}) => {
  test.info().annotations.push({
    type: 'issue',
    description: 'https://github.com/toeverything/blocksuite/issues/3122',
  });
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page, 0);
  await type(page, 'hello');
  await pressArrowLeft(page, 5);
  await setVirgoSelection(page, 1, 3);
  await pressForwardDelete(page);
  await assertRichTexts(page, ['ho']);
});

test('should drag multiple block and input text works', async ({ page }) => {
  test.info().annotations.push({
    type: 'issue',
    description: 'https://github.com/toeverything/blocksuite/issues/2982',
  });
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await dragBetweenIndices(page, [0, 1], [2, 1]);
  await type(page, 'ab');
  await assertRichTexts(page, ['1ab89']);
  await undoByKeyboard(page);
  await assertRichTexts(page, ['123', '456', '789']);
});
