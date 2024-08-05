import { expect } from '@playwright/test';

import {
  SHORT_KEY,
  captureHistory,
  copyByKeyboard,
  dragBetweenCoords,
  dragOverTitle,
  enterPlaygroundRoom,
  focusRichText,
  focusTitle,
  getClipboardHTML,
  getClipboardSnapshot,
  getClipboardText,
  getCurrentEditorDocId,
  getEditorLocator,
  initEmptyParagraphState,
  mockQuickSearch,
  pasteByKeyboard,
  pasteContent,
  pressEnter,
  pressShiftTab,
  pressTab,
  resetHistory,
  setInlineRangeInSelectedRichText,
  setSelection,
  type,
  undoByClick,
  waitNextFrame,
} from '../utils/actions/index.js';
import {
  assertBlockTypes,
  assertClipItems,
  assertExists,
  assertRichTexts,
  assertStoreMatchJSX,
  assertText,
  assertTitle,
} from '../utils/asserts.js';
import '../utils/declare-test-window.js';
import { scoped, test } from '../utils/playwright.js';

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
