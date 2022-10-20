import { test } from '@playwright/test';
import {
  enterPlaygroundRoom,
  focusRichText,
  copyKeyboard,
  pasteKeyboard,
  setQuillSelection,
  pasteContent,
  getCursorBlockIdAndHeight,
  undoByClick,
} from './utils/actions';
import {
  assertBlockType,
  assertBlockTypes,
  assertRichTexts,
  assertText,
  assertTextFormats,
} from './utils/asserts';

// TODO fix CI
test.skip('clipboard copy paste', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);

  await page.keyboard.type('test');
  await setQuillSelection(page, 0, 3);
  await copyKeyboard(page);
  await focusRichText(page);
  await pasteKeyboard(page);
  await assertText(page, 'testest');
});

test('markdown format parse', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);
  await page.evaluate(() => {
    // @ts-ignore
    window.store.captureSync();
  });
  let id: string | null = null;

  let clipData = {
    'text/plain': `# text
# h1

## h2

### h3

#### h4

##### h5

###### h6

[] todo

[ ] todo

[x] todo

* bulleted

- bulleted

1. numbered

> quote
`,
  };
  await pasteContent(page, clipData);
  [id] = await getCursorBlockIdAndHeight(page);
  await assertBlockTypes(page, [
    'text',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'todo',
    'todo',
    'todo',
    'bulleted',
    'bulleted',
    'numbered',
    'quote',
  ]);
  await assertRichTexts(page, [
    'text',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'todo',
    'todo',
    'todo',
    'bulleted',
    'bulleted',
    'numbered',
    'quote',
  ]);
  await undoByClick(page);
  await assertRichTexts(page, ['\n']);

  clipData = {
    'text/plain': `# ***bolditalic***
# **bold**

*italic*

~~strikethrough~~

~underthrough~

[link](linktest)

\`code\`
`,
  };
  await pasteContent(page, clipData);
  [id] = await getCursorBlockIdAndHeight(page);
  await assertTextFormats(page, [
    { bold: true, italic: true },
    { bold: true },
    { italic: true },
    { strike: true },
    { underline: true },
    { link: 'linktest' },
    { code: true },
  ]);
  await undoByClick(page);
  await assertRichTexts(page, ['\n']);
});
