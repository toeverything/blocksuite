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
  convertToBulletedListByClick,
  formatType,
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

  await selectAllByKeyboard(page); // first select all in rich text
  await page.keyboard.press('Backspace');
  await assertRichTexts(page, ['\n']);
});

test('single line rich-text inline code hotkey', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await page.keyboard.type('hello');
  await selectAllByKeyboard(page);
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
  const { groupId } = await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  // 0    1   2
  // 1|23 456 78|9
  await dragBetweenIndices(page, [0, 1], [2, 2]);
  await inlineCode(page);

  await assertStoreMatchJSX(
    page,
    `
<affine:group
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
</affine:group>`,
    groupId
  );

  await undoByClick(page);

  await assertStoreMatchJSX(
    page,
    `
<affine:group
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
</affine:group>`,
    groupId
  );

  await redoByClick(page);

  await assertStoreMatchJSX(
    page,
    `
<affine:group
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
</affine:group>`,
    groupId
  );
});

test('single line rich-text strikethrough hotkey', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await page.keyboard.type('hello');
  await selectAllByKeyboard(page);
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

test('format list to h1', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await focusRichText(page, 0);
  await convertToBulletedListByClick(page);
  await page.keyboard.type('aa');
  await focusRichText(page, 0);
  await formatType(page);
  await assertTypeFormat(page, 'h1');
  await undoByKeyboard(page);
  await assertTypeFormat(page, 'bulleted');
  await redoByKeyboard(page);
  await assertTypeFormat(page, 'h1');
});
