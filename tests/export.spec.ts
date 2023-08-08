import './utils/declare-test-window.js';

import { expect } from '@playwright/test';

import {
  addNote,
  enterPlaygroundRoom,
  export2Html,
  focusRichText,
  focusTitle,
  initEmptyEdgelessState,
  initEmptyParagraphState,
  pressEnter,
  setEdgelessTool,
  switchEditorMode,
  type,
} from './utils/actions/index.js';
import { test } from './utils/playwright.js';
test('export html title', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await focusTitle(page);
  await type(page, 'this is title');

  await switchEditorMode(page);
  await setEdgelessTool(page, 'note');

  await addNote(page, 'hello', 30, 40);
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
