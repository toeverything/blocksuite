import './utils/declare-test-window.js';
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
  initEmptyParagraphState,
  resetHistory,
  copyByKeyboard,
  pasteByKeyboard,
  SHORT_KEY,
} from './utils/actions/index.js';
import {
  assertBlockTypes,
  assertClipItems,
  assertRichTexts,
  assertSelection,
  assertText,
  assertTextFormats,
} from './utils/asserts.js';

test('clipboard copy paste', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  await page.keyboard.type('test');
  await setQuillSelection(page, 0, 3);
  await copyByKeyboard(page);
  await focusRichText(page);
  await page.keyboard.press(`${SHORT_KEY}+v`);
  await assertText(page, 'testtes');
});

test('clipboard paste html', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  // set up clipboard data using html
  const clipData = {
    'text/html': `<span>aaa</span><span>bbb</span><span>ccc</span>`,
  };
  await page.evaluate(
    ({ clipData }) => {
      const dT = new DataTransfer();
      const e = new ClipboardEvent('paste', { clipboardData: dT });
      e.clipboardData?.setData('text/html', clipData['text/html']);
      document
        .getElementsByTagName('editor-container')[0]
        .clipboard['_clipboardEventDispatcher']['_pasteHandler'](e);
    },
    { clipData }
  );
  await assertText(page, 'aaabbbccc');
});

test('markdown format parse', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
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

test('split block when paste', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
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
  await initEmptyParagraphState(page);
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
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await page.evaluate(() => {
    window.page.captureSync();
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

test('copy more than one delta op on a block', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await resetHistory(page);

  const clipData = 'You `talking` to me?';

  await importMarkdown(page, clipData, '0');
  await setSelection(page, 3, 0, 3, 1);
  await setQuillSelection(page, 0, 14);
  await assertClipItems(page, 'text/plain', 'You talking to');
  await assertClipItems(
    page,
    'blocksuite/x-c+w',
    JSON.stringify({
      data: [
        {
          flavour: 'affine:paragraph',
          type: 'text',
          text: [
            {
              insert: 'You ',
            },
            {
              insert: 'talking',
              attributes: {
                code: true,
              },
            },
            {
              insert: ' to',
            },
          ],
          children: [],
        },
      ],
    })
  );
  await assertClipItems(
    page,
    'text/html',
    '<p>You <code>talking</code> to</p>'
  );
});

test('copy & paste outside editor', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await page.evaluate(() => {
    const input = document.createElement('input');
    input.setAttribute('id', 'input-test');
    input.value = '123';
    document.querySelector('.debug-menu')?.appendChild(input);
  });
  await page.focus('#input-test');
  await page.dblclick('#input-test');
  await copyByKeyboard(page);
  await focusRichText(page);
  await pasteByKeyboard(page);
  await assertRichTexts(page, ['123']);
});
