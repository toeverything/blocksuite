import './utils/declare-test-window.js';

import { expect } from '@playwright/test';

import {
  addNote,
  enterPlaygroundRoom,
  export2Html,
  export2markdown,
  focusRichText,
  focusTitle,
  initEmptyEdgelessState,
  initEmptyParagraphState,
  pressEnter,
  pressShiftTab,
  pressTab,
  switchEditorMode,
  type,
  updateBlockType,
  waitNextFrame,
} from './utils/actions/index.js';
import { test } from './utils/playwright.js';
test('export html title', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await focusTitle(page);
  await type(page, 'this is title');

  await switchEditorMode(page);
  await waitNextFrame(page);
  await addNote(page, 'hello', 30, 40);
  await waitNextFrame(page);
  await addNote(page, 'world', 80, 40);

  const htmlText = await export2Html(page);
  expect(htmlText).toEqual(
    '<header><h1 class="page-title">this is title</h1></header><div><p></p><p>hello</p><p>world</p></div>'
  );
});

test('export html bookmark', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, '/bookmark');
  await pressEnter(page);
  await type(page, 'https://github.com/toeverything/AFFiNE');
  await pressEnter(page);

  const htmlText = await export2Html(page);
  expect(htmlText).toContain(
    '<a href="https://github.com/toeverything/AFFiNE" class="affine-bookmark-link bookmark source">'
  );
  expect(htmlText).toContain(
    '<div class="affine-bookmark-title-content bookmark-title">Bookmark</div>'
  );
  expect(htmlText).toContain(
    '<div class="affine-bookmark-description bookmark-description">https://github.com/toeverything/AFFiNE</div>'
  );
});

test('export html contain <code></code>', async ({ page }) => {
  test.info().annotations.push({
    type: 'issue',
    description: 'https://github.com/toeverything/blocksuite/issues/2326',
  });

  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await focusRichText(page);
  await type(page, '```ts');
  await type(page, ' ');
  await type(page, 'console.log(123);\nconst a = 123;');

  const htmlText = await export2Html(page);
  // because style from "shiki" may be change in the future, so we just check the structure
  expect(htmlText).toContain('<span class="line"><span style="');
  expect(htmlText).toContain('<span class="line"></span>');
  expect(htmlText).toContain('>console</span>');
  expect(htmlText).toContain('><code><span');
  expect(htmlText).toContain('<span class="line"></span></code></pre>');
});

test('export html contain <blockquote>', async ({ page }) => {
  test.info().annotations.push({
    type: 'issue',
    description: 'https://github.com/toeverything/blocksuite/issues/2326',
  });

  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await focusRichText(page);
  await type(page, '>');
  await type(page, ' ');
  await type(page, 'page quote is here');

  const htmlText = await export2Html(page);
  expect(htmlText).toContain(
    '<header><h1 class="page-title">Untitled</h1></header><div><blockquote class="quote">page quote is here</blockquote></div>'
  );
});

test('export markdown title', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await focusTitle(page);
  const markdownText1 = await export2markdown(page);
  expect(markdownText1).toEqual('# Untitled');

  await type(page, 'this is title');
  const markdownText2 = await export2markdown(page);
  expect(markdownText2).toEqual('# this is title');
});

test('export markdown list', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await focusRichText(page);
  await updateBlockType(page, 'affine:list', 'bulleted');
  await type(page, 'aa');
  await pressEnter(page);
  await pressTab(page);
  await updateBlockType(page, 'affine:list', 'bulleted');
  await type(page, 'bb');
  await pressEnter(page);
  await updateBlockType(page, 'affine:list', 'bulleted');
  await type(page, 'cc');
  await pressEnter(page);
  await pressShiftTab(page);
  await updateBlockType(page, 'affine:list', 'bulleted');
  await type(page, 'dd');
  const markdownText = await export2markdown(page);
  expect(markdownText).toEqual(
    '# Untitled\r\n\r\n* aa\r\n\r\n    * bb\r\n\r\n    * cc\r\n\r\n* dd'
  );
});

test('export markdown list todo', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await focusRichText(page);
  await updateBlockType(page, 'affine:list', 'todo');
  await type(page, 'aa');
  await pressEnter(page);
  await pressTab(page);
  await updateBlockType(page, 'affine:list', 'todo');
  await type(page, 'bb');
  await pressEnter(page);
  await updateBlockType(page, 'affine:paragraph');
  await type(page, 'cc');
  await pressEnter(page);
  await pressShiftTab(page);
  await updateBlockType(page, 'affine:list', 'todo');
  await type(page, 'dd');
  const markdownText = await export2markdown(page);
  expect(markdownText).toEqual(
    '# Untitled\r\n\r\n* [ ] aa\r\n\r\n    * [ ] bb\r\n\r\ncc\r\n\r\n* [ ] dd'
  );
});

test('export markdown divider', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await focusRichText(page);
  await updateBlockType(page, 'affine:divider');

  const markdownText = await export2markdown(page);
  expect(markdownText).toEqual('# Untitled\r\n\r\n* * *');
});

test('export markdown code', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await focusRichText(page);
  await type(page, '```ts');
  await type(page, ' ');
  await type(page, 'console.log(123);\nconst a = 123;');

  const markdownText = await export2markdown(page);
  expect(markdownText).toEqual(
    '# Untitled\r\n\r\n```typescript\r\nconsole.log(123);\nconst a = 123;)\r\n```'
  );
});

test('export markdown bookmark', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, '/bookmark');
  await pressEnter(page);
  await type(page, 'https://github.com/toeverything/AFFiNE');
  await pressEnter(page);

  const markdownText = await export2markdown(page);
  expect(markdownText).toEqual(
    '# Untitled\r\n\r\n[Bookmark](https://github.com/toeverything/AFFiNE)'
  );
});
