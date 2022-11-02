import { test } from '@playwright/test';
import {
  enterPlaygroundRoom,
  focusRichText,
  setQuillSelection,
  pasteContent,
  undoByClick,
  importMarkdown,
  dragBetweenCoords,
  setSelection,
  pressEnter,
  initEmptyState,
  resetHistory,
  copyByKeyboard,
  pasteByKeyboard,
} from './utils/actions';
import {
  assertBlockTypes,
  assertClipItems,
  assertRichTexts,
  assertSelection,
  assertText,
  assertTextFormats,
} from './utils/asserts';

// TODO fix CI
test.skip('clipboard copy paste', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyState(page);
  await focusRichText(page);

  await page.keyboard.type('test');
  await setQuillSelection(page, 0, 3);
  await copyByKeyboard(page);
  await focusRichText(page);
  await pasteByKeyboard(page);
  await assertText(page, 'testest');
});

test('markdown format parse', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyState(page);
  await focusRichText(page);
  await resetHistory(page);

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

test('splic block when paste', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyState(page);
  await focusRichText(page);
  await resetHistory(page);

  const clipData = {
    'text/plain': `# text
# h1
`,
  };
  await page.keyboard.type('abc');
  await setQuillSelection(page, 1, 1);
  await pasteContent(page, clipData);
  await assertRichTexts(page, ['abtext', 'h1c']);
  await assertSelection(page, 1, 2, 0);
  await undoByClick(page);
  await assertRichTexts(page, ['\n']);

  await page.keyboard.type('aa');
  await pressEnter(page);
  await page.keyboard.type('bb');
  const topLeft123 = await page.evaluate(() => {
    const paragraph = document.querySelector('[data-block-id="2"] p');
    const bbox = paragraph?.getBoundingClientRect() as DOMRect;
    return { x: bbox.left, y: bbox.top - 2 };
  });
  const bottomRight789 = await page.evaluate(() => {
    const paragraph = document.querySelector('[data-block-id="4"] p');
    const bbox = paragraph?.getBoundingClientRect() as DOMRect;
    return { x: bbox.right, y: bbox.bottom };
  });
  await dragBetweenCoords(page, topLeft123, bottomRight789);
  await pasteContent(page, clipData);
  await assertRichTexts(page, ['aa', 'bb', 'text', 'h1']);
});

test('import markdown', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyState(page);
  await focusRichText(page);
  await resetHistory(page);

  const clipData = `# text
# h1
`;
  await setQuillSelection(page, 1, 1);
  await importMarkdown(page, clipData, '0');
  await assertRichTexts(page, ['text', 'h1', '\n']);
  await undoByClick(page);
  await assertRichTexts(page, ['\n']);
});

test('copy clipItems format', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyState(page);
  await focusRichText(page);
  await page.evaluate(() => {
    // @ts-ignore
    window.store.space.captureSync();
  });

  const clipData = `
- aa
  - bb
    - cc
      - dd
`;

  await importMarkdown(page, clipData, '0');
  await setSelection(page, 4, 1, 5, 1);
  await assertClipItems(page, 'text/plain', 'bc');
  await assertClipItems(
    page,
    'text/html',
    '<ul><li>b<ul><li>c</li></ul></li></ul>'
  );
  await undoByClick(page);
  await assertRichTexts(page, ['\n']);
});
