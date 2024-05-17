import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

import {
  copyByKeyboard,
  createCodeBlock,
  dragBetweenCoords,
  dragBetweenIndices,
  enterPlaygroundRoom,
  focusRichText,
  getCenterPosition,
  getInlineSelectionIndex,
  getInlineSelectionText,
  initEmptyCodeBlockState,
  initEmptyParagraphState,
  pasteByKeyboard,
  pressArrowLeft,
  pressArrowUp,
  pressBackspace,
  pressEnter,
  pressEnterWithShortkey,
  pressShiftTab,
  pressTab,
  redoByKeyboard,
  selectAllByKeyboard,
  setSelection,
  switchReadonly,
  type,
  undoByKeyboard,
  updateBlockType,
} from './utils/actions/index.js';
import {
  assertBlockCount,
  assertBlockSelections,
  assertRichTextInlineRange,
  assertRichTexts,
  assertStoreMatchJSX,
  assertTitle,
} from './utils/asserts.js';
import { test } from './utils/playwright.js';

/**
 * @example
 * ```ts
 * const codeBlockController = getCodeBlock(page);
 * const codeBlock = codeBlockController.codeBlock;
 * ```
 */
function getCodeBlock(page: Page) {
  const codeBlock = page.locator('affine-code');
  const languageButton = codeBlock.getByTestId('lang-button');
  const clickLanguageButton = async () => {
    await codeBlock.hover();
    await languageButton.click({ delay: 50 });
  };

  const langList = page.locator('lang-list');
  const codeOption = page.locator('.affine-codeblock-option');
  const copyButton = codeOption.getByTestId('copy-button');
  const wrapButton = codeOption.getByTestId('wrap-button');
  const deleteButton = codeOption.getByTestId('delete-button');
  const langFilterInput = langList.locator('#filter-input');
  return {
    codeBlock,
    languageButton,
    clickLanguageButton,
    langList,
    codeOption,
    copyButton,
    wrapButton,
    deleteButton,
    langFilterInput,
  };
}

test('use debug menu can create code block', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await focusRichText(page);
  await updateBlockType(page, 'affine:code');

  const locator = page.locator('affine-code');
  await expect(locator).toBeVisible();
});

test('use markdown syntax can create code block', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyParagraphState(page);

  await focusRichText(page);
  await type(page, 'aaa');
  await pressEnter(page);
  await type(page, 'bbb');
  await pressTab(page);
  await pressEnter(page);
  await type(page, 'ccc');
  await pressTab(page);

  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:displayMode="both"
  prop:edgeless={
    Object {
      "style": Object {
        "borderRadius": 8,
        "borderSize": 4,
        "borderStyle": "solid",
        "shadowType": "--affine-note-shadow-box",
      },
    }
  }
  prop:hidden={false}
  prop:index="a0"
>
  <affine:paragraph
    prop:text="aaa"
    prop:type="text"
  >
    <affine:paragraph
      prop:text="bbb"
      prop:type="text"
    >
      <affine:paragraph
        prop:text="ccc"
        prop:type="text"
      />
    </affine:paragraph>
  </affine:paragraph>
</affine:note>`,
    noteId
  );

  await setSelection(page, 2, 0, 2, 0);
  // |aaa
  //   bbb
  //     ccc

  await type(page, '``` ');

  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:displayMode="both"
  prop:edgeless={
    Object {
      "style": Object {
        "borderRadius": 8,
        "borderSize": 4,
        "borderStyle": "solid",
        "shadowType": "--affine-note-shadow-box",
      },
    }
  }
  prop:hidden={false}
  prop:index="a0"
>
  <affine:code
    prop:language="Plain Text"
    prop:wrap={false}
  />
  <affine:paragraph
    prop:text="aaa"
    prop:type="text"
  />
  <affine:paragraph
    prop:text="bbb"
    prop:type="text"
  >
    <affine:paragraph
      prop:text="ccc"
      prop:type="text"
    />
  </affine:paragraph>
</affine:note>`,
    noteId
  );
});

test('use markdown syntax with trailing characters can create code block', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await focusRichText(page);
  await type(page, '```JavaScript');
  await type(page, ' ');

  const locator = page.locator('affine-code');
  await expect(locator).toBeVisible();
});

test('support ```[lang] to add code block with language', async ({ page }) => {
  test.info().annotations.push({
    type: 'issue',
    description: 'https://github.com/toeverything/blocksuite/issues/1314',
  });

  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await focusRichText(page);
  await type(page, '```ts');
  await type(page, ' ');

  const codeBlockController = getCodeBlock(page);
  const codeLocator = codeBlockController.codeBlock;
  await expect(codeLocator).toBeVisible();

  const codeRect = await codeLocator.boundingBox();
  if (!codeRect) {
    throw new Error('Failed to get bounding box of code block.');
  }
  const position = {
    x: codeRect.x + codeRect.width / 2,
    y: codeRect.y + codeRect.height / 2,
  };
  await page.mouse.move(position.x, position.y);

  const languageButton = codeBlockController.languageButton;
  await expect(languageButton).toBeVisible();
  const languageText = await languageButton.innerText();
  expect(languageText).toEqual('TypeScript');
});

test('use more than three backticks can not create code block', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await focusRichText(page);
  await type(page, '`````');
  await type(page, ' ');

  const codeBlockLocator = page.locator('affine-code');
  await expect(codeBlockLocator).toBeHidden();
  const inlineCodelocator = page.getByText('```');
  await expect(inlineCodelocator).toBeVisible();
  expect(await inlineCodelocator.count()).toEqual(1);
});

test('use shortcut can create code block', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await focusRichText(page);
  await createCodeBlock(page);

  const locator = page.locator('affine-code');
  await expect(locator).toBeVisible();
});

test('change code language can work', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { codeBlockId } = await initEmptyCodeBlockState(page);
  await focusRichText(page);

  const codeBlockController = getCodeBlock(page);
  await codeBlockController.clickLanguageButton();
  const locator = codeBlockController.langList;
  await expect(locator).toBeVisible();

  await type(page, 'rust');
  await page.click('.lang-list-button-container > icon-button:nth-child(1)');
  await expect(locator).toBeHidden();

  await expect(codeBlockController.languageButton).toHaveText('Rust');

  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:code
  prop:language="rust"
  prop:wrap={false}
/>`,
    codeBlockId
  );
  await undoByKeyboard(page);
  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:code
  prop:language="Plain Text"
  prop:wrap={false}
/>`,
    codeBlockId
  );

  // Can switch to another language
  await codeBlockController.clickLanguageButton();
  await type(page, 'ts');
  await pressEnter(page);
  await expect(locator).toBeHidden();
  await expect(codeBlockController.languageButton).toHaveText('TypeScript');
});

test('language select list can disappear when click other place', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyCodeBlockState(page);
  await focusRichText(page);

  const codeBlock = getCodeBlock(page);
  await codeBlock.clickLanguageButton();
  const locator = codeBlock.langList;
  await expect(locator).toBeVisible();

  const rect = await page.locator('.lang-list-button-container').boundingBox();
  if (!rect) throw new Error('Failed to get bounding box of code block.');
  await page.mouse.click(rect.x + 10, rect.y + 10);

  await expect(locator).toBeHidden();
});

test('paste with more than one continuous breakline should remain in code block, ', async ({
  page,
}) => {
  await page.setContent(`<div contenteditable>use super::*;
use fern::{
    colors::{Color, ColoredLevelConfig},
    Dispatch,
};
<br><br>
#[inline]</div>`);
  await page.focus('div');
  await selectAllByKeyboard(page);
  await copyByKeyboard(page);

  await enterPlaygroundRoom(page);
  await initEmptyCodeBlockState(page);
  await focusRichText(page);
  await pasteByKeyboard(page);

  const locator = page.locator('affine-paragraph');
  await expect(locator).toBeHidden();
});

// FIXEME: wait for paste refactor in code block
test('drag copy paste', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyCodeBlockState(page);
  await focusRichText(page);

  await type(page, 'use');

  await dragBetweenIndices(page, [0, 0], [0, 3]);
  await copyByKeyboard(page);
  await pressArrowLeft(page);
  await pasteByKeyboard(page);

  const content = await getInlineSelectionText(page);
  expect(content).toBe('useuse');

  await assertRichTextInlineRange(page, 0, 3, 0);
});

test('keyboard selection and copy paste', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyCodeBlockState(page);
  await focusRichText(page);

  await type(page, 'use');
  await page.keyboard.down('Shift');
  await pressArrowLeft(page, 'use'.length);
  await page.keyboard.up('Shift');
  await copyByKeyboard(page);
  await pressArrowLeft(page, 1);
  await pasteByKeyboard(page);

  const content = await getInlineSelectionText(page);
  expect(content).toBe('useuse');

  await assertRichTextInlineRange(page, 0, 3, 0);
});

// FIXME: this test failed in headless mode but passed in non-headless mode
test.skip('use keyboard copy inside code block copy', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyCodeBlockState(page);
  await focusRichText(page);

  await type(page, 'use');
  await page.keyboard.down('Shift');
  for (let i = 0; i < 'use'.length; i++) {
    await page.keyboard.press('ArrowLeft');
  }
  await page.keyboard.up('Shift');
  await copyByKeyboard(page);
  await page.keyboard.press('ArrowRight');
  await pressEnter(page);
  await pressEnter(page);
  await pasteByKeyboard(page);
  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:page>
  <affine:note
    prop:background="--affine-background-secondary-color"
    prop:displayMode="both"
    prop:edgeless={
      Object {
        "style": Object {
          "borderRadius": 8,
          "borderSize": 4,
          "borderStyle": "solid",
          "shadowType": "--affine-note-shadow-box",
        },
      }
    }
    prop:hidden={false}
    prop:index="a0"
  >
    <affine:code
      prop:language="Plain Text"
      prop:text="use"
      prop:wrap={false}
    />
    <affine:code
      prop:language="Plain Text"
      prop:text="use"
      prop:wrap={false}
    />
  </affine:note>
</affine:page>`
  );
});

test('code block has content, click code block copy menu, copy whole code block', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyCodeBlockState(page, { language: 'javascript' });
  await focusRichText(page);
  await page.keyboard.type('use');
  await pressEnterWithShortkey(page);

  const codeBlockController = getCodeBlock(page);
  await codeBlockController.codeBlock.hover();
  await expect(codeBlockController.copyButton).toBeVisible();
  await codeBlockController.copyButton.click();

  await focusRichText(page, 1);
  await pasteByKeyboard(page);
  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:page>
  <affine:note
    prop:background="--affine-background-secondary-color"
    prop:displayMode="both"
    prop:edgeless={
      Object {
        "style": Object {
          "borderRadius": 8,
          "borderSize": 4,
          "borderStyle": "solid",
          "shadowType": "--affine-note-shadow-box",
        },
      }
    }
    prop:hidden={false}
    prop:index="a0"
  >
    <affine:code
      prop:language="javascript"
      prop:text="use"
      prop:wrap={false}
    />
    <affine:code
      prop:language="javascript"
      prop:text="use"
      prop:wrap={false}
    />
  </affine:note>
</affine:page>`
  );
});

test('code block is empty, click code block copy menu, copy the empty code block', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyCodeBlockState(page, { language: 'javascript' });
  await focusRichText(page);

  await pressEnterWithShortkey(page);

  const codeBlockController = getCodeBlock(page);
  await codeBlockController.codeBlock.hover();
  await expect(codeBlockController.copyButton).toBeVisible();
  await codeBlockController.copyButton.click();

  await focusRichText(page, 1);
  await pasteByKeyboard(page);
  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:page>
  <affine:note
    prop:background="--affine-background-secondary-color"
    prop:displayMode="both"
    prop:edgeless={
      Object {
        "style": Object {
          "borderRadius": 8,
          "borderSize": 4,
          "borderStyle": "solid",
          "shadowType": "--affine-note-shadow-box",
        },
      }
    }
    prop:hidden={false}
    prop:index="a0"
  >
    <affine:code
      prop:language="javascript"
      prop:wrap={false}
    />
    <affine:code
      prop:language="javascript"
      prop:wrap={false}
    />
  </affine:note>
</affine:page>`
  );
});

test('code block copy button can work', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyCodeBlockState(page);
  await focusRichText(page);

  await type(page, 'use');
  const codeBlockController = getCodeBlock(page);
  await codeBlockController.codeBlock.hover();

  const position = await getCenterPosition(
    page,
    '.affine-codeblock-option > icon-button:nth-child(1)'
  );
  await page.mouse.click(position.x, position.y);
  await focusRichText(page);
  await pasteByKeyboard(page);
  await assertRichTexts(page, ['useuse']);
});

test('split code by enter', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyCodeBlockState(page);
  await focusRichText(page);

  await type(page, 'hello');

  // he|llo
  await pressArrowLeft(page, 3);

  await pressEnter(page);
  await assertRichTexts(page, ['he\nllo']);

  await undoByKeyboard(page);
  await assertRichTexts(page, ['hello']);

  await redoByKeyboard(page);
  await assertRichTexts(page, ['he\nllo']);
});

test('split code with selection by enter', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyCodeBlockState(page);
  await focusRichText(page);

  await type(page, 'hello');

  // select 'll'
  await pressArrowLeft(page, 1);
  await page.keyboard.down('Shift');
  await pressArrowLeft(page, 2);
  await page.keyboard.up('Shift');

  await pressEnter(page);
  await assertRichTexts(page, ['he\no']);

  await undoByKeyboard(page);
  await assertRichTexts(page, ['hello']);

  await redoByKeyboard(page);
  await assertRichTexts(page, ['he\no']);
});

test('drag select code block can delete it', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyCodeBlockState(page);
  await focusRichText(page);

  const codeBlock = page.locator('affine-code');
  const bbox = await codeBlock.boundingBox();
  if (!bbox) {
    throw new Error("Failed to get code block's bounding box");
  }
  const position = {
    startX: bbox.x - 10,
    startY: bbox.y - 10,
    endX: bbox.x + bbox.width,
    endY: bbox.y + bbox.height / 2,
  };
  await dragBetweenCoords(
    page,
    { x: position.startX, y: position.startY },
    { x: position.endX, y: position.endY },
    { steps: 20 }
  );
  await page.waitForTimeout(10);
  await page.keyboard.press('Backspace');
  const locator = page.locator('affine-code');
  await expect(locator).toBeHidden();
});

test('press short key and enter at end of code block can jump out', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyCodeBlockState(page);
  await focusRichText(page);

  await pressEnterWithShortkey(page);

  const locator = page.locator('affine-paragraph');
  await expect(locator).toBeVisible();
});

test('press short key and enter at end of code block with content can jump out', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyCodeBlockState(page);
  await focusRichText(page);

  await type(page, 'const a = 10;');
  await pressEnterWithShortkey(page);

  const locator = page.locator('affine-paragraph');
  await expect(locator).toBeVisible();
});

test('press backspace inside should select code block', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyCodeBlockState(page);
  await focusRichText(page);
  const codeBlock = page.locator('affine-code');
  const selectedRects = page
    .locator('affine-block-selection')
    .locator('visible=true');
  await page.keyboard.press('Backspace');
  await expect(selectedRects).toHaveCount(1);
  await expect(codeBlock).toBeVisible();
  await page.keyboard.press('Backspace');
  await expect(selectedRects).toHaveCount(0);
  await expect(codeBlock).toBeHidden();
});

test('press backspace after code block can select code block', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyCodeBlockState(page);
  await focusRichText(page);
  const code = 'const a = 1;';
  await type(page, code);

  await assertRichTextInlineRange(page, 0, 12);
  await pressEnterWithShortkey(page);
  await assertRichTextInlineRange(page, 1, 0);
  await assertBlockCount(page, 'paragraph', 1);
  await pressBackspace(page);
  await assertBlockSelections(page, ['2']);
  await assertBlockCount(page, 'paragraph', 0);
});

test('press ArrowUp after code block can enter code block', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyCodeBlockState(page);
  await focusRichText(page);
  const code = 'const a = 1;';
  await type(page, code);

  await pressEnterWithShortkey(page);
  await page.keyboard.press('ArrowUp');

  const index = await getInlineSelectionIndex(page);
  expect(index).toBe(0);

  const text = await getInlineSelectionText(page);
  expect(text).toBe(code);
});

test('undo and redo works in code block', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyCodeBlockState(page);
  await focusRichText(page);

  await type(page, 'const a = 10;');
  await assertRichTexts(page, ['const a = 10;']);
  await undoByKeyboard(page);
  await assertRichTexts(page, ['']);

  await redoByKeyboard(page);
  await assertRichTexts(page, ['const a = 10;']);
});

test('code block option can appear and disappear during mousemove', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyCodeBlockState(page);
  await focusRichText(page);

  const position = await page.locator('affine-code').boundingBox();
  if (!position) throw new Error('Failed to get affine code position');
  await page.mouse.move(position.x, position.y);

  const locator = page.locator('.affine-codeblock-option');
  const optionPosition = await locator.boundingBox();
  if (!optionPosition) throw new Error('Failed to get option position');
  await page.mouse.move(optionPosition.x, optionPosition.y);
  await expect(locator).toBeVisible();
  await page.mouse.move(
    optionPosition.x + optionPosition.width + 10,
    optionPosition.y
  );
  await expect(locator).toBeHidden();
});

test('should tab works in code block', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyCodeBlockState(page);
  await focusRichText(page);

  await type(page, 'const a = 10;');
  await assertRichTexts(page, ['const a = 10;']);
  await page.keyboard.press('Tab', { delay: 50 });
  await assertRichTexts(page, ['  const a = 10;']);
  await page.keyboard.press(`Shift+Tab`, { delay: 50 });
  await assertRichTexts(page, ['const a = 10;']);

  await page.keyboard.press('Enter', { delay: 50 });
  await type(page, 'const b = "NothingToSay');
  await page.keyboard.press('ArrowUp', { delay: 50 });
  await page.keyboard.press('Enter', { delay: 50 });
  await page.keyboard.press('Tab', { delay: 50 });
  await assertRichTexts(page, ['const a = 10;\n  \nconst b = "NothingToSay"']);
});

test('toggle code block wrap can work', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { codeBlockId } = await initEmptyCodeBlockState(page);
  await focusRichText(page);

  const codeBlockController = getCodeBlock(page);
  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:code
  prop:language="Plain Text"
  prop:wrap={false}
/>`,
    codeBlockId
  );

  await codeBlockController.codeBlock.hover();
  await expect(codeBlockController.wrapButton).toBeVisible();
  await codeBlockController.wrapButton.click();
  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:code
  prop:language="Plain Text"
  prop:wrap={true}
/>`,
    codeBlockId
  );

  await codeBlockController.wrapButton.click();
  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:code
  prop:language="Plain Text"
  prop:wrap={false}
/>`,
    codeBlockId
  );
});

test('undo code block wrap can work', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { codeBlockId } = await initEmptyCodeBlockState(page);
  await focusRichText(page);

  const codeBlockController = getCodeBlock(page);
  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:code
  prop:language="Plain Text"
  prop:wrap={false}
/>`,
    codeBlockId
  );

  await codeBlockController.codeBlock.hover();
  await expect(codeBlockController.wrapButton).toBeVisible();
  await codeBlockController.wrapButton.click();
  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:code
  prop:language="Plain Text"
  prop:wrap={true}
/>`,
    codeBlockId
  );

  await focusRichText(page);
  await undoByKeyboard(page);
  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:code
  prop:language="Plain Text"
  prop:wrap={false}
/>`,
    codeBlockId
  );
});

test('should code block wrap active after click', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyCodeBlockState(page);
  await focusRichText(page);

  const codeBlockController = getCodeBlock(page);
  await codeBlockController.codeBlock.hover();
  await expect(codeBlockController.wrapButton).toBeVisible();
  await expect(codeBlockController.wrapButton).not.toHaveAttribute(
    'active',
    ''
  );
  await codeBlockController.wrapButton.click();
  await expect(codeBlockController.wrapButton).toBeVisible();
  await expect(codeBlockController.wrapButton).toHaveAttribute('active', '');
  await codeBlockController.wrapButton.click();
  await expect(codeBlockController.wrapButton).toBeVisible();
  await expect(codeBlockController.wrapButton).not.toHaveAttribute(
    'active',
    ''
  );
});

test('should code block works in read only mode', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyCodeBlockState(page);
  await focusRichText(page);

  await page.mouse.move(0, 0);
  await page.waitForTimeout(300);
  await switchReadonly(page);
  const codeBlockController = getCodeBlock(page);
  const codeBlock = codeBlockController.codeBlock;
  await codeBlock.hover();
  await codeBlockController.clickLanguageButton();
  await expect(codeBlockController.langList).toBeHidden();
  await expect(codeBlockController.codeOption).toBeVisible();
  await expect(codeBlockController.copyButton).toBeVisible();
  await expect(codeBlockController.wrapButton).toBeHidden();
  await expect(codeBlockController.deleteButton).toBeHidden();
});

test('should code block lang input supports alias', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyCodeBlockState(page);
  await focusRichText(page);

  const codeBlockController = getCodeBlock(page);
  const codeBlock = codeBlockController.codeBlock;
  await codeBlock.hover();
  await codeBlockController.clickLanguageButton();
  await expect(codeBlockController.langList).toBeVisible();
  await type(page, '文言');
  await pressEnter(page);
  await expect(codeBlockController.languageButton).toHaveText('Wenyan');
});

test('multi-line indent', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyCodeBlockState(page);
  await focusRichText(page);

  await type(page, 'aaa');
  await pressEnter(page);

  await type(page, 'bbb');
  await pressEnter(page);

  await type(page, 'ccc');

  await page.keyboard.down('Shift');
  await pressArrowUp(page, 2);
  await page.keyboard.up('Shift');

  await pressTab(page);

  await assertRichTexts(page, ['  aaa\n  bbb\n  ccc']);

  await pressShiftTab(page);

  await assertRichTexts(page, ['aaa\nbbb\nccc']);

  await pressShiftTab(page);

  await assertRichTexts(page, ['aaa\nbbb\nccc']);
});

test('should bracket complete works in code block', async ({ page }) => {
  test.info().annotations.push({
    type: 'issue',
    description: 'https://github.com/toeverything/blocksuite/issues/1800',
  });
  await enterPlaygroundRoom(page);
  await initEmptyCodeBlockState(page);
  await focusRichText(page);

  await type(page, 'const a = "');
  await assertRichTexts(page, ['const a = ""']);

  await type(page, 'str');
  await assertRichTexts(page, ['const a = "str"']);
  await type(page, '(');
  await assertRichTexts(page, ['const a = "str()"']);
  await type(page, ']');
  await assertRichTexts(page, ['const a = "str(])"']);
});

test('auto scroll horizontally when typing', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await focusRichText(page);
  await type(page, '``` ');

  for (let i = 0; i < 60; i++) {
    await type(page, String(i));
  }

  const richTextScrollLeft1 = await page.evaluate(() => {
    const richText = document.querySelector('affine-code .inline-editor');
    if (!richText) {
      throw new Error('Failed to get rich text');
    }

    return richText.scrollLeft;
  });
  expect(richTextScrollLeft1).toBeGreaterThan(200);

  await pressArrowLeft(page, 5);
  await type(page, 'aa');

  const richTextScrollLeft2 = await page.evaluate(() => {
    const richText = document.querySelector('affine-code .inline-editor');
    if (!richText) {
      throw new Error('Failed to get rich text');
    }

    return richText.scrollLeft;
  });

  expect(richTextScrollLeft2).toEqual(richTextScrollLeft1);
});

test('code hotkey should not effect in global', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  await pressEnter(page);
  await type(page, '``` ');

  await assertTitle(page, '');
  await assertBlockCount(page, 'paragraph', 1);
  await assertBlockCount(page, 'code', 1);

  await pressArrowUp(page);
  await pressBackspace(page);
  await type(page, 'aaa');

  await assertTitle(page, 'aaa');
  await assertBlockCount(page, 'paragraph', 0);
  await assertBlockCount(page, 'code', 1);
});
