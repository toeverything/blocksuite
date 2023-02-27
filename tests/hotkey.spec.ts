import { expect } from '@playwright/test';

import {
  clickBlockTypeMenuItem,
  dragBetweenIndices,
  enterPlaygroundRoom,
  focusRichText,
  formatType,
  initEmptyParagraphState,
  initThreeParagraphs,
  inlineCode,
  MODIFIER_KEY,
  pressEnter,
  readClipboardText,
  redoByClick,
  redoByKeyboard,
  resetHistory,
  selectAllByKeyboard,
  SHORT_KEY,
  strikethrough,
  type,
  undoByClick,
  undoByKeyboard,
} from './utils/actions/index.js';
import {
  assertRichTexts,
  assertStoreMatchJSX,
  assertTextFormat,
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
  await assertRichTexts(page, ['\n']);
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
  await assertTextFormat(page, 0, 5, { code: true });

  await focusRichText(page);
  await page.keyboard.press(`${SHORT_KEY}+ArrowRight`);
  await type(page, 'block suite');
  // TODO fix the `code={false}` text
  // block suite should not be code
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
        code={false}
        insert=" b"
      />
      <text
        insert="lock suite"
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
  const { frameId } = await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  // 0    1   2
  // 1|23 456 78|9
  await dragBetweenIndices(page, [0, 1], [2, 2]);
  await inlineCode(page);

  await assertStoreMatchJSX(
    page,
    `
<affine:frame>
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
</affine:frame>`,
    frameId
  );

  await undoByClick(page);

  await assertStoreMatchJSX(
    page,
    `
<affine:frame>
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
</affine:frame>`,
    frameId
  );

  await redoByClick(page);

  await assertStoreMatchJSX(
    page,
    `
<affine:frame>
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
</affine:frame>`,
    frameId
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

  // the format should be removed after trigger the hotkey again
  await strikethrough(page);
  await assertTextFormat(page, 0, 0, {});
});

test('should single line format hotkey work', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { frameId } = await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'hello');
  await dragBetweenIndices(page, [0, 1], [0, 4]);

  // bold
  await page.keyboard.press(`${SHORT_KEY}+b`);
  // italic
  await page.keyboard.press(`${SHORT_KEY}+i`);
  // underline
  await page.keyboard.press(`${SHORT_KEY}+u`);
  // strikethrough
  await page.keyboard.press(`${SHORT_KEY}+Shift+s`);

  await assertStoreMatchJSX(
    page,
    `
<affine:frame>
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
</affine:frame>`,
    frameId
  );

  // bold
  await page.keyboard.press(`${SHORT_KEY}+b`);
  // italic
  await page.keyboard.press(`${SHORT_KEY}+i`);
  // underline
  await page.keyboard.press(`${SHORT_KEY}+u`);
  // strikethrough
  await page.keyboard.press(`${SHORT_KEY}+Shift+s`);

  await assertStoreMatchJSX(
    page,
    `
<affine:frame>
  <affine:paragraph
    prop:text={
      <>
        <text
          insert="h"
        />
        <text
          bold={false}
          insert="ell"
          italic={false}
          strike={false}
          underline={false}
        />
        <text
          insert="o"
        />
      </>
    }
    prop:type="text"
  />
</affine:frame>`,
    frameId
  );
});

test('should multiple line format hotkey work', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { frameId } = await initEmptyParagraphState(page);
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

  await assertStoreMatchJSX(
    page,
    `
<affine:frame>
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
</affine:frame>`,
    frameId
  );

  // bold
  await page.keyboard.press(`${SHORT_KEY}+b`);
  // italic
  await page.keyboard.press(`${SHORT_KEY}+i`);
  // underline
  await page.keyboard.press(`${SHORT_KEY}+u`);
  // strikethrough
  await page.keyboard.press(`${SHORT_KEY}+Shift+s`);

  await assertStoreMatchJSX(
    page,
    `
<affine:frame>
  <affine:paragraph
    prop:text={
      <>
        <text
          insert="1"
        />
        <text
          bold={false}
          insert="23"
          italic={false}
          strike={false}
          underline={false}
        />
      </>
    }
    prop:type="text"
  />
  <affine:paragraph
    prop:text={
      <>
        <text
          bold={false}
          insert="456"
          italic={false}
          strike={false}
          underline={false}
        />
      </>
    }
    prop:type="text"
  />
  <affine:paragraph
    prop:text={
      <>
        <text
          bold={false}
          insert="78"
          italic={false}
          strike={false}
          underline={false}
        />
        <text
          insert="9"
        />
      </>
    }
    prop:type="text"
  />
</affine:frame>`,
    frameId
  );
});

test('should hotkey work in paragraph', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { frameId } = await initEmptyParagraphState(page);

  await focusRichText(page, 0);
  await type(page, 'hello');

  // XXX wait for group to be updated
  await page.waitForTimeout(10);
  await page.keyboard.press(`${SHORT_KEY}+${MODIFIER_KEY}+1`);
  await assertStoreMatchJSX(
    page,
    `
<affine:frame>
  <affine:paragraph
    prop:text="hello"
    prop:type="h1"
  />
</affine:frame>`,
    frameId
  );
  await page.keyboard.press(`${SHORT_KEY}+${MODIFIER_KEY}+6`);
  await assertStoreMatchJSX(
    page,
    `
<affine:frame>
  <affine:paragraph
    prop:text="hello"
    prop:type="h6"
  />
</affine:frame>`,
    frameId
  );
  await page.keyboard.press(`${SHORT_KEY}+${MODIFIER_KEY}+8`);
  await assertStoreMatchJSX(
    page,
    `
<affine:frame>
  <affine:list
    prop:checked={false}
    prop:text="hello"
    prop:type="bulleted"
  />
</affine:frame>`,
    frameId
  );
  await page.keyboard.press(`${SHORT_KEY}+${MODIFIER_KEY}+9`);
  await assertStoreMatchJSX(
    page,
    `
<affine:frame>
  <affine:list
    prop:checked={false}
    prop:text="hello"
    prop:type="numbered"
  />
</affine:frame>`,
    frameId
  );
  await page.keyboard.press(`${SHORT_KEY}+${MODIFIER_KEY}+0`);
  await assertStoreMatchJSX(
    page,
    `
<affine:frame>
  <affine:paragraph
    prop:text="hello"
    prop:type="text"
  />
</affine:frame>`,
    frameId
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
  const { frameId } = await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'hello');
  await resetHistory(page);
  await dragBetweenIndices(page, [0, 1], [0, 4]);
  // cut
  await page.keyboard.press(`${SHORT_KEY}+x`);
  await assertStoreMatchJSX(
    page,
    `
<affine:frame>
  <affine:paragraph
    prop:text="ho"
    prop:type="text"
  />
</affine:frame>`,
    frameId
  );
  await undoByKeyboard(page);
  const text = await readClipboardText(page);
  expect(text).toBe('ell');
  await assertStoreMatchJSX(
    page,
    `
<affine:frame>
  <affine:paragraph
    prop:text="hello"
    prop:type="text"
  />
</affine:frame>`,
    frameId
  );
});

test('should cut work multiple line', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { frameId } = await initEmptyParagraphState(page);
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
<affine:frame>
  <affine:paragraph
    prop:text="19"
    prop:type="text"
  />
</affine:frame>`,
    frameId
  );
  await undoByKeyboard(page);
  const text = await readClipboardText(page);
  expect(text).toBe('2345678');
  await assertStoreMatchJSX(
    page,
    `
<affine:frame>
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
</affine:frame>`,
    frameId
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
  await assertRichTexts(page, ['1', '23']);
  await page.keyboard.press(`${SHORT_KEY}+Enter`);
  await assertRichTexts(page, ['1', '23', '\n']);
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
