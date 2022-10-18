import { test } from '@playwright/test';
import {
  enterPlaygroundRoom,
  focusRichText,
  getCursorBlockIdAndHeight,
  pressEnter,
  undoByClick,
  undoByKeyboard,
  waitNextFrame,
} from './utils/actions';
import {
  assertBlockType,
  assertRichTexts,
  assertText,
  assertTextContain,
  assertTextFormat,
} from './utils/asserts';

test('markdown shortcut', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);

  await page.evaluate(() => {
    // @ts-ignore
    window.store.captureSync();
  });
  let id: string | null = null;

  await page.keyboard.type('[] ');
  [id] = await getCursorBlockIdAndHeight(page);
  await assertBlockType(page, id, 'todo');
  await undoByClick(page);
  await assertText(page, '[] ');
  await undoByClick(page);
  await assertRichTexts(page, ['\n']);

  await page.keyboard.type('[ ] ');
  [id] = await getCursorBlockIdAndHeight(page);
  await assertBlockType(page, id, 'todo');
  await undoByClick(page);
  await assertText(page, '[ ] ');
  await undoByClick(page);
  await assertRichTexts(page, ['\n']);

  await page.keyboard.type('[x] ');
  [id] = await getCursorBlockIdAndHeight(page);
  await assertBlockType(page, id, 'todo');
  await undoByClick(page);
  await assertText(page, '[x] ');
  await undoByClick(page);
  await assertRichTexts(page, ['\n']);

  await page.keyboard.type('* ');
  [id] = await getCursorBlockIdAndHeight(page);
  await assertBlockType(page, id, 'bulleted');
  await undoByClick(page);
  await assertText(page, '* ');
  await undoByClick(page);
  await assertRichTexts(page, ['\n']);

  await page.keyboard.type('- ');
  [id] = await getCursorBlockIdAndHeight(page);
  await assertBlockType(page, id, 'bulleted');
  await undoByClick(page);
  await assertText(page, '- ');
  await undoByClick(page);
  await assertRichTexts(page, ['\n']);

  await page.keyboard.type('1. ');
  [id] = await getCursorBlockIdAndHeight(page);
  await assertBlockType(page, id, 'numbered');
  await undoByClick(page);
  await assertText(page, '1. ');
  await undoByClick(page);
  await assertRichTexts(page, ['\n']);

  await page.keyboard.type('20. ');
  [id] = await getCursorBlockIdAndHeight(page);
  await assertBlockType(page, id, 'numbered');
  await undoByClick(page);
  await assertText(page, '20. ');
  await undoByClick(page);
  await assertRichTexts(page, ['\n']);

  await page.keyboard.type('# ');
  [id] = await getCursorBlockIdAndHeight(page);
  await assertBlockType(page, id, 'h1');
  await undoByClick(page);
  await assertText(page, '# ');
  await undoByClick(page);
  await assertRichTexts(page, ['\n']);

  await page.keyboard.type('## ');
  [id] = await getCursorBlockIdAndHeight(page);
  await assertBlockType(page, id, 'h2');
  await undoByClick(page);
  await assertText(page, '## ');
  await undoByClick(page);
  await assertRichTexts(page, ['\n']);

  await page.keyboard.type('### ');
  [id] = await getCursorBlockIdAndHeight(page);
  await assertBlockType(page, id, 'h3');
  await undoByClick(page);
  await assertText(page, '### ');
  await undoByClick(page);
  await assertRichTexts(page, ['\n']);

  await page.keyboard.type('#### ');
  [id] = await getCursorBlockIdAndHeight(page);
  await assertBlockType(page, id, 'h4');
  await undoByClick(page);
  await assertText(page, '#### ');
  await undoByClick(page);
  await assertRichTexts(page, ['\n']);

  await page.keyboard.type('##### ');
  [id] = await getCursorBlockIdAndHeight(page);
  await assertBlockType(page, id, 'h5');
  await undoByClick(page);
  await assertText(page, '##### ');
  await undoByClick(page);
  await assertRichTexts(page, ['\n']);

  await page.keyboard.type('###### ');
  [id] = await getCursorBlockIdAndHeight(page);
  await assertBlockType(page, id, 'h6');
  await undoByClick(page);
  await assertText(page, '###### ');
  await undoByClick(page);
  await assertRichTexts(page, ['\n']);

  await page.keyboard.type('> ');
  [id] = await getCursorBlockIdAndHeight(page);
  await assertBlockType(page, id, 'quote');
  await undoByClick(page);
  await assertText(page, '> ');
  await undoByClick(page);
  await assertRichTexts(page, ['\n']);
});

test('markdown inline-text', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);

  await page.evaluate(() => {
    // @ts-ignore
    window.store.captureSync();
  });
  let id: string | null = null;

  await page.keyboard.type('***test*** ');
  [id] = await getCursorBlockIdAndHeight(page);
  await assertTextFormat(page, { bold: true, italic: true });
  await page.keyboard.type('test');
  await assertTextFormat(page, {}, 6);
  await undoByKeyboard(page);
  await assertRichTexts(page, ['***test*** ']);
  await undoByKeyboard(page);
  await assertRichTexts(page, ['\n']);

  await page.keyboard.type('**test** ');
  [id] = await getCursorBlockIdAndHeight(page);
  await assertTextFormat(page, { bold: true });
  await page.keyboard.type('test');
  await assertTextFormat(page, {}, 6);
  await undoByClick(page);
  await assertRichTexts(page, ['**test** ']);
  await undoByClick(page);
  await assertRichTexts(page, ['\n']);

  await page.keyboard.type('*test* ');
  [id] = await getCursorBlockIdAndHeight(page);
  await assertTextFormat(page, { italic: true });
  await page.keyboard.type('test');
  await assertTextFormat(page, {}, 6);
  await undoByClick(page);
  await assertRichTexts(page, ['*test* ']);
  await undoByClick(page);
  await assertRichTexts(page, ['\n']);

  await page.keyboard.type('~~test~~ ');
  [id] = await getCursorBlockIdAndHeight(page);
  await assertTextFormat(page, { strike: true });
  await page.keyboard.type('test');
  await assertTextFormat(page, {}, 6);
  await undoByClick(page);
  await assertRichTexts(page, ['~~test~~ ']);
  await undoByClick(page);
  await assertRichTexts(page, ['\n']);

  await page.keyboard.type('~test~ ');
  [id] = await getCursorBlockIdAndHeight(page);
  await assertTextFormat(page, { underline: true });
  await page.keyboard.type('test');
  await assertTextFormat(page, {}, 6);
  await undoByClick(page);
  await assertRichTexts(page, ['~test~ ']);
  await undoByClick(page);
  await assertRichTexts(page, ['\n']);

  await page.keyboard.type('`test` ');
  [id] = await getCursorBlockIdAndHeight(page);
  await assertTextFormat(page, { code: true });
  await page.keyboard.type('test');
  await assertTextFormat(page, {}, 6);
  await undoByClick(page);
  await assertRichTexts(page, ['`test` ']);
  await undoByClick(page);
  await assertRichTexts(page, ['\n']);

  await page.keyboard.type('[test](www.test.com) ');
  [id] = await getCursorBlockIdAndHeight(page);
  await assertTextFormat(page, { link: 'www.test.com' });
  await page.keyboard.type('test');
  await assertTextFormat(page, {}, 6);
  await undoByClick(page);
  await assertRichTexts(page, ['[test](www.test.com) ']);
  await undoByClick(page);
  await assertRichTexts(page, ['\n']);

  await page.keyboard.type('www.test.com ');
  [id] = await getCursorBlockIdAndHeight(page);
  await assertTextFormat(page, { link: 'www.test.com' });
  await page.keyboard.type('test');
  await assertTextFormat(page, {}, 13);
  await undoByClick(page);
  await assertTextContain(page, 'www.test.com ');
  await undoByClick(page);
  // todo
  // await assertRichTexts(page, ['\n']);
});
