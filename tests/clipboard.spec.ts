import { expect } from '@playwright/test';

import { initDatabaseColumn } from './database/actions.js';
import {
  SHORT_KEY,
  activeNoteInEdgeless,
  captureHistory,
  changeEdgelessNoteBackground,
  copyByKeyboard,
  createShapeElement,
  cutByKeyboard,
  dragBetweenCoords,
  dragOverTitle,
  enterPlaygroundRoom,
  focusRichText,
  focusTitle,
  getAllNoteIds,
  getClipboardHTML,
  getClipboardSnapshot,
  getClipboardText,
  getCurrentEditorDocId,
  getEdgelessSelectedRectModel,
  getEditorLocator,
  getInlineSelectionIndex,
  getInlineSelectionText,
  getPageSnapshot,
  getRichTextBoundingBox,
  initDatabaseDynamicRowWithData,
  initEmptyDatabaseWithParagraphState,
  initEmptyEdgelessState,
  initEmptyParagraphState,
  initThreeParagraphs,
  mockQuickSearch,
  pasteByKeyboard,
  pasteContent,
  pressArrowDown,
  pressArrowLeft,
  pressArrowRight,
  pressArrowUp,
  pressEnter,
  pressEscape,
  pressShiftTab,
  pressSpace,
  pressTab,
  resetHistory,
  selectAllByKeyboard,
  selectNoteInEdgeless,
  setInlineRangeInSelectedRichText,
  setSelection,
  switchEditorMode,
  toViewCoord,
  triggerComponentToolbarAction,
  type,
  undoByClick,
  undoByKeyboard,
  waitEmbedLoaded,
  waitForInlineEditorStateUpdated,
  waitNextFrame,
} from './utils/actions/index.js';
import {
  assertBlockTypes,
  assertClipItems,
  assertEdgelessNoteBackground,
  assertEdgelessSelectedRectModel,
  assertExists,
  assertRichImage,
  assertRichTextModelType,
  assertRichTexts,
  assertStoreMatchJSX,
  assertText,
  assertTextFormats,
  assertTitle,
} from './utils/asserts.js';
import './utils/declare-test-window.js';
import { scoped, test } from './utils/playwright.js';

test(scoped`clipboard copy paste`, async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  await type(page, 'test');
  await setInlineRangeInSelectedRichText(page, 0, 3);
  await waitNextFrame(page);
  await copyByKeyboard(page);
  await focusRichText(page);
  await page.keyboard.press(`${SHORT_KEY}+v`);
  await assertText(page, 'testtes');
});

test(scoped`clipboard copy paste title`, async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusTitle(page);

  await type(page, 'test');
  await dragOverTitle(page);
  await waitNextFrame(page);
  await copyByKeyboard(page);
  await focusTitle(page);
  await page.keyboard.press(`${SHORT_KEY}+v`);
  await assertTitle(page, 'testtest');
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
        value: document,
      });
      e.clipboardData?.setData('text/html', clipData['text/html']);
      document.dispatchEvent(e);
    },
    { clipData }
  );
  await assertText(page, 'aaabbbcccddd');
});

test(
  scoped`clipboard paste HTML containing Markdown syntax code and image `,
  async ({ page }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/toeverything/blocksuite/issues/2855',
    });
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    await focusRichText(page);

    // set up clipboard data using html
    const clipData = {
      'text/html': `<p>符合 Markdown 格式的 URL 放到笔记中，此时需要的格式如下：</p>
    <pre><code>md [任务管理这件事 - 少数派](https://sspai.com/post/61092)</code></pre>
    <p>（将一段文字包裹在<code >[[]]</code>中）此时需要的格式如下：</p>
    <figure ><img src="https://placehold.co/600x400"></figure>
    <p>上图中，当我们处在 Obsidian 的「预览模式」时，点击这个「双向链接」</p>
    `,
    };
    await page.evaluate(
      ({ clipData }) => {
        const dT = new DataTransfer();
        const e = new ClipboardEvent('paste', { clipboardData: dT });
        Object.defineProperty(e, 'target', {
          writable: false,
          value: document,
        });
        e.clipboardData?.setData('text/html', clipData['text/html']);
        document.dispatchEvent(e);
      },
      { clipData }
    );
    await waitEmbedLoaded(page);
    // await page.waitForTimeout(500);
    await assertRichImage(page, 1);
  }
);

test(
  scoped`clipboard paste end with image, the cursor should be controlled by up/down keys`,
  async ({ page }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/toeverything/blocksuite/issues/3639',
    });
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    await focusRichText(page);

    // set up clipboard data using html
    const clipData = {
      'text/html': `<p>Lorem Ipsum placeholder text.</p>
    <figure ><img src='https://placehold.co/600x400' /></figure>
    `,
    };
    await page.evaluate(
      ({ clipData }) => {
        const dT = new DataTransfer();
        const e = new ClipboardEvent('paste', { clipboardData: dT });
        Object.defineProperty(e, 'target', {
          writable: false,
          value: document,
        });
        e.clipboardData?.setData('text/html', clipData['text/html']);
        document.dispatchEvent(e);
      },
      { clipData }
    );
    const str = 'Lorem Ipsum placeholder text.';
    await waitEmbedLoaded(page);
    await assertRichImage(page, 1);
    await pressEscape(page);
    await pressArrowUp(page, 1);
    await pasteContent(page, clipData);
    await assertRichImage(page, 2);
    await assertText(page, str + str);
    await pressArrowDown(page, 1);
    await pressEscape(page);
    await pasteContent(page, clipData);
    await assertRichImage(page, 3);
    await assertText(page, 'Lorem Ipsum placeholder text.', 1);
  }
);

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

- [ ] todo

- [ ] todo

- [x] todo

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

  await setInlineRangeInSelectedRichText(page, 1, 1);
  await pasteContent(page, clipData);
  await waitNextFrame(page);

  await assertRichTexts(page, ['atext', 'h1c']);

  await undoByClick(page);
  await assertRichTexts(page, ['abc']);

  await type(page, 'aa');
  await pressEnter(page);
  await type(page, 'bb');
  const topLeft123 = await getEditorLocator(page)
    .locator('[data-block-id="2"] .inline-editor')
    .boundingBox();
  const bottomRight789 = await getEditorLocator(page)
    .locator('[data-block-id="4"] .inline-editor')
    .boundingBox();
  assertExists(topLeft123);
  assertExists(bottomRight789);
  await dragBetweenCoords(page, topLeft123, bottomRight789);

  // FIXME see https://github.com/toeverything/blocksuite/pull/878
  // await pasteContent(page, clipData);
  // await assertRichTexts(page, ['aaa', 'bbc', 'text', 'h1']);
});

test(scoped`import markdown`, async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await resetHistory(page);
  const clipData = `# text
# h1
`;
  await pasteContent(page, { 'text/plain': clipData });
  await page.waitForTimeout(100);
  await assertRichTexts(page, ['text', 'h1']);
  await undoByClick(page);
  await assertRichTexts(page, ['']);
});

test(scoped`copy clipItems format`, async ({ page }) => {
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

  await pasteContent(page, { 'text/plain': clipData });
  await page.waitForTimeout(100);
  await setSelection(page, 4, 1, 5, 1);
  assertClipItems(page, 'text/plain', 'bc');
  assertClipItems(page, 'text/html', '<ul><li>b<ul><li>c</li></ul></li></ul>');
  await undoByClick(page);
  await assertRichTexts(page, ['']);
});

test(scoped`copy partially selected text`, async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  await type(page, '123 456 789');

  // select 456
  await setInlineRangeInSelectedRichText(page, 4, 3);
  await copyByKeyboard(page);
  assertClipItems(page, 'text/plain', '456');

  // move to line end
  await setInlineRangeInSelectedRichText(page, 11, 0);
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
    document.body.querySelector('#app')?.append(input);
  });
  await page.focus('#input-test');
  await page.dblclick('#input-test');
  await copyByKeyboard(page);
  await focusRichText(page);
  await pasteByKeyboard(page);
  await waitNextFrame(page);
  await assertRichTexts(page, ['123']);
});

test('should keep first line format when pasted into a new line', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  const clipData = `
- [ ] aaa
`;

  await pasteContent(page, { 'text/plain': clipData });
  await waitNextFrame(page);
  await assertRichTexts(page, ['aaa']);
  await assertBlockTypes(page, ['todo']);
});

test('paste a non-nested list to a non-nested list', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  const clipData = {
    'text/plain': `
- a
`,
  };
  await type(page, '-');
  await pressSpace(page);
  await type(page, '123');
  await page.keyboard.press('Control+ArrowLeft');

  // paste on start
  await waitNextFrame(page);
  await pasteContent(page, clipData);
  await pressArrowLeft(page);
  await assertRichTexts(page, ['a123']);

  // paste in middle
  await pressArrowRight(page, 2);
  await pasteContent(page, clipData);
  await pressArrowRight(page);
  await assertRichTexts(page, ['a1a23']);

  // paste on end
  await pressArrowRight(page);
  await pasteContent(page, clipData);
  await waitNextFrame(page);
  await assertRichTexts(page, ['a1a23a']);

  await assertBlockTypes(page, ['bulleted']);
});

test('copy a nested list by clicking button, the clipboard data should be complete', async ({
  page,
}, testInfo) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  const clipData = {
    'text/plain': `
- aaa
  - bbb
    - ccc
`,
  };
  await pasteContent(page, clipData);

  const rootListBound = await page.locator('affine-list').first().boundingBox();
  assertExists(rootListBound);

  // use drag element to test.
  await dragBetweenCoords(
    page,
    { x: rootListBound.x + 1, y: rootListBound.y - 1 },
    { x: rootListBound.x + 1, y: rootListBound.y + rootListBound.height - 1 }
  );
  await copyByKeyboard(page);

  const text = await getClipboardText(page);
  const html = await getClipboardHTML(page);
  const snapshot = await getClipboardSnapshot(page);
  expect(text).toMatchSnapshot(`${testInfo.title}-clipboard.md`);
  expect(JSON.stringify(snapshot.snapshot.content, null, 2)).toMatchSnapshot(
    `${testInfo.title}-clipboard.json`
  );
  expect(html).toMatchSnapshot(`${testInfo.title}-clipboard.html`);
});

test('paste a nested list to a nested list', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  const clipData = {
    'text/plain': `
- aaa
  - bbb
    - ccc
`,
  };
  await pasteContent(page, clipData);
  await focusRichText(page, 1);

  // paste on start
  await page.keyboard.press('Control+ArrowLeft');

  /**
   * - aaa
   *   - |bbb
   *     - ccc
   */
  await pasteContent(page, clipData);
  /**
   * - aaa
   *   - aaa
   *     - bbb
   *        - ccc|bbb
   *          -ccc
   */

  await assertRichTexts(page, ['aaa', 'aaa', 'bbb', 'cccbbb', 'ccc']);
  expect(await getInlineSelectionText(page)).toEqual('cccbbb');
  expect(await getInlineSelectionIndex(page)).toEqual(3);

  // paste in middle
  await undoByKeyboard(page);
  await pressArrowRight(page);

  /**
   * - aaa
   *   - b|bb
   *     - ccc
   */
  await pasteContent(page, clipData);
  /**
   * - aaa
   *   - baaa
   *     - bbb
   *       - ccc|bb
   *        - ccc
   */

  await assertRichTexts(page, ['aaa', 'baaa', 'bbb', 'cccbb', 'ccc']);
  expect(await getInlineSelectionText(page)).toEqual('cccbb');
  expect(await getInlineSelectionIndex(page)).toEqual(3);

  // paste on end
  await undoByKeyboard(page);
  await page.keyboard.press('Control+ArrowRight');

  /**
   * - aaa
   *   - bbb|
   *     - ccc
   */
  await pasteContent(page, clipData);
  /**
   * - aaa
   *   - bbbaaa
   *     - bbb
   *       - ccc|
   *         - ccc
   */

  await assertRichTexts(page, ['aaa', 'bbbaaa', 'bbb', 'ccc', 'ccc']);
  expect(await getInlineSelectionText(page)).toEqual('ccc');
  expect(await getInlineSelectionIndex(page)).toEqual(3);
});

test('paste nested lists to a nested list', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  const clipData = {
    'text/plain': `
- aaa
  - bbb
    - ccc
`,
  };
  await pasteContent(page, clipData);
  await focusRichText(page, 1);

  const clipData2 = {
    'text/plain': `
- 111
  - 222
- 111
  - 222
`,
  };

  // paste on start
  await page.keyboard.press('Control+ArrowLeft');

  /**
   * - aaa
   *   - |bbb
   *     - ccc
   */
  await pasteContent(page, clipData2);
  /**
   * - aaa
   *   - 111
   *     - 222
   *   - 111
   *     - 222|bbb
   *       - ccc
   */

  await assertRichTexts(page, ['aaa', '111', '222', '111', '222bbb', 'ccc']);
  expect(await getInlineSelectionText(page)).toEqual('222bbb');
  expect(await getInlineSelectionIndex(page)).toEqual(3);

  // paste in middle
  await undoByKeyboard(page);
  await pressArrowRight(page);

  /**
   * - aaa
   *   - b|bb
   *     - ccc
   */
  await pasteContent(page, clipData2);
  /**
   * - aaa
   *   - b111
   *     - 222
   *   - 111
   *     - 222|bb
   *     - ccc
   */

  await assertRichTexts(page, ['aaa', 'b111', '222', '111', '222bb', 'ccc']);
  expect(await getInlineSelectionText(page)).toEqual('222bb');
  expect(await getInlineSelectionIndex(page)).toEqual(3);

  // paste on end
  await undoByKeyboard(page);
  await page.keyboard.press('Control+ArrowRight');

  /**
   * - aaa
   *   - bbb|
   *     - ccc
   */
  await pasteContent(page, clipData2);
  /**
   * - aaa
   *   - bbb111
   *     - 222
   *   - 111
   *     - 222|
   *     - ccc
   */

  await assertRichTexts(page, ['aaa', 'bbb111', '222', '111', '222', 'ccc']);
  expect(await getInlineSelectionText(page)).toEqual('222');
  expect(await getInlineSelectionIndex(page)).toEqual(3);
});

test('paste non-nested lists to a nested list', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  const clipData = {
    'text/plain': `
- aaa
  - bbb
`,
  };
  await pasteContent(page, clipData);
  await focusRichText(page, 0);

  const clipData2 = {
    'text/plain': `
- 123
- 456
`,
  };

  // paste on start
  await page.keyboard.press('Control+ArrowLeft');

  /**
   * - |aaa
   *   - bbb
   */
  await pasteContent(page, clipData2);
  /**
   * - 123
   * - 456|aaa
   *   - bbb
   */

  await assertRichTexts(page, ['123', '456aaa', 'bbb']);
  expect(await getInlineSelectionText(page)).toEqual('456aaa');
  expect(await getInlineSelectionIndex(page)).toEqual(3);
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
  await selectAllByKeyboard(page);
  await cutByKeyboard(page);
  await page.locator('.affine-page-viewport').click();
  await waitNextFrame(page);
  await assertText(page, '');
});

test(
  scoped`pasting into empty list should not convert the list into paragraph`,
  async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    await focusRichText(page);
    await type(page, 'test');
    await setInlineRangeInSelectedRichText(page, 0, 4);
    await copyByKeyboard(page);
    await type(page, '- ');
    await page.keyboard.press(`${SHORT_KEY}+v`);
    await assertRichTexts(page, ['test']);
    await assertRichTextModelType(page, 'bulleted');
  }
);

test('cut will delete all content, and copy will reappear content', async ({
  page,
}, testInfo) => {
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
  expect(await getPageSnapshot(page, true)).toMatchSnapshot(
    `${testInfo.title}_after-cut.json`
  );
  await waitNextFrame(page);
  await focusRichText(page);

  await pasteByKeyboard(page);
  await waitNextFrame(page);
  expect(await getPageSnapshot(page, true)).toMatchSnapshot(
    `${testInfo.title}_after-paste.json`
  );
});

test(scoped`should copy and paste of database work`, async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseWithParagraphState(page);

  // init database columns and rows
  await initDatabaseColumn(page);
  await initDatabaseDynamicRowWithData(page, 'abc', true);
  await pressEscape(page);
  await focusRichText(page, 2);
  await selectAllByKeyboard(page);
  await selectAllByKeyboard(page);
  await copyByKeyboard(page);
  await pressEnter(page);
  await pasteByKeyboard(page);
  await page.waitForTimeout(100);

  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:page>
  <affine:note
    prop:background="--affine-note-background-blue"
    prop:displayMode="both"
    prop:edgeless={
      Object {
        "style": Object {
          "borderRadius": 0,
          "borderSize": 4,
          "borderStyle": "none",
          "shadowType": "--affine-note-shadow-sticker",
        },
      }
    }
    prop:hidden={false}
    prop:index="a0"
  >
    <affine:database
      prop:columns="Array [2]"
      prop:title="Database 1"
      prop:views="Array [1]"
    >
      <affine:paragraph
        prop:type="text"
      />
    </affine:database>
    <affine:database
      prop:columns="Array [2]"
      prop:title="Database 1"
      prop:views="Array [1]"
    >
      <affine:paragraph
        prop:type="text"
      />
    </affine:database>
    <affine:paragraph
      prop:type="text"
    />
  </affine:note>
</affine:page>`
  );

  await undoByKeyboard(page);
  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:page>
  <affine:note
    prop:background="--affine-note-background-blue"
    prop:displayMode="both"
    prop:edgeless={
      Object {
        "style": Object {
          "borderRadius": 0,
          "borderSize": 4,
          "borderStyle": "none",
          "shadowType": "--affine-note-shadow-sticker",
        },
      }
    }
    prop:hidden={false}
    prop:index="a0"
  >
    <affine:database
      prop:columns="Array [2]"
      prop:title="Database 1"
      prop:views="Array [1]"
    >
      <affine:paragraph
        prop:type="text"
      />
    </affine:database>
    <affine:paragraph
      prop:type="text"
    />
  </affine:note>
</affine:page>`
  );
});

test(`copy canvas element and text note in edgeless mode`, async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);
  await initThreeParagraphs(page);
  await createShapeElement(page, [0, 0], [100, 100]);
  await selectAllByKeyboard(page);
  const bound = await getEdgelessSelectedRectModel(page);
  await copyByKeyboard(page);
  const coord = await toViewCoord(page, [
    bound[0] + bound[2] / 2,
    bound[1] + bound[3] / 2 + 200,
  ]);
  await page.mouse.move(coord[0], coord[1]);
  await page.waitForTimeout(300);
  await pasteByKeyboard(page, false);
  bound[1] = bound[1] + 200;
  await assertEdgelessSelectedRectModel(page, bound);
});

test(scoped`copy when text note active in edgeless`, async ({ page }) => {
  await enterPlaygroundRoom(page);
  const ids = await initEmptyEdgelessState(page);
  await focusRichText(page);
  await type(page, '1234');

  await switchEditorMode(page);

  await activeNoteInEdgeless(page, ids.noteId);
  await waitForInlineEditorStateUpdated(page);
  await setInlineRangeInSelectedRichText(page, 0, 4);
  await copyByKeyboard(page);
  await pressArrowRight(page);
  await type(page, '555');
  await pasteByKeyboard(page, false);
  await assertText(page, '12345551234');
});

test(scoped`paste note block with background`, async ({ page }) => {
  await enterPlaygroundRoom(page);
  const ids = await initEmptyEdgelessState(page);
  await focusRichText(page);
  await type(page, '1234');

  await switchEditorMode(page);
  await selectNoteInEdgeless(page, ids.noteId);

  await triggerComponentToolbarAction(page, 'changeNoteColor');
  const color = '--affine-note-background-grey';
  await changeEdgelessNoteBackground(page, color);
  await assertEdgelessNoteBackground(page, ids.noteId, color);

  await copyByKeyboard(page);

  await page.mouse.move(0, 0);
  await pasteByKeyboard(page, false);
  const noteIds = await getAllNoteIds(page);
  for (const noteId of noteIds) {
    await assertEdgelessNoteBackground(page, noteId, color);
  }
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
  await pressArrowRight(page);
  await pasteByKeyboard(page, false);
  await waitNextFrame(page);
  await assertRichTexts(page, ['12341234']);
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
      document.body.querySelector('#app')?.append(input);
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
  <affine:note
    prop:background="--affine-note-background-blue"
    prop:displayMode="both"
    prop:edgeless={
      Object {
        "style": Object {
          "borderRadius": 0,
          "borderSize": 4,
          "borderStyle": "none",
          "shadowType": "--affine-note-shadow-sticker",
        },
      }
    }
    prop:hidden={false}
    prop:index="a0"
  >
    <affine:paragraph
      prop:text="123"
      prop:type="quote"
    />
  </affine:note>
</affine:page>`
    );

    await pressEnter(page);
    await waitNextFrame(page);
    await pressEnter(page);
    await waitNextFrame(page);
    await pasteByKeyboard(page, false);
    await waitNextFrame(page);

    await assertStoreMatchJSX(
      page,
      /*xml*/ `
<affine:page>
  <affine:note
    prop:background="--affine-note-background-blue"
    prop:displayMode="both"
    prop:edgeless={
      Object {
        "style": Object {
          "borderRadius": 0,
          "borderSize": 4,
          "borderStyle": "none",
          "shadowType": "--affine-note-shadow-sticker",
        },
      }
    }
    prop:hidden={false}
    prop:index="a0"
  >
    <affine:paragraph
      prop:text="123"
      prop:type="quote"
    />
    <affine:paragraph
      prop:text="123"
      prop:type="text"
    />
  </affine:note>
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
        value: document,
      });
      e.clipboardData?.setData('text/html', clipData['text/html']);
      document.dispatchEvent(e);
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
        value: document,
      });
      e.clipboardData?.setData('text/html', clipData['text/html']);
      document.dispatchEvent(e);
    },
    { clipData }
  );
  await assertRichTexts(page, ['test111', '222']);
});

test(scoped`auto identify url`, async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  // set up clipboard data using html
  const clipData = {
    'text/plain': `test https://www.google.com`,
  };
  await waitNextFrame(page);
  await page.evaluate(
    ({ clipData }) => {
      const dT = new DataTransfer();
      const e = new ClipboardEvent('paste', { clipboardData: dT });
      Object.defineProperty(e, 'target', {
        writable: false,
        value: document,
      });
      e.clipboardData?.setData('text/plain', clipData['text/plain']);
      document.dispatchEvent(e);
    },
    { clipData }
  );
  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:page>
  <affine:note
    prop:background="--affine-note-background-blue"
    prop:displayMode="both"
    prop:edgeless={
      Object {
        "style": Object {
          "borderRadius": 0,
          "borderSize": 4,
          "borderStyle": "none",
          "shadowType": "--affine-note-shadow-sticker",
        },
      }
    }
    prop:hidden={false}
    prop:index="a0"
  >
    <affine:paragraph
      prop:text={
        <>
          <text
            insert="test "
          />
          <text
            insert="https://www.google.com"
            link="https://www.google.com"
          />
        </>
      }
      prop:type="text"
    />
  </affine:note>
</affine:page>`
  );
});

test(scoped`pasting internal url`, async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusTitle(page);
  await type(page, 'test page');

  await focusRichText(page);
  const docId = await getCurrentEditorDocId(page);
  await mockQuickSearch(page, {
    'http://workspace/doc-id': docId,
  });
  await pasteContent(page, {
    'text/plain': 'http://workspace/doc-id',
  });
  await expect(page.locator('affine-reference')).toContainText('test page');
});

test(scoped`paste parent block`, async ({ page }) => {
  test.info().annotations.push({
    type: 'issue',
    description: 'https://github.com/toeverything/blocksuite/issues/3153',
  });
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'This is parent');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await type(page, 'This is child 1');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await type(page, 'This is child 2');
  await setInlineRangeInSelectedRichText(page, 0, 3);
  await copyByKeyboard(page);
  await focusRichText(page, 2);
  await page.keyboard.press(`${SHORT_KEY}+v`);
  await assertRichTexts(page, [
    'This is parent',
    'This is child 1',
    'This is child 2Thi',
  ]);
});

test(scoped`clipboard copy multi selection`, async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  await type(page, 'abc');
  await pressEnter(page);
  await type(page, 'def');
  await setSelection(page, 2, 1, 3, 1);
  await waitNextFrame(page);
  await copyByKeyboard(page);
  await waitNextFrame(page);
  await focusRichText(page, 1);
  await pasteByKeyboard(page);
  await waitNextFrame(page);
  await type(page, 'cursor');
  await waitNextFrame(page);
  await assertRichTexts(page, ['abc', 'defbc', 'dcursor']);
});

test(scoped`clipboard copy nested items`, async ({ page }, testInfo) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  await type(page, 'abc');
  await pressEnter(page);
  await pressTab(page);
  await type(page, 'def');
  await pressEnter(page);
  await pressTab(page);
  await type(page, 'ghi');
  await pressEnter(page);
  await pressShiftTab(page);
  await pressShiftTab(page);
  await type(page, 'jkl');
  await setSelection(page, 2, 1, 3, 1);
  await waitNextFrame(page);
  await copyByKeyboard(page);

  const text = await getClipboardText(page);
  const html = await getClipboardHTML(page);
  const snapshot = await getClipboardSnapshot(page);
  expect(text).toMatchSnapshot(`${testInfo.title}-clipboard.md`);
  expect(JSON.stringify(snapshot.snapshot.content, null, 2)).toMatchSnapshot(
    `${testInfo.title}-clipboard.json`
  );
  expect(html).toMatchSnapshot(`${testInfo.title}-clipboard.html`);

  await setSelection(page, 4, 1, 5, 1);
  await waitNextFrame(page);
  await copyByKeyboard(page);

  const text2 = await getClipboardText(page);
  const html2 = await getClipboardHTML(page);
  const snapshot2 = await getClipboardSnapshot(page);
  expect(text2).toMatchSnapshot(`${testInfo.title}-clipboard2.md`);
  expect(JSON.stringify(snapshot2.snapshot.content, null, 2)).toMatchSnapshot(
    `${testInfo.title}-clipboard2.json`
  );
  expect(html2).toMatchSnapshot(`${testInfo.title}-clipboard2.html`);
});
