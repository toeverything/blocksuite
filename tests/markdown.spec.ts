import {
  enterPlaygroundRoom,
  focusRichText,
  getCursorBlockIdAndHeight,
  initEmptyParagraphState,
  pressArrowLeft,
  pressBackspace,
  pressEnter,
  pressSpace,
  redoByKeyboard,
  resetHistory,
  type,
  undoByClick,
  undoByKeyboard,
  waitNextFrame,
} from './utils/actions/index.js';
import {
  assertBlockType,
  assertRichTextInlineDeltas,
  assertRichTextInlineRange,
  assertRichTexts,
  assertText,
} from './utils/asserts.js';
import { test } from './utils/playwright.js';

test('markdown shortcut', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await resetHistory(page);

  let id: string | null = null;

  await waitNextFrame(page);
  await type(page, '[] ');
  [id] = await getCursorBlockIdAndHeight(page);
  await waitNextFrame(page);
  await assertBlockType(page, id, 'todo');
  await undoByClick(page);
  await assertText(page, '[] ');
  await undoByClick(page);
  //FIXME: it just failed in playwright
  await focusRichText(page);
  await assertRichTexts(page, ['']);

  await waitNextFrame(page);
  await type(page, '[ ] ');
  [id] = await getCursorBlockIdAndHeight(page);
  await waitNextFrame(page);
  await assertBlockType(page, id, 'todo');
  await undoByClick(page);
  await assertText(page, '[ ] ');
  await undoByClick(page);
  //FIXME: it just failed in playwright
  await focusRichText(page);
  await assertRichTexts(page, ['']);

  await waitNextFrame(page);
  await type(page, '[x] ');
  [id] = await getCursorBlockIdAndHeight(page);
  await waitNextFrame(page);
  await assertBlockType(page, id, 'todo');
  await undoByClick(page);
  await assertText(page, '[x] ');
  await undoByClick(page);
  await assertRichTexts(page, ['']);

  await waitNextFrame(page);
  await type(page, '* ');
  [id] = await getCursorBlockIdAndHeight(page);
  await waitNextFrame(page);
  await assertBlockType(page, id, 'bulleted');
  await undoByClick(page);
  await assertText(page, '* ');
  await undoByClick(page);
  await assertRichTexts(page, ['']);

  await waitNextFrame(page);
  await type(page, '- ');
  [id] = await getCursorBlockIdAndHeight(page);
  await waitNextFrame(page);
  await assertBlockType(page, id, 'bulleted');
  await undoByClick(page);
  await assertText(page, '- ');
  await undoByClick(page);
  await assertRichTexts(page, ['']);

  await waitNextFrame(page);
  await type(page, '1. ');
  [id] = await getCursorBlockIdAndHeight(page);
  await waitNextFrame(page);
  await assertBlockType(page, id, 'numbered');
  await undoByClick(page);
  await assertText(page, '1. ');
  await undoByClick(page);
  await assertRichTexts(page, ['']);

  await waitNextFrame(page);
  await type(page, '20. ');
  [id] = await getCursorBlockIdAndHeight(page);
  await waitNextFrame(page);
  await assertBlockType(page, id, 'numbered');
  await undoByClick(page);
  await assertText(page, '20. ');
  await undoByClick(page);
  await assertRichTexts(page, ['']);

  await waitNextFrame(page);
  await type(page, '# ');
  [id] = await getCursorBlockIdAndHeight(page);
  await waitNextFrame(page);
  await assertBlockType(page, id, 'h1');
  await undoByClick(page);
  await assertText(page, '# ');
  await undoByClick(page);
  await assertRichTexts(page, ['']);

  await waitNextFrame(page);
  await type(page, '## ');
  [id] = await getCursorBlockIdAndHeight(page);
  await waitNextFrame(page);
  await assertBlockType(page, id, 'h2');
  await undoByClick(page);
  await assertText(page, '## ');
  await undoByClick(page);
  await assertRichTexts(page, ['']);

  await waitNextFrame(page);
  await type(page, '### ');
  [id] = await getCursorBlockIdAndHeight(page);
  await waitNextFrame(page);
  await assertBlockType(page, id, 'h3');
  await undoByClick(page);
  await assertText(page, '### ');
  await undoByClick(page);
  await assertRichTexts(page, ['']);

  await waitNextFrame(page);
  await type(page, '#### ');
  [id] = await getCursorBlockIdAndHeight(page);
  await waitNextFrame(page);
  await assertBlockType(page, id, 'h4');
  await undoByClick(page);
  await assertText(page, '#### ');
  await undoByClick(page);
  await assertRichTexts(page, ['']);

  await waitNextFrame(page);
  await type(page, '##### ');
  [id] = await getCursorBlockIdAndHeight(page);
  await waitNextFrame(page);
  await assertBlockType(page, id, 'h5');
  await undoByClick(page);
  await assertText(page, '##### ');
  await undoByClick(page);
  await assertRichTexts(page, ['']);

  await waitNextFrame(page);
  await type(page, '###### ');
  [id] = await getCursorBlockIdAndHeight(page);
  await waitNextFrame(page);
  await assertBlockType(page, id, 'h6');
  await undoByClick(page);
  await assertText(page, '###### ');
  await undoByClick(page);
  await assertRichTexts(page, ['']);

  await waitNextFrame(page);
  await type(page, '> ');
  [id] = await getCursorBlockIdAndHeight(page);
  await waitNextFrame(page);
  await assertBlockType(page, id, 'quote');
  await undoByClick(page);
  await assertText(page, '> ');
  await undoByClick(page);
  await assertRichTexts(page, ['']);

  await waitNextFrame(page);
  await type(page, '--- ');
  await undoByClick(page);
  await assertRichTexts(page, ['--- ']);
  await undoByClick(page);
  await assertRichTexts(page, ['']);
  await waitNextFrame(page);
  await type(page, '*** ');
  await undoByClick(page);
  await assertRichTexts(page, ['*** ']);
  await undoByClick(page);
  await assertRichTexts(page, ['']);
});

test.describe('markdown inline-text', async () => {
  test.beforeEach(async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    await focusRichText(page);
    await resetHistory(page);
  });

  test('bolditalic', async ({ page }) => {
    await type(page, 'aa***bb*** ');
    await assertRichTextInlineDeltas(page, [
      {
        insert: 'aa',
      },
      {
        insert: 'bb',
        attributes: {
          bold: true,
          italic: true,
        },
      },
    ]);
    await undoByKeyboard(page);
    await assertRichTextInlineRange(page, 0, 11);
    await assertRichTextInlineDeltas(page, [
      {
        insert: 'aa***bb*** ',
      },
    ]);
    await redoByKeyboard(page);
    await type(page, 'cc');
    await assertRichTextInlineDeltas(page, [
      {
        insert: 'aa',
      },
      {
        insert: 'bbcc',
        attributes: {
          bold: true,
          italic: true,
        },
      },
    ]);
    await undoByKeyboard(page);
    await undoByKeyboard(page);
    await undoByKeyboard(page);
    await assertRichTexts(page, ['']);

    await waitNextFrame(page);
    await type(page, '***test *** ');
    await assertRichTexts(page, ['***test *** ']);
    await undoByKeyboard(page);
    await assertRichTexts(page, ['']);

    // *** + space will be converted to divider, so needn't test this case here
    // await waitNextFrame(page);
    // await type(page, '*** test*** ');
    // await assertRichTexts(page, ['*** test*** ']);
    // await undoByKeyboard(page);
    // await assertRichTexts(page, ['']);
  });

  test('bold', async ({ page }) => {
    await type(page, 'aa**bb** ');
    await assertRichTextInlineDeltas(page, [
      {
        insert: 'aa',
      },
      {
        insert: 'bb',
        attributes: {
          bold: true,
        },
      },
    ]);
    await undoByKeyboard(page);
    await assertRichTextInlineRange(page, 0, 9);
    await assertRichTextInlineDeltas(page, [
      {
        insert: 'aa**bb** ',
      },
    ]);
    await redoByKeyboard(page);
    await type(page, 'cc');
    await assertRichTextInlineDeltas(page, [
      {
        insert: 'aa',
      },
      {
        insert: 'bbcc',
        attributes: {
          bold: true,
        },
      },
    ]);
    await undoByKeyboard(page);
    await undoByKeyboard(page);
    await undoByKeyboard(page);
    await assertRichTexts(page, ['']);

    await waitNextFrame(page);
    await type(page, '**test ** ');
    await assertRichTexts(page, ['**test ** ']);
    await undoByKeyboard(page);
    await assertRichTexts(page, ['']);

    await waitNextFrame(page);
    await type(page, '** test** ');
    await assertRichTexts(page, ['** test** ']);
    await undoByKeyboard(page);
    await assertRichTexts(page, ['']);
  });

  test('italic', async ({ page }) => {
    await type(page, 'aa*bb* ');
    await assertRichTextInlineDeltas(page, [
      {
        insert: 'aa',
      },
      {
        insert: 'bb',
        attributes: {
          italic: true,
        },
      },
    ]);
    await undoByKeyboard(page);
    await assertRichTextInlineRange(page, 0, 7);
    await assertRichTextInlineDeltas(page, [
      {
        insert: 'aa*bb* ',
      },
    ]);
    await redoByKeyboard(page);
    await type(page, 'cc');
    await assertRichTextInlineDeltas(page, [
      {
        insert: 'aa',
      },
      {
        insert: 'bbcc',
        attributes: {
          italic: true,
        },
      },
    ]);
    await undoByKeyboard(page);
    await undoByKeyboard(page);
    await undoByKeyboard(page);
    await assertRichTexts(page, ['']);

    await waitNextFrame(page);
    await type(page, '*test * ');
    await assertRichTexts(page, ['*test * ']);
    await undoByKeyboard(page);
    await assertRichTexts(page, ['']);

    // * + space will be converted to bulleted list, so needn't test this case here
    // await waitNextFrame(page);
    // await type(page, '* test* ');
    // await assertRichTexts(page, ['* test* ']);
    // await undoByKeyboard(page);
    // await assertRichTexts(page, ['']);
  });

  test('strike', async ({ page }) => {
    await type(page, 'aa~~bb~~ ');
    await assertRichTextInlineDeltas(page, [
      {
        insert: 'aa',
      },
      {
        insert: 'bb',
        attributes: {
          strike: true,
        },
      },
    ]);
    await undoByKeyboard(page);
    await assertRichTextInlineRange(page, 0, 9);
    await assertRichTextInlineDeltas(page, [
      {
        insert: 'aa~~bb~~ ',
      },
    ]);
    await redoByKeyboard(page);
    await type(page, 'cc');
    await assertRichTextInlineDeltas(page, [
      {
        insert: 'aa',
      },
      {
        insert: 'bbcc',
        attributes: {
          strike: true,
        },
      },
    ]);
    await undoByKeyboard(page);
    await undoByKeyboard(page);
    await undoByKeyboard(page);
    await assertRichTexts(page, ['']);

    await waitNextFrame(page);
    await type(page, '~~test ~~ ');
    await assertRichTexts(page, ['~~test ~~ ']);
    await undoByKeyboard(page);
    await assertRichTexts(page, ['']);

    await waitNextFrame(page);
    await type(page, '~~ test~~ ');
    await assertRichTexts(page, ['~~ test~~ ']);
    await undoByKeyboard(page);
    await assertRichTexts(page, ['']);
  });

  test('underline', async ({ page }) => {
    await type(page, 'aa~bb~ ');
    await assertRichTextInlineDeltas(page, [
      {
        insert: 'aa',
      },
      {
        insert: 'bb',
        attributes: {
          underline: true,
        },
      },
    ]);
    await undoByKeyboard(page);
    await assertRichTextInlineRange(page, 0, 7);
    await assertRichTextInlineDeltas(page, [
      {
        insert: 'aa~bb~ ',
      },
    ]);
    await redoByKeyboard(page);
    await type(page, 'cc');
    await assertRichTextInlineDeltas(page, [
      {
        insert: 'aa',
      },
      {
        insert: 'bbcc',
        attributes: {
          underline: true,
        },
      },
    ]);
    await undoByKeyboard(page);
    await undoByKeyboard(page);
    await undoByKeyboard(page);
    await assertRichTexts(page, ['']);

    await waitNextFrame(page);
    await type(page, '~test ~ ');
    await assertRichTexts(page, ['~test ~ ']);
    await undoByKeyboard(page);
    await assertRichTexts(page, ['']);

    await waitNextFrame(page);
    await type(page, '~ test~ ');
    await assertRichTexts(page, ['~ test~ ']);
    await undoByKeyboard(page);
    await assertRichTexts(page, ['']);
  });

  test('code', async ({ page }) => {
    await type(page, 'aa`bb` ');
    await assertRichTextInlineDeltas(page, [
      {
        insert: 'aa',
      },
      {
        insert: 'bb',
        attributes: {
          code: true,
        },
      },
    ]);
    await undoByKeyboard(page);
    await assertRichTextInlineRange(page, 0, 7);
    await assertRichTextInlineDeltas(page, [
      {
        insert: 'aa`bb` ',
      },
    ]);
    await redoByKeyboard(page);
    await type(page, 'cc');
    await assertRichTextInlineDeltas(page, [
      {
        insert: 'aa',
      },
      {
        insert: 'bb',
        attributes: {
          code: true,
        },
      },
      {
        insert: 'cc',
      },
    ]);
    await undoByKeyboard(page);
    await undoByKeyboard(page);
    await undoByKeyboard(page);
    await assertRichTexts(page, ['']);

    await waitNextFrame(page);
    await type(page, '`test ` ');
    await assertRichTexts(page, ['`test ` ']);
    await undoByKeyboard(page);
    await assertRichTexts(page, ['']);

    await waitNextFrame(page);
    await type(page, '` test` ');
    await assertRichTexts(page, ['` test` ']);
    await undoByKeyboard(page);
    await assertRichTexts(page, ['']);
  });
});

test('inline code should work when pressing Enter followed by Backspace twice', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  await type(page, '`test`');
  await pressSpace(page);
  await waitNextFrame(page);
  await pressArrowLeft(page);
  await waitNextFrame(page);
  await pressEnter(page);
  await waitNextFrame(page);
  await pressBackspace(page);
  await waitNextFrame(page);
  await pressEnter(page);
  await waitNextFrame(page);
  await pressBackspace(page);

  await assertRichTexts(page, ['test']);
});
