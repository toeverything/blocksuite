import { expect } from '@playwright/test';

import {
  cutByKeyboard,
  dragBetweenIndices,
  dragOverTitle,
  enterPlaygroundRoom,
  focusRichText,
  focusTitle,
  initEmptyCodeBlockState,
  initEmptyParagraphState,
  initThreeParagraphs,
  inlineCode,
  MODIFIER_KEY,
  pasteByKeyboard,
  pressArrowDown,
  pressArrowLeft,
  pressArrowRight,
  pressArrowUp,
  pressEnter,
  pressForwardDelete,
  pressShiftEnter,
  pressShiftTab,
  pressTab,
  readClipboardText,
  redoByClick,
  redoByKeyboard,
  resetHistory,
  setInlineRangeInSelectedRichText,
  SHIFT_KEY,
  SHORT_KEY,
  strikethrough,
  type,
  undoByClick,
  undoByKeyboard,
  updateBlockType,
  waitNextFrame,
} from './utils/actions/index.js';
import {
  assertBlockChildrenIds,
  assertBlockSelections,
  assertRichTextInlineRange,
  assertRichTextModelType,
  assertRichTexts,
  assertStoreMatchJSX,
  assertTextFormat,
  assertTitle,
} from './utils/asserts.js';
import { test } from './utils/playwright.js';

test('rich-text hotkey scope on single press', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'hello');
  await pressEnter(page);
  await type(page, 'world');
  await assertRichTexts(page, ['hello', 'world']);

  await dragBetweenIndices(page, [0, 0], [1, 5]);
  await page.keyboard.press('Backspace');
  await assertRichTexts(page, ['']);
});

test('single line rich-text inline code hotkey', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'hello');
  await dragBetweenIndices(page, [0, 0], [0, 5]);
  await inlineCode(page);
  await assertTextFormat(page, 0, 0, { code: true });

  // undo
  await undoByKeyboard(page);
  await assertTextFormat(page, 0, 0, {});
  // redo
  await redoByKeyboard(page);
  await waitNextFrame(page);
  await assertTextFormat(page, 0, 0, { code: true });

  // the format should be removed after trigger the hotkey again
  await inlineCode(page);
  await assertTextFormat(page, 0, 0, {});
});

test('type character jump out code node', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { paragraphId } = await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'Hello');
  await setInlineRangeInSelectedRichText(page, 0, 5);
  await inlineCode(page);
  await assertStoreMatchJSX(
    page,
    `
<affine:paragraph
  prop:text={
    <>
      <text
        code={true}
        insert="Hello"
      />
    </>
  }
  prop:type="text"
/>`,
    paragraphId
  );
  await focusRichText(page);
  await page.keyboard.press(`${SHORT_KEY}+ArrowRight`);
  await type(page, 'block suite');
  await assertStoreMatchJSX(
    page,
    `
<affine:paragraph
  prop:text={
    <>
      <text
        code={true}
        insert="Hello"
      />
      <text
        insert="block suite"
      />
    </>
  }
  prop:type="text"
/>`,
    paragraphId
  );
});

test('multi line rich-text inline code hotkey', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  // 0    1   2
  // 1|23 456 78|9
  await dragBetweenIndices(page, [0, 1], [2, 2]);
  await inlineCode(page);

  await assertStoreMatchJSX(
    page,
    `
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
          insert="1"
        />
        <text
          code={true}
          insert="23"
        />
      </>
    }
    prop:type="text"
  />
  <affine:paragraph
    prop:text={
      <>
        <text
          code={true}
          insert="456"
        />
      </>
    }
    prop:type="text"
  />
  <affine:paragraph
    prop:text={
      <>
        <text
          code={true}
          insert="78"
        />
        <text
          insert="9"
        />
      </>
    }
    prop:type="text"
  />
</affine:note>`,
    noteId
  );

  await undoByClick(page);

  await assertStoreMatchJSX(
    page,
    `
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
    prop:type="text"
  />
  <affine:paragraph
    prop:text="456"
    prop:type="text"
  />
  <affine:paragraph
    prop:text="789"
    prop:type="text"
  />
</affine:note>`,
    noteId
  );

  await redoByClick(page);

  await assertStoreMatchJSX(
    page,
    `
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
          insert="1"
        />
        <text
          code={true}
          insert="23"
        />
      </>
    }
    prop:type="text"
  />
  <affine:paragraph
    prop:text={
      <>
        <text
          code={true}
          insert="456"
        />
      </>
    }
    prop:type="text"
  />
  <affine:paragraph
    prop:text={
      <>
        <text
          code={true}
          insert="78"
        />
        <text
          insert="9"
        />
      </>
    }
    prop:type="text"
  />
</affine:note>`,
    noteId
  );
});

test('single line rich-text strikethrough hotkey', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'hello');
  await dragBetweenIndices(page, [0, 0], [0, 5]);
  await strikethrough(page);
  await assertTextFormat(page, 0, 0, { strike: true });

  await undoByClick(page);
  await assertTextFormat(page, 0, 0, {});

  await redoByClick(page);
  await assertTextFormat(page, 0, 0, { strike: true });

  await waitNextFrame(page);
  // the format should be removed after trigger the hotkey again
  await strikethrough(page);
  await assertTextFormat(page, 0, 0, {});
});

test('use formatted cursor with hotkey', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'aaa');
  // format italic
  await page.keyboard.press(`${SHORT_KEY}+i`, { delay: 50 });
  await type(page, 'bbb');
  // format bold
  await page.keyboard.press(`${SHORT_KEY}+b`, { delay: 50 });
  await type(page, 'ccc');
  // unformat italic
  await page.keyboard.press(`${SHORT_KEY}+i`, { delay: 50 });
  await type(page, 'ddd');
  // unformat bold
  await page.keyboard.press(`${SHORT_KEY}+b`, { delay: 50 });
  await type(page, 'eee');

  await assertStoreMatchJSX(
    page,
    `
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
          insert="aaa"
        />
        <text
          insert="bbb"
          italic={true}
        />
        <text
          bold={true}
          insert="ccc"
          italic={true}
        />
        <text
          bold={true}
          insert="ddd"
        />
        <text
          insert="eee"
        />
      </>
    }
    prop:type="text"
  />
</affine:note>`,
    noteId
  );

  // format bold
  await page.keyboard.press(`${SHORT_KEY}+b`, { delay: 50 });
  await type(page, 'fff');

  await assertStoreMatchJSX(
    page,
    `
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
          insert="aaa"
        />
        <text
          insert="bbb"
          italic={true}
        />
        <text
          bold={true}
          insert="ccc"
          italic={true}
        />
        <text
          bold={true}
          insert="ddd"
        />
        <text
          insert="eee"
        />
        <text
          bold={true}
          insert="fff"
        />
      </>
    }
    prop:type="text"
  />
</affine:note>`,
    noteId
  );

  await pressArrowLeft(page);
  await pressArrowRight(page);
  await type(page, 'ggg');

  await assertStoreMatchJSX(
    page,
    `
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
          insert="aaa"
        />
        <text
          insert="bbb"
          italic={true}
        />
        <text
          bold={true}
          insert="ccc"
          italic={true}
        />
        <text
          bold={true}
          insert="ddd"
        />
        <text
          insert="eee"
        />
        <text
          bold={true}
          insert="fffggg"
        />
      </>
    }
    prop:type="text"
  />
</affine:note>`,
    noteId
  );

  await setInlineRangeInSelectedRichText(page, 3, 0);
  await waitNextFrame(page);
  await type(page, 'hhh');

  await assertStoreMatchJSX(
    page,
    `
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
          insert="aaahhh"
        />
        <text
          insert="bbb"
          italic={true}
        />
        <text
          bold={true}
          insert="ccc"
          italic={true}
        />
        <text
          bold={true}
          insert="ddd"
        />
        <text
          insert="eee"
        />
        <text
          bold={true}
          insert="fffggg"
        />
      </>
    }
    prop:type="text"
  />
</affine:note>`,
    noteId
  );
});

test('should single line format hotkey work', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'hello');
  await dragBetweenIndices(page, [0, 1], [0, 4]);

  // bold
  await page.keyboard.press(`${SHORT_KEY}+b`, { delay: 50 });
  // italic
  await page.keyboard.press(`${SHORT_KEY}+i`, { delay: 50 });
  // underline
  await page.keyboard.press(`${SHORT_KEY}+u`, { delay: 50 });
  // strikethrough
  await page.keyboard.press(`${SHORT_KEY}+Shift+s`, { delay: 50 });

  await waitNextFrame(page);

  await assertStoreMatchJSX(
    page,
    `
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
          insert="h"
        />
        <text
          bold={true}
          insert="ell"
          italic={true}
          strike={true}
          underline={true}
        />
        <text
          insert="o"
        />
      </>
    }
    prop:type="text"
  />
</affine:note>`,
    noteId
  );

  // bold
  await page.keyboard.press(`${SHORT_KEY}+b`, { delay: 50 });
  // italic
  await page.keyboard.press(`${SHORT_KEY}+i`, { delay: 50 });
  // underline
  await page.keyboard.press(`${SHORT_KEY}+u`, { delay: 50 });
  // strikethrough
  await page.keyboard.press(`${SHORT_KEY}+Shift+s`, { delay: 50 });

  await waitNextFrame(page);

  await assertStoreMatchJSX(
    page,
    `
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
    prop:text="hello"
    prop:type="text"
  />
</affine:note>`,
    noteId
  );
});

test('should multiple line format hotkey work', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  // 0    1   2
  // 1|23 456 78|9
  await dragBetweenIndices(page, [0, 1], [2, 2]);

  // bold
  await page.keyboard.press(`${SHORT_KEY}+b`);
  // italic
  await page.keyboard.press(`${SHORT_KEY}+i`);
  // underline
  await page.keyboard.press(`${SHORT_KEY}+u`);
  // strikethrough
  await page.keyboard.press(`${SHORT_KEY}+Shift+S`);

  await waitNextFrame(page);

  await assertStoreMatchJSX(
    page,
    `
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
          insert="1"
        />
        <text
          bold={true}
          insert="23"
          italic={true}
          strike={true}
          underline={true}
        />
      </>
    }
    prop:type="text"
  />
  <affine:paragraph
    prop:text={
      <>
        <text
          bold={true}
          insert="456"
          italic={true}
          strike={true}
          underline={true}
        />
      </>
    }
    prop:type="text"
  />
  <affine:paragraph
    prop:text={
      <>
        <text
          bold={true}
          insert="78"
          italic={true}
          strike={true}
          underline={true}
        />
        <text
          insert="9"
        />
      </>
    }
    prop:type="text"
  />
</affine:note>`,
    noteId
  );

  // bold
  await page.keyboard.press(`${SHORT_KEY}+b`, { delay: 50 });
  // italic
  await page.keyboard.press(`${SHORT_KEY}+i`, { delay: 50 });
  // underline
  await page.keyboard.press(`${SHORT_KEY}+u`, { delay: 50 });
  // strikethrough
  await page.keyboard.press(`${SHORT_KEY}+Shift+s`, { delay: 50 });

  await waitNextFrame(page);

  await assertStoreMatchJSX(
    page,
    `
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
    prop:type="text"
  />
  <affine:paragraph
    prop:text="456"
    prop:type="text"
  />
  <affine:paragraph
    prop:text="789"
    prop:type="text"
  />
</affine:note>`,
    noteId
  );
});

test('should hotkey work in paragraph', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyParagraphState(page);

  await focusRichText(page, 0);
  await type(page, 'hello');

  // XXX wait for group to be updated
  await page.waitForTimeout(10);
  await page.keyboard.press(`${SHORT_KEY}+${MODIFIER_KEY}+1`);
  await assertStoreMatchJSX(
    page,
    `
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
    prop:text="hello"
    prop:type="h1"
  />
</affine:note>`,
    noteId
  );
  await page.keyboard.press(`${SHORT_KEY}+${MODIFIER_KEY}+6`);
  await assertStoreMatchJSX(
    page,
    `
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
    prop:text="hello"
    prop:type="h6"
  />
</affine:note>`,
    noteId
  );
  await page.waitForTimeout(50);
  await page.keyboard.press(`${SHORT_KEY}+${MODIFIER_KEY}+8`);
  await assertStoreMatchJSX(
    page,
    `
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
  <affine:list
    prop:checked={false}
    prop:collapsed={false}
    prop:text="hello"
    prop:type="bulleted"
  />
</affine:note>`,
    noteId
  );
  await page.waitForTimeout(50);
  await page.keyboard.press(`${SHORT_KEY}+${MODIFIER_KEY}+9`);
  await assertStoreMatchJSX(
    page,
    `
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
  <affine:list
    prop:checked={false}
    prop:collapsed={false}
    prop:text="hello"
    prop:type="numbered"
  />
</affine:note>`,
    noteId
  );
  await page.keyboard.press(`${SHORT_KEY}+${MODIFIER_KEY}+0`);
  await assertStoreMatchJSX(
    page,
    `
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
    prop:text="hello"
    prop:type="text"
  />
</affine:note>`,
    noteId
  );
  await page.waitForTimeout(50);
  await page.keyboard.press(`${SHORT_KEY}+${MODIFIER_KEY}+d`);
  await assertStoreMatchJSX(
    page,
    `
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
    prop:text="hello"
    prop:type="text"
  />
  <affine:divider />
  <affine:paragraph
    prop:type="text"
  />
</affine:note>`,
    noteId
  );
});

test('format list to h1', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await focusRichText(page, 0);
  await updateBlockType(page, 'affine:list', 'bulleted');
  await type(page, 'aa');
  await focusRichText(page, 0);
  await updateBlockType(page, 'affine:paragraph', 'h1');
  await assertRichTextModelType(page, 'h1');
  await undoByClick(page);
  await assertRichTextModelType(page, 'bulleted');
  await redoByClick(page);
  await assertRichTextModelType(page, 'h1');
});

test('should cut work single line', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'hello');
  await resetHistory(page);
  await dragBetweenIndices(page, [0, 1], [0, 4]);
  // cut
  await page.keyboard.press(`${SHORT_KEY}+x`);
  await assertStoreMatchJSX(
    page,
    `
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
    prop:text="ho"
    prop:type="text"
  />
</affine:note>`,
    noteId
  );
  await undoByKeyboard(page);
  const text = await readClipboardText(page);
  expect(text).toBe('ell');
  await assertStoreMatchJSX(
    page,
    `
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
    prop:text="hello"
    prop:type="text"
  />
</affine:note>`,
    noteId
  );
});

test('should cut work multiple line', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await resetHistory(page);
  // 0    1   2
  // 1|23 456 78|9
  await dragBetweenIndices(page, [0, 1], [2, 2]);
  // cut
  await page.keyboard.press(`${SHORT_KEY}+x`);
  await assertStoreMatchJSX(
    page,
    `
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
    prop:text="19"
    prop:type="text"
  />
</affine:note>`,
    noteId
  );
  await undoByKeyboard(page);
  const text = await readClipboardText(page);
  expect(text).toBe(`23 456 78`);
  await assertStoreMatchJSX(
    page,
    `
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
    prop:type="text"
  />
  <affine:paragraph
    prop:text="456"
    prop:type="text"
  />
  <affine:paragraph
    prop:text="789"
    prop:type="text"
  />
</affine:note>`,
    noteId
  );
});

test('should ctrl+enter create new block', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await focusRichText(page);
  await type(page, '123');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await pressEnter(page);
  await waitNextFrame(page);
  await assertRichTexts(page, ['1', '23']);
  await page.keyboard.press(`${SHORT_KEY}+Enter`);
  await assertRichTexts(page, ['1', '23', '']);
});

test('arrow up and down behavior on multiline text blocks when previous is non-text', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  await pressEnter(page);
  await pressArrowUp(page);
  await type(page, '--- ');
  await pressEnter(page);

  await focusRichText(page);
  await type(page, '124');
  await pressShiftEnter(page);
  await type(page, '1234');

  await pressArrowUp(page);
  await waitNextFrame(page, 100);
  await assertRichTextInlineRange(page, 0, 3);

  await pressArrowUp(page);
  await assertBlockSelections(page, ['4']);
});

test.describe('bracket auto complete', () => {
  test('should bracket complete works', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    await focusRichText(page);
    await type(page, '([{');
    // type without selection should not trigger bracket complete
    await assertRichTexts(page, ['([{']);

    await dragBetweenIndices(page, [0, 1], [0, 2]);
    await type(page, '(');
    await assertRichTexts(page, ['(([){']);

    await type(page, ')');
    // Should not trigger bracket complete when type right bracket
    await assertRichTexts(page, ['(()){']);
  });

  test('bracket complete should not work when selecting mutiple lines', async ({
    page,
  }) => {
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    await initThreeParagraphs(page);

    // 1(23 45)6 789
    await dragBetweenIndices(page, [0, 1], [1, 2]);
    await type(page, '(');
    await assertRichTexts(page, ['1(6', '789']);
  });

  test('should bracket complete with backtick works', async ({ page }) => {
    await enterPlaygroundRoom(page);
    const { paragraphId } = await initEmptyParagraphState(page);
    await focusRichText(page);
    await type(page, 'hello world');

    await dragBetweenIndices(page, [0, 2], [0, 5]);
    await resetHistory(page);
    await type(page, '`');
    await assertStoreMatchJSX(
      page,
      `
<affine:paragraph
  prop:text={
    <>
      <text
        insert="he"
      />
      <text
        code={true}
        insert="llo"
      />
      <text
        insert=" world"
      />
    </>
  }
  prop:type="text"
/>`,
      paragraphId
    );

    await undoByClick(page);
    await assertStoreMatchJSX(
      page,
      `
<affine:paragraph
  prop:text="hello world"
  prop:type="text"
/>`,
      paragraphId
    );
  });

  test('auto delete bracket right', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyCodeBlockState(page);
    await focusRichText(page);
    await type(page, '(');
    await assertRichTexts(page, ['()']);
    await type(page, '(');
    await assertRichTexts(page, ['(())']);
    await page.keyboard.press('Backspace');
    await assertRichTexts(page, ['()']);
    await page.keyboard.press('Backspace');
    await assertRichTexts(page, ['']);
  });

  test('skip redundant right bracket', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyCodeBlockState(page);
    await focusRichText(page);
    await type(page, '(');
    await assertRichTexts(page, ['()']);
    await type(page, ')');
    await assertRichTexts(page, ['()']);
    await type(page, ')');
    await assertRichTexts(page, ['())']);
  });
});

// FIXME: getCurrentBlockRange need to handle comment node
test.skip('should left/right key navigator works', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await focusRichText(page, 0);
  await assertRichTextInlineRange(page, 0, 3);
  await page.keyboard.press(`${SHORT_KEY}+ArrowLeft`, { delay: 50 });
  await assertRichTextInlineRange(page, 0, 0);
  await pressArrowLeft(page);
  await assertRichTextInlineRange(page, 0, 0);
  await page.keyboard.press(`${SHORT_KEY}+ArrowRight`, { delay: 50 });
  await assertRichTextInlineRange(page, 0, 3);
  await pressArrowRight(page);
  await assertRichTextInlineRange(page, 1, 0);
  await pressArrowLeft(page);
  await assertRichTextInlineRange(page, 0, 3);
  await pressArrowRight(page, 4);
  await assertRichTextInlineRange(page, 1, 3);
  await pressArrowRight(page);
  await assertRichTextInlineRange(page, 2, 0);
  await pressArrowLeft(page);
  await assertRichTextInlineRange(page, 1, 3);
});

test('should up/down key navigator works', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await focusRichText(page, 0);
  await assertRichTextInlineRange(page, 0, 3);
  await pressArrowDown(page);
  await assertRichTextInlineRange(page, 1, 3);
  await pressArrowDown(page);
  await assertRichTextInlineRange(page, 2, 3);
  await page.keyboard.press(`${SHORT_KEY}+ArrowLeft`, { delay: 50 });
  await assertRichTextInlineRange(page, 2, 0);
  await pressArrowUp(page);
  await assertRichTextInlineRange(page, 1, 0);
  await pressArrowRight(page);
  await pressArrowUp(page);
  await assertRichTextInlineRange(page, 0, 1);
  await pressArrowDown(page);
  await assertRichTextInlineRange(page, 1, 1);
});

test('should cut in title works', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await focusTitle(page);
  await type(page, 'hello');
  await assertTitle(page, 'hello');

  await dragOverTitle(page);
  await cutByKeyboard(page);
  await assertTitle(page, '');

  await focusRichText(page);
  await pasteByKeyboard(page);
  await assertRichTexts(page, ['hello']);
});

test('enter in title should move cursor in new paragraph block', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusTitle(page);
  await type(page, 'hello');
  await assertTitle(page, 'hello');
  await pressEnter(page);
  await type(page, 'world');
  await assertRichTexts(page, ['world', '']);
});

test('should support ctrl/cmd+shift+l convert to linked doc', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);

  await dragBetweenIndices(
    page,
    [2, 3],
    [0, 0],
    { x: 20, y: 20 },
    { x: 0, y: 0 }
  );

  await waitNextFrame(page);
  await page.keyboard.press(`${SHORT_KEY}+${SHIFT_KEY}+l`);

  const linkedDocCard = page.locator('affine-embed-linked-doc-block');
  await expect(linkedDocCard).toBeVisible();

  const title = page.locator('.affine-embed-linked-doc-content-title-text');
  expect(await title.innerText()).toBe('Untitled');

  const noteContent = page.locator('.affine-embed-linked-doc-content-note');
  expect(await noteContent.innerText()).toBe('123');
});

test('should forwardDelete works when delete single character', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page, 0);
  await type(page, 'hello');
  await pressArrowLeft(page, 5);
  await pressForwardDelete(page);
  await assertRichTexts(page, ['ello']);
});

test('should forwardDelete works when delete multi characters', async ({
  page,
}) => {
  test.info().annotations.push({
    type: 'issue',
    description: 'https://github.com/toeverything/blocksuite/issues/3122',
  });
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page, 0);
  await type(page, 'hello');
  await pressArrowLeft(page, 5);
  await setInlineRangeInSelectedRichText(page, 1, 3);
  await pressForwardDelete(page);
  await assertRichTexts(page, ['ho']);
});

test('should drag multiple block and input text works', async ({ page }) => {
  test.info().annotations.push({
    type: 'issue',
    description: 'https://github.com/toeverything/blocksuite/issues/2982',
  });
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await dragBetweenIndices(page, [0, 1], [2, 1]);
  await type(page, 'ab');
  await assertRichTexts(page, ['1ab89']);
  await undoByKeyboard(page);
  await assertRichTexts(page, ['123', '456', '789']);
});

test.describe('keyboard operation to move block up or down', () => {
  test('common paragraph', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    await focusRichText(page);
    await type(page, 'hello');
    await pressEnter(page);
    await type(page, 'world');
    await pressEnter(page);
    await type(page, 'foo');
    await pressEnter(page);
    await type(page, 'bar');
    await assertRichTexts(page, ['hello', 'world', 'foo', 'bar']);
    await page.keyboard.press(`${SHORT_KEY}+${MODIFIER_KEY}+ArrowUp`);
    await page.keyboard.press(`${SHORT_KEY}+${MODIFIER_KEY}+ArrowUp`);
    await assertRichTexts(page, ['hello', 'bar', 'world', 'foo']);
    await page.keyboard.press(`${SHORT_KEY}+${MODIFIER_KEY}+ArrowDown`);
    await assertRichTexts(page, ['hello', 'world', 'bar', 'foo']);
  });

  test('with indent', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    await focusRichText(page);
    await type(page, 'hello');
    await pressEnter(page);
    await pressTab(page);
    await type(page, 'world');
    await pressEnter(page);
    await pressShiftTab(page);
    await type(page, 'foo');
    await assertRichTexts(page, ['hello', 'world', 'foo']);
    await assertBlockChildrenIds(page, '2', ['3']);
    await pressArrowUp(page);
    await pressArrowUp(page);
    await page.keyboard.press(`${SHORT_KEY}+${MODIFIER_KEY}+ArrowDown`);
    await assertRichTexts(page, ['foo', 'hello', 'world']);
    await assertBlockChildrenIds(page, '1', ['4', '2']);
    await assertBlockChildrenIds(page, '2', ['3']);
  });

  test('keep cursor', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    await focusRichText(page);
    await type(page, 'hello');
    await pressEnter(page);
    await type(page, 'world');
    await pressEnter(page);
    await type(page, 'foo');
    await assertRichTexts(page, ['hello', 'world', 'foo']);
    await assertRichTextInlineRange(page, 2, 3);
    await page.keyboard.press(`${SHORT_KEY}+${MODIFIER_KEY}+ArrowUp`);
    await page.keyboard.press(`${SHORT_KEY}+${MODIFIER_KEY}+ArrowUp`);
    await assertRichTextInlineRange(page, 0, 3);
    await page.keyboard.press(`${SHORT_KEY}+${MODIFIER_KEY}+ArrowDown`);
    await page.keyboard.press(`${SHORT_KEY}+${MODIFIER_KEY}+ArrowDown`);
    await assertRichTextInlineRange(page, 2, 3);
  });
});

test('Enter key should as expected after setting heading by shortkey', async ({
  page,
}) => {
  test.info().annotations.push({
    type: 'issue',
    description: 'https://github.com/toeverything/blocksuite/issues/4987',
  });
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'hello');
  await page.keyboard.press(`${SHORT_KEY}+${MODIFIER_KEY}+1`);
  await pressEnter(page);
  await type(page, 'world');
  await assertStoreMatchJSX(
    page,
    `
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
    prop:text="hello"
    prop:type="h1"
  />
  <affine:paragraph
    prop:text="world"
    prop:type="text"
  />
</affine:note>`,
    noteId
  );
});
