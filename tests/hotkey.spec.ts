import { test } from '@playwright/test';
import {
  enterPlaygroundRoom,
  focusRichText,
  selectAllByKeyboard,
  inlineCode,
  undoByClick,
  redoByClick,
  strikethrough,
  undoByKeyboard,
  redoByKeyboard,
  pressEnter,
  initThreeParagraphs,
  dragBetweenIndices,
  initEmptyParagraphState,
  formatType,
  clickBlockTypeMenuItem,
  SHORT_KEY,
  SECONDARY_KEY,
} from './utils/actions/index.js';
import {
  assertRichTexts,
  assertStoreMatchJSX,
  assertTextFormat,
  assertTypeFormat,
} from './utils/asserts.js';

test('rich-text hotkey scope on single press', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await page.keyboard.type('hello');
  await pressEnter(page);
  await page.keyboard.type('world');
  await assertRichTexts(page, ['hello', 'world']);

  await dragBetweenIndices(page, [0, 0], [1, 5]);
  await page.keyboard.press('Backspace');
  await assertRichTexts(page, ['\n']);
});

test('single line rich-text inline code hotkey', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await page.keyboard.type('hello');
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
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await page.keyboard.type('Hello');
  await selectAllByKeyboard(page);
  await inlineCode(page);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.type('block suite', { delay: 10 });
  // block suite should not be code
  await assertTextFormat(page, 0, 6, {});
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
<affine:frame
  prop:xywh="[0,0,720,112]"
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
</affine:frame>`,
    frameId
  );

  await undoByClick(page);

  await assertStoreMatchJSX(
    page,
    `
<affine:frame
  prop:xywh="[0,0,720,112]"
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
</affine:frame>`,
    frameId
  );

  await redoByClick(page);

  await assertStoreMatchJSX(
    page,
    `
<affine:frame
  prop:xywh="[0,0,720,112]"
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
</affine:frame>`,
    frameId
  );
});

test('single line rich-text strikethrough hotkey', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await page.keyboard.type('hello');
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
  await page.keyboard.type('hello');
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
<affine:frame
  prop:xywh="[0,0,720,32]"
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
<affine:frame
  prop:xywh="[0,0,720,32]"
>
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
<affine:frame
  prop:xywh="[0,0,720,112]"
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
<affine:frame
  prop:xywh="[0,0,720,112]"
>
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
  await page.keyboard.type('hello');

  // XXX wait for group to be updated
  await page.waitForTimeout(10);
  await page.keyboard.press(`${SHORT_KEY}+${SECONDARY_KEY}+1`);
  await assertStoreMatchJSX(
    page,
    `
<affine:frame
  prop:xywh="[0,0,720,32]"
>
  <affine:paragraph
    prop:text="hello"
    prop:type="h1"
  />
</affine:frame>`,
    frameId
  );
  await page.keyboard.press(`${SHORT_KEY}+${SECONDARY_KEY}+6`);
  await assertStoreMatchJSX(
    page,
    `
<affine:frame
  prop:xywh="[0,0,720,32]"
>
  <affine:paragraph
    prop:text="hello"
    prop:type="h6"
  />
</affine:frame>`,
    frameId
  );
  await page.keyboard.press(`${SHORT_KEY}+${SECONDARY_KEY}+8`);
  await assertStoreMatchJSX(
    page,
    `
<affine:frame
  prop:xywh="[0,0,720,32]"
>
  <affine:list
    prop:checked={false}
    prop:text="hello"
    prop:type="bulleted"
  />
</affine:frame>`,
    frameId
  );
  await page.keyboard.press(`${SHORT_KEY}+${SECONDARY_KEY}+9`);
  await assertStoreMatchJSX(
    page,
    `
<affine:frame
  prop:xywh="[0,0,720,32]"
>
  <affine:list
    prop:checked={false}
    prop:text="hello"
    prop:type="numbered"
  />
</affine:frame>`,
    frameId
  );
  await page.keyboard.press(`${SHORT_KEY}+${SECONDARY_KEY}+0`);
  await assertStoreMatchJSX(
    page,
    `
<affine:frame
  prop:xywh="[0,0,720,32]"
>
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
  await page.keyboard.type('aa');
  await focusRichText(page, 0);
  await formatType(page);
  await assertTypeFormat(page, 'h1');
  await undoByKeyboard(page);
  await assertTypeFormat(page, 'bulleted');
  await redoByKeyboard(page);
  await assertTypeFormat(page, 'h1');
});
