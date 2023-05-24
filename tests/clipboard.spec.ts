import './utils/declare-test-window.js';

import { EDITOR_WIDTH } from '@blocksuite/global/config';

import {
  activeFrameInEdgeless,
  addBasicRectShapeElement,
  captureHistory,
  copyByKeyboard,
  cutByKeyboard,
  dragBetweenCoords,
  enterPlaygroundRoom,
  focusRichText,
  getRichTextBoundingBox,
  importMarkdown,
  initDatabaseColumn,
  initDatabaseDynamicRowWithData,
  initEmptyDatabaseWithParagraphState,
  initEmptyEdgelessState,
  initEmptyParagraphState,
  initThreeParagraphs,
  pasteByKeyboard,
  pasteContent,
  pressBackspace,
  pressEnter,
  pressShiftTab,
  pressSpace,
  pressTab,
  resetHistory,
  selectAllByKeyboard,
  setSelection,
  setVirgoSelection,
  SHORT_KEY,
  switchEditorMode,
  type,
  undoByClick,
  waitForVirgoStateUpdated,
  waitNextFrame,
} from './utils/actions/index.js';
import {
  assertBlockTypes,
  assertClipItems,
  assertEdgelessSelectedRect,
  assertRichTexts,
  assertSelection,
  assertStoreMatchJSX,
  assertText,
  assertTextFormats,
  assertTypeFormat,
} from './utils/asserts.js';
import { scoped, test } from './utils/playwright.js';

test(scoped`clipboard copy paste`, async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  await type(page, 'test');
  await setVirgoSelection(page, 0, 3);
  await copyByKeyboard(page);
  await focusRichText(page);
  await page.keyboard.press(`${SHORT_KEY}+v`);
  await assertText(page, 'testtes');
});

test(scoped`clipboard paste html`, async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  // set up clipboard data using html
  const clipData = {
    'text/html': `<span>aaa</span><span>bbb</span><span>ccc</span><bdi>ddd</bdi>`,
  };
  await waitNextFrame(page);
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
  await assertText(page, 'aaabbbcccddd');
});

test(scoped`markdown format parse`, async ({ page }) => {
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
  await waitNextFrame(page);
  await pasteContent(page, clipData);
  await waitNextFrame(page);
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
  await assertRichTexts(page, ['']);
  await focusRichText(page);

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
  await waitNextFrame(page);
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
  await assertRichTexts(page, ['']);
});

test(scoped`split block when paste`, async ({ page }) => {
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

  await setVirgoSelection(page, 1, 1);
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
    const paragraph = document.querySelector(
      '[data-block-id="2"] .virgo-editor'
    );
    const bbox = paragraph?.getBoundingClientRect() as DOMRect;
    return { x: bbox.left + 2, y: bbox.top + 2 };
  });
  const bottomRight789 = await page.evaluate(() => {
    const paragraph = document.querySelector(
      '[data-block-id="5"] .virgo-editor'
    );
    const bbox = paragraph?.getBoundingClientRect() as DOMRect;
    return { x: bbox.right - 2, y: bbox.bottom - 2 };
  });
  await dragBetweenCoords(page, topLeft123, bottomRight789);

  // FIXME see https://github.com/toeverything/blocksuite/pull/878
  // await pasteContent(page, clipData);
  // await assertRichTexts(page, ['aaa', 'bbc', 'text', 'h1']);
});

test(scoped`import markdown`, async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { frameId } = await initEmptyParagraphState(page);
  await focusRichText(page);
  await resetHistory(page);
  const clipData = `# text
# h1
`;
  await setVirgoSelection(page, 1, 1);
  await importMarkdown(page, frameId, clipData);
  await page.waitForTimeout(100);
  await assertRichTexts(page, ['text', 'h1', '']);
  await undoByClick(page);
  await assertRichTexts(page, ['']);
});
// FIXME
test(scoped`copy clipItems format`, async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { frameId } = await initEmptyParagraphState(page);
  await focusRichText(page);
  await captureHistory(page);

  const clipData = `
- aa
  - bb
    - cc
      - dd
`;

  await importMarkdown(page, frameId, clipData);
  await page.waitForTimeout(100);
  await setSelection(page, 4, 1, 5, 1);
  await assertClipItems(page, 'text/plain', 'bc');
  await assertClipItems(
    page,
    'text/html',
    '<ul><li>b<ul><li>c</li></ul></li></ul>'
  );
  await undoByClick(page);
  await assertRichTexts(page, ['']);
});
// FIXME
test(scoped`copy partially selected text`, async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  await type(page, '123 456 789');

  // select 456
  await setVirgoSelection(page, 4, 3);
  await copyByKeyboard(page);
  await assertClipItems(page, 'text/plain', '456');

  // move to line end
  await setVirgoSelection(page, 11, 0);
  await pressEnter(page);
  await pasteByKeyboard(page);
  await waitNextFrame(page);

  await assertRichTexts(page, ['123 456 789', '456']);
});

test(scoped`copy & paste outside editor`, async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await page.evaluate(() => {
    const input = document.createElement('input');
    input.setAttribute('id', 'input-test');
    input.value = '123';
    document.body.querySelector('#app')?.appendChild(input);
  });
  await page.focus('#input-test');
  await page.dblclick('#input-test');
  await copyByKeyboard(page);
  await focusRichText(page);
  await pasteByKeyboard(page);
  await waitNextFrame(page);
  await assertRichTexts(page, ['123']);
});

// FIXME: this test case can pass in local but not online
test.skip('should keep first line format when pasted into a new line', async ({
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
  <affine:frame
    prop:background="--affine-background-secondary-color"
    prop:index="a0"
  >
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

  await setSelection(page, 3, 0, 5, 1);
  await waitNextFrame(page);
  await copyByKeyboard(page);

  await focusRichText(page, 3);
  await pressEnter(page);
  await pressBackspace(page);
  await pasteByKeyboard(page);
  await waitNextFrame(page);
  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:page>
  <affine:frame
    prop:background="--affine-background-secondary-color"
    prop:index="a0"
  >
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

test(scoped`cut should work for multi-block selection`, async ({ page }) => {
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
  await assertText(page, '');
  await page.keyboard.press(`${SHORT_KEY}+v`);
  await waitNextFrame(page);
  await assertRichTexts(page, ['a', 'b', 'c']);
});

test(
  scoped`pasting into empty list should not convert the list into paragraph`,
  async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    await focusRichText(page);
    await type(page, 'test');
    await setVirgoSelection(page, 0, 4);
    await copyByKeyboard(page);
    await type(page, '- ');
    await page.keyboard.press(`${SHORT_KEY}+v`);
    await assertRichTexts(page, ['test']);
    await assertTypeFormat(page, 'bulleted');
  }
);

test.skip('cut will delete all content, and copy will reappear content', async ({
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

  const box123 = await getRichTextBoundingBox(page, '1');
  const inside123 = { x: box123.left + 1, y: box123.top + 1 };

  const box789 = await getRichTextBoundingBox(page, '6');
  const inside789 = { x: box789.right - 1, y: box789.bottom - 1 };
  // from top to bottom
  await dragBetweenCoords(page, inside123, inside789);

  await cutByKeyboard(page);
  await waitNextFrame(page);
  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:page>
  <affine:frame
    prop:background="--affine-background-secondary-color"
    prop:index="a0"
  >
    <affine:list
      prop:checked={false}
      prop:type="bulleted"
    />
  </affine:frame>
</affine:page>`
  );
  await waitNextFrame(page);
  await focusRichText(page);

  await pasteByKeyboard(page);
  await waitNextFrame(page);
  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:page>
  <affine:frame
    prop:background="--affine-background-secondary-color"
    prop:index="a0"
  >
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
});

test(scoped`should copy and paste of database work`, async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseWithParagraphState(page);

  // init database columns and rows
  await initDatabaseColumn(page);
  await initDatabaseDynamicRowWithData(page, 'abc', true);

  await selectAllByKeyboard(page);
  await waitNextFrame(page);
  await selectAllByKeyboard(page);
  await copyByKeyboard(page);
  await waitNextFrame(page);

  await focusRichText(page, 1);
  await pasteByKeyboard(page);
  await waitNextFrame(page);

  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:page>
  <affine:frame
    prop:background="--affine-background-secondary-color"
    prop:index="a0"
  >
    <affine:database
      prop:columns="Array [1]"
      prop:mode="table"
      prop:title="Database 1"
      prop:titleColumnName="Title"
      prop:titleColumnWidth={432}
    >
      <affine:paragraph
        prop:type="text"
      />
    </affine:database>
    <affine:database
      prop:columns="Array [1]"
      prop:mode="table"
      prop:title="Database 1"
      prop:titleColumnName="Title"
      prop:titleColumnWidth={432}
    >
      <affine:paragraph
        prop:type="text"
      />
    </affine:database>
    <affine:paragraph
      prop:type="text"
    />
  </affine:frame>
</affine:page>`
  );

  await undoByClick(page);
  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:page>
  <affine:frame
    prop:background="--affine-background-secondary-color"
    prop:index="a0"
  >
    <affine:database
      prop:columns="Array [1]"
      prop:mode="table"
      prop:title="Database 1"
      prop:titleColumnName="Title"
      prop:titleColumnWidth={432}
    >
      <affine:paragraph
        prop:type="text"
      />
    </affine:database>
    <affine:paragraph
      prop:type="text"
    />
  </affine:frame>
</affine:page>`
  );
});

test(
  scoped`copy phasor element and text frame in edgeless mode`,
  async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyEdgelessState(page);
    await initThreeParagraphs(page);

    await switchEditorMode(page);

    await addBasicRectShapeElement(
      page,
      {
        x: 100,
        y: 100,
      },
      {
        x: 200,
        y: 200,
      }
    );

    await dragBetweenCoords(
      page,
      { x: 50, y: 90 },
      { x: 400, y: 400 },
      { steps: 10 }
    );
    await assertEdgelessSelectedRect(page, [90, 100, EDITOR_WIDTH, 272]);

    await copyByKeyboard(page);

    await page.mouse.move(400, 400);

    await pasteByKeyboard(page, false);

    await assertEdgelessSelectedRect(page, [40, 264, EDITOR_WIDTH, 272]);
  }
);

test(scoped`copy when text frame active in edgeless`, async ({ page }) => {
  await enterPlaygroundRoom(page);
  const ids = await initEmptyEdgelessState(page);
  await focusRichText(page);
  await type(page, '1234');

  await switchEditorMode(page);

  await activeFrameInEdgeless(page, ids.frameId);
  await waitForVirgoStateUpdated(page);
  await setVirgoSelection(page, 0, 4);
  await copyByKeyboard(page);
  await type(page, '555');
  await pasteByKeyboard(page, false);
  await assertText(page, '5551234');
});

test(scoped`copy and paste to selection block selection`, async ({ page }) => {
  test.info().annotations.push({
    type: 'issue',
    description: 'https://github.com/toeverything/blocksuite/issues/2265',
  });
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, '1234');

  await selectAllByKeyboard(page);
  await copyByKeyboard(page);
  await pasteByKeyboard(page, false);
  await assertRichTexts(page, ['1234', '']);
});

test(
  scoped`should keep paragraph block's type when pasting at the start of empty paragraph block except type text`,
  async ({ page }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/toeverything/blocksuite/issues/2336',
    });
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    await focusRichText(page);
    await focusRichText(page);
    await type(page, '>');
    await page.keyboard.press('Space', { delay: 50 });

    await page.evaluate(() => {
      const input = document.createElement('input');
      input.setAttribute('id', 'input-test');
      input.value = '123';
      document.body.querySelector('#app')?.appendChild(input);
    });
    await page.focus('#input-test');
    await page.dblclick('#input-test');
    await copyByKeyboard(page);
    await focusRichText(page);
    await pasteByKeyboard(page);
    await waitNextFrame(page);
    await assertStoreMatchJSX(
      page,
      /*xml*/ `
<affine:page>
  <affine:frame
    prop:background="--affine-background-secondary-color"
    prop:index="a0"
  >
    <affine:paragraph
      prop:text="123"
      prop:type="quote"
    />
  </affine:frame>
</affine:page>`
    );

    // when pasting a quote into a text paragraph block, the paragraph type should be text
    await selectAllByKeyboard(page);
    await copyByKeyboard(page);
    await waitNextFrame(page);

    await pressEnter(page);
    await pasteByKeyboard(page);
    await waitNextFrame(page);

    await assertStoreMatchJSX(
      page,
      /*xml*/ `
<affine:page>
  <affine:frame
    prop:background="--affine-background-secondary-color"
    prop:index="a0"
  >
    <affine:paragraph
      prop:text="123"
      prop:type="quote"
    />
    <affine:paragraph
      prop:text="123"
      prop:type="quote"
    />
  </affine:frame>
</affine:page>`
    );
  }
);

test(scoped`paste from FeiShu list format`, async ({ page }) => {
  test.info().annotations.push({
    type: 'issue',
    description: 'https://github.com/toeverything/blocksuite/issues/2438',
  });
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  // set up clipboard data using html
  const clipData = {
    'text/html': `<div><li><div><span>aaaa</span></div></li></div>`,
  };
  await waitNextFrame(page);
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
  await assertText(page, 'aaaa');
  await assertBlockTypes(page, ['bulleted']);
});

test(scoped`paste in list format`, async ({ page }) => {
  test.info().annotations.push({
    type: 'issue',
    description: 'https://github.com/toeverything/blocksuite/issues/2281',
  });
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  await type(page, '- test');
  await focusRichText(page);

  const clipData = {
    'text/html': `<ul><li>111<ul><li>222</li></ul></li></ul>`,
  };
  await waitNextFrame(page);
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
  await assertRichTexts(page, ['test111', '222']);
});
