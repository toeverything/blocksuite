import { test } from '@playwright/test';
import {
  enterPlaygroundRoom,
  focusRichText,
  getCursorBlockIdAndHeight,
} from './utils/actions';
import { assertBlockType } from './utils/asserts';

test('markdown todo test1', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);
  await page.keyboard.type('[] ');
  const [id] = await getCursorBlockIdAndHeight(page);
  await assertBlockType(page, id, 'todo');
});

test('markdown todo test2', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);
  await page.keyboard.type('[ ] ');
  const [id] = await getCursorBlockIdAndHeight(page);
  await assertBlockType(page, id, 'todo');
});

test('markdown todo test3', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);
  await page.keyboard.type('[x] ');
  const [id] = await getCursorBlockIdAndHeight(page);
  await assertBlockType(page, id, 'todo');
});

test('markdown bulleted test1', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);
  await page.keyboard.type('* ');
  const [id] = await getCursorBlockIdAndHeight(page);
  await assertBlockType(page, id, 'bulleted');
});
test('markdown bulleted test2', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);
  await page.keyboard.type('- ');
  const [id] = await getCursorBlockIdAndHeight(page);
  await assertBlockType(page, id, 'bulleted');
});
test('markdown numbered test1', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);
  await page.keyboard.type('1. ');
  const [id] = await getCursorBlockIdAndHeight(page);
  await assertBlockType(page, id, 'numbered');
});
test('markdown numbered test2', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);
  await page.keyboard.type('20. ');
  const [id] = await getCursorBlockIdAndHeight(page);
  await assertBlockType(page, id, 'numbered');
});
test('markdown H1', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);
  await page.keyboard.type('# ');
  const [id] = await getCursorBlockIdAndHeight(page);
  await assertBlockType(page, id, 'h1');
});

test('markdown H2', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);
  await page.keyboard.type('## ');
  const [id] = await getCursorBlockIdAndHeight(page);
  await assertBlockType(page, id, 'h2');
});

test('markdown H3', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);
  await page.keyboard.type('### ');
  const [id] = await getCursorBlockIdAndHeight(page);
  await assertBlockType(page, id, 'h3');
});

test('markdown H4', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);
  await page.keyboard.type('#### ');
  const [id] = await getCursorBlockIdAndHeight(page);
  await assertBlockType(page, id, 'h4');
});

test('markdown H5', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);
  await page.keyboard.type('##### ');
  const [id] = await getCursorBlockIdAndHeight(page);
  await assertBlockType(page, id, 'h5');
});

test('markdown H6', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);
  await page.keyboard.type('###### ');
  const [id] = await getCursorBlockIdAndHeight(page);
  await assertBlockType(page, id, 'h6');
});

test('markdown quote', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);
  await page.keyboard.type('> ');
  const [id] = await getCursorBlockIdAndHeight(page);
  await assertBlockType(page, id, 'quote');
});
