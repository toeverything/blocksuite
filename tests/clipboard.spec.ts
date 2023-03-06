import './utils/declare-test-window.js';

import {
  captureHistory,
  copyByKeyboard,
  dragBetweenCoords,
  enterPlaygroundRoom,
  focusRichText,
  importMarkdown,
  initEmptyParagraphState,
  pasteByKeyboard,
  pasteContent,
  pressBackspace,
  pressEnter,
  pressShiftTab,
  pressSpace,
  pressTab,
  resetHistory,
  selectAllByKeyboard,
  setQuillSelection,
  setSelection,
  SHORT_KEY,
  type,
  undoByClick,
} from './utils/actions/index.js';
import {
  assertBlockTypes,
  assertClipItems,
  assertRichTexts,
  assertSelection,
  assertStoreMatchJSX,
  assertText,
  assertTextFormats,
} from './utils/asserts.js';
import { test } from './utils/playwright.js';

test('clipboard copy paste', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  await type(page, 'test');
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
      Object.defineProperty(e, 'target', {
        writable: false,
        value: document.body,
      });
      e.clipboardData?.setData('text/html', clipData['text/html']);
      document.body.dispatchEvent(e);
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
    'text/plain': `# h1

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
  await type(page, 'abc');
  await captureHistory(page);

  await setQuillSelection(page, 1, 1);
  await page.waitForTimeout(100);
  await pasteContent(page, clipData);

  await assertRichTexts(page, ['atext', 'h1c']);
  await assertSelection(page, 1, 2, 0);

  // FIXME: one redundant step in clipboard operation
  await undoByClick(page);
  await undoByClick(page);
  await assertRichTexts(page, ['abc']);

  await type(page, 'aa');
  await pressEnter(page);
  await type(page, 'bb');
  const topLeft123 = await page.evaluate(() => {
    const paragraph = document.querySelector('[data-block-id="2"] p');
    const bbox = paragraph?.getBoundingClientRect() as DOMRect;
    return { x: bbox.left + 2, y: bbox.top + 2 };
  });
  const bottomRight789 = await page.evaluate(() => {
    const paragraph = document.querySelector('[data-block-id="5"] p');
    const bbox = paragraph?.getBoundingClientRect() as DOMRect;
    return { x: bbox.right - 2, y: bbox.bottom - 2 };
  });
  await dragBetweenCoords(page, topLeft123, bottomRight789);

  // FIXME see https://github.com/toeverything/blocksuite/pull/878
  // await pasteContent(page, clipData);
  // await assertRichTexts(page, ['aaa', 'bbc', 'text', 'h1']);
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
  await captureHistory(page);

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

test('copy partially selected text', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  await type(page, '123 456 789');

  // select 456
  await setQuillSelection(page, 4, 3);
  await copyByKeyboard(page);
  await assertClipItems(page, 'text/plain', '456');

  // move to line end
  await setQuillSelection(page, 11, 0);
  await pressEnter(page);
  await pasteByKeyboard(page);
  await assertRichTexts(page, ['123 456 789', '456']);
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
    document.body.appendChild(input);
  });
  await page.focus('#input-test');
  await page.dblclick('#input-test');
  await copyByKeyboard(page);
  await focusRichText(page);
  await pasteByKeyboard(page);
  await assertRichTexts(page, ['123']);
});

test('should keep first line format when pasted into a new line', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, '-');
  await pressSpace(page);
  await type(page, '1');
  await pressEnter(page);
  await pressTab(page);
  await type(page, '2');
  await pressEnter(page);
  await type(page, '3');
  await pressEnter(page);
  await pressShiftTab(page);
  await type(page, '4');

  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:page>
  <affine:frame>
    <affine:list
      prop:checked={false}
      prop:text="1"
      prop:type="bulleted"
    >
      <affine:list
        prop:checked={false}
        prop:text="2"
        prop:type="bulleted"
      />
      <affine:list
        prop:checked={false}
        prop:text="3"
        prop:type="bulleted"
      />
    </affine:list>
    <affine:list
      prop:checked={false}
      prop:text="4"
      prop:type="bulleted"
    />
  </affine:frame>
</affine:page>`
  );

  await setSelection(page, 5, 1, 3, 0);
  await copyByKeyboard(page);

  await focusRichText(page, 3);
  await pressEnter(page);
  await pressBackspace(page);
  await pasteByKeyboard(page);

  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:page>
  <affine:frame>
    <affine:list
      prop:checked={false}
      prop:text="1"
      prop:type="bulleted"
    >
      <affine:list
        prop:checked={false}
        prop:text="2"
        prop:type="bulleted"
      />
      <affine:list
        prop:checked={false}
        prop:text="3"
        prop:type="bulleted"
      />
    </affine:list>
    <affine:list
      prop:checked={false}
      prop:text="4"
      prop:type="bulleted"
    />
    <affine:list
      prop:checked={false}
      prop:text="1"
      prop:type="bulleted"
    >
      <affine:list
        prop:checked={false}
        prop:text="2"
        prop:type="bulleted"
      />
      <affine:list
        prop:checked={false}
        prop:text="3"
        prop:type="bulleted"
      />
    </affine:list>
  </affine:frame>
</affine:page>`
  );
});

test('cut should work for multi-block selection', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  await type(page, 'a');
  await pressEnter(page);
  await type(page, 'b');
  await pressEnter(page);
  await type(page, 'c');
  await selectAllByKeyboard(page);
  await selectAllByKeyboard(page);
  await page.keyboard.press(`${SHORT_KEY}+x`);
  await assertText(page, '\n');
  await page.keyboard.press(`${SHORT_KEY}+v`);
  await assertRichTexts(page, ['a', 'b', 'c']);
});

test('paste in block-level selection', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  await type(page, 'foo');
  await pressEnter(page);
  await type(page, 'bar');
  await pressEnter(page);
  await type(page, 'hehe');
  await pressEnter(page);
  await setSelection(page, 3, 0, 3, 0);
  await copyByKeyboard(page);
  await selectAllByKeyboard(page);
  await page.keyboard.press(`${SHORT_KEY}+v`);
  await assertText(page, 'bar');
});
