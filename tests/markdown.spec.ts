import { test } from '@playwright/test';
import {
  enterPlaygroundRoom,
  focusRichText,
  getCursorBlockIdAndHeight,
  undoByClick,
} from './utils/actions';
import { assertBlockType, assertText } from './utils/asserts';

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
  assertText(page, '[] ');
  await undoByClick(page);

  await page.keyboard.type('[ ] ');
  [id] = await getCursorBlockIdAndHeight(page);
  await assertBlockType(page, id, 'todo');
  await undoByClick(page);
  assertText(page, '[ ] ');
  await undoByClick(page);

  await page.keyboard.type('[x] ');
  [id] = await getCursorBlockIdAndHeight(page);
  await assertBlockType(page, id, 'todo');
  await undoByClick(page);
  assertText(page, '[x] ');
  await undoByClick(page);

  await page.keyboard.type('* ');
  [id] = await getCursorBlockIdAndHeight(page);
  await assertBlockType(page, id, 'bulleted');
  await undoByClick(page);
  assertText(page, '* ');
  await undoByClick(page);

  await page.keyboard.type('- ');
  [id] = await getCursorBlockIdAndHeight(page);
  await assertBlockType(page, id, 'bulleted');
  await undoByClick(page);
  assertText(page, '- ');
  await undoByClick(page);

  await page.keyboard.type('1. ');
  [id] = await getCursorBlockIdAndHeight(page);
  await assertBlockType(page, id, 'numbered');
  await undoByClick(page);
  assertText(page, '1. ');
  await undoByClick(page);

  await page.keyboard.type('20. ');
  [id] = await getCursorBlockIdAndHeight(page);
  await assertBlockType(page, id, 'numbered');
  await undoByClick(page);
  assertText(page, '20. ');
  await undoByClick(page);

  await page.keyboard.type('# ');
  [id] = await getCursorBlockIdAndHeight(page);
  await assertBlockType(page, id, 'h1');
  await undoByClick(page);
  assertText(page, '# ');
  await undoByClick(page);

  await page.keyboard.type('## ');
  [id] = await getCursorBlockIdAndHeight(page);
  await assertBlockType(page, id, 'h2');
  await undoByClick(page);
  assertText(page, '## ');
  await undoByClick(page);

  await page.keyboard.type('### ');
  [id] = await getCursorBlockIdAndHeight(page);
  await assertBlockType(page, id, 'h3');
  await undoByClick(page);
  assertText(page, '### ');
  await undoByClick(page);

  await page.keyboard.type('#### ');
  [id] = await getCursorBlockIdAndHeight(page);
  await assertBlockType(page, id, 'h4');
  await undoByClick(page);
  assertText(page, '#### ');
  await undoByClick(page);

  await page.keyboard.type('##### ');
  [id] = await getCursorBlockIdAndHeight(page);
  await assertBlockType(page, id, 'h5');
  await undoByClick(page);
  assertText(page, '##### ');
  await undoByClick(page);

  await page.keyboard.type('###### ');
  [id] = await getCursorBlockIdAndHeight(page);
  await assertBlockType(page, id, 'h6');
  await undoByClick(page);
  assertText(page, '###### ');
  await undoByClick(page);

  await page.keyboard.type('> ');
  [id] = await getCursorBlockIdAndHeight(page);
  await assertBlockType(page, id, 'quote');
});
