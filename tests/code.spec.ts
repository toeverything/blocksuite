import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

import {
  addCodeBlock,
  copyByKeyboard,
  createCodeBlock,
  dragBetweenCoords,
  dragBetweenIndices,
  enterPlaygroundRoom,
  focusRichText,
  getCenterPosition,
  getVirgoSelectionText,
  initEmptyCodeBlockState,
  initEmptyParagraphState,
  pasteByKeyboard,
  pressArrowLeft,
  pressEnter,
  redoByKeyboard,
  selectAllByKeyboard,
  SHORT_KEY,
  switchReadonly,
  type,
  undoByKeyboard,
  waitNextFrame,
} from './utils/actions/index.js';
import {
  assertKeyboardWorkInInput,
  assertRichTexts,
  assertStoreMatchJSX,
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
    await languageButton.click();
  };

  const langList = codeBlock.locator('lang-list');
  const codeOption = page.locator('.affine-codeblock-option');
  const copyButton = codeOption.getByTestId('copy-button');
  const wrapButton = codeOption.getByTestId('wrap-button');
  const deleteButton = codeOption.getByTestId('delete-button');
  return {
    codeBlock,
    languageButton,
    clickLanguageButton,
    langList,
    codeOption,
    copyButton,
    wrapButton,
    deleteButton,
  };
}

test('use debug menu can create code block', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await focusRichText(page);
  await addCodeBlock(page);

  const locator = page.locator('affine-code');
  await expect(locator).toBeVisible();
});

test('use markdown syntax can create code block', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await focusRichText(page);
  await type(page, '```');
  await type(page, ' ');

  const locator = page.locator('affine-code');
  await expect(locator).toBeVisible();
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
  await assertKeyboardWorkInInput(page, page.locator('#filter-input'));

  await type(page, 'rust');
  await page.click('.lang-list-button-container > icon-button:nth-child(1)');
  await expect(locator).toBeHidden();

  await expect(codeBlockController.languageButton).toHaveText('Rust');

  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:code
  prop:language="Rust"
/>`,
    codeBlockId
  );
  await undoByKeyboard(page);
  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:code
  prop:language="Plain Text"
/>`,
    codeBlockId
  );
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

  const position = await page.evaluate(() => {
    const code = document.querySelector('.lang-list-button-container');
    const bbox = code?.getBoundingClientRect() as DOMRect;
    return { x: bbox.right + 10, y: bbox.top + 10 };
  });
  await page.mouse.click(position.x, position.y);

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
test.skip('drag copy paste', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyCodeBlockState(page);
  await focusRichText(page);

  await type(page, 'use');

  await dragBetweenIndices(page, [0, 0], [0, 3]);
  await copyByKeyboard(page);
  await focusRichText(page);
  await page.keyboard.press(`${SHORT_KEY}+v`);

  const content = await getVirgoSelectionText(page);
  expect(content).toBe('useuse');
});

test('keyboard selection and copy paste', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyCodeBlockState(page);
  await focusRichText(page);

  await type(page, 'use');
  await page.keyboard.down('Shift');
  await pressArrowLeft(page, 'use'.length);
  await page.keyboard.up('Shift');
  await pressArrowLeft(page, 1);
  await copyByKeyboard(page);
  await pasteByKeyboard(page);

  const content = await getVirgoSelectionText(page);
  expect(content).toBe('useuse');
});

test.skip('use keyboard copy inside code block copy plain text', async ({
  page,
}) => {
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
  <affine:frame
    prop:background="--affine-background-secondary-color"
  >
    <affine:code
      prop:language="Plain Text"
      prop:text="use
"
    />
    <affine:paragraph
      prop:text="use"
      prop:type="text"
    />
  </affine:frame>
</affine:page>`
  );
});

test.skip('use code block copy menu of code block copy whole code block', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyCodeBlockState(page);
  await focusRichText(page);

  await page.keyboard.type('use');
  await pressEnter(page);
  await pressEnter(page);

  const codeBlockPosition = await getCenterPosition(page, 'affine-code');
  await page.mouse.move(codeBlockPosition.x, codeBlockPosition.y);

  const position = await getCenterPosition(
    page,
    '.affine-codeblock-option > format-bar-button:nth-child(1)'
  );

  await page.mouse.move(position.x, position.y);
  await waitNextFrame(page);
  await page.mouse.click(position.x, position.y);

  await focusRichText(page, 1);
  await pasteByKeyboard(page);
  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:page>
  <affine:frame
    prop:background="--affine-background-secondary-color"
  >
    <affine:code
      prop:language="Plain Text"
      prop:text="use
"
    />
    <affine:code
      prop:language="Plain Text"
      prop:text="use"
    />
  </affine:frame>
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
    '.affine-codeblock-option > format-bar-button:nth-child(1)'
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
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.down('Shift');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
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
    startX: bbox.x,
    startY: bbox.y + bbox.height / 2,
    endX: bbox.x + bbox.width,
    endY: bbox.y + bbox.height / 2,
  };
  await page.mouse.click(position.endX + 150, position.endY + 150);
  await dragBetweenCoords(
    page,
    { x: position.startX, y: position.startY },
    { x: position.endX, y: position.endY },
    { steps: 10 }
  );
  await page.waitForTimeout(10);
  await page.keyboard.press('Backspace');
  const locator = page.locator('affine-code');
  await expect(locator).toBeHidden();
});

test('press enter twice at end of code block can jump out', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyCodeBlockState(page);
  await focusRichText(page);

  await pressEnter(page);
  await pressEnter(page);

  const locator = page.locator('affine-paragraph');
  await expect(locator).toBeVisible();
});

test('press enter twice at end of code block with content can jump out', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyCodeBlockState(page);
  await focusRichText(page);

  await type(page, 'const a = 10;');
  await pressEnter(page);
  await pressEnter(page);

  const locator = page.locator('affine-paragraph');
  await expect(locator).toBeVisible();
});

test('press ArrowDown before code block can select code block', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  await pressEnter(page);
  await addCodeBlock(page);
  await focusRichText(page);
  await page.keyboard.press('ArrowDown');

  const locator = page.locator('affine-selected-blocks > *');
  await expect(locator).toHaveCount(1);
});

test('press backspace inside should select code block', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyCodeBlockState(page);
  await focusRichText(page);
  const codeBlock = page.locator('affine-code');
  const selectedRects = page.locator('affine-selected-blocks > *');
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

  await pressEnter(page);
  await pressEnter(page);
  await page.keyboard.press('Backspace');

  const locator = page.locator('affine-selected-blocks > *');
  await expect(locator).toHaveCount(1);
});

test('press ArrowUp after code block can select code block', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyCodeBlockState(page);
  await focusRichText(page);

  await pressEnter(page);
  await pressEnter(page);
  await page.keyboard.press('ArrowUp');

  const locator = page.locator('affine-selected-blocks > *');
  await expect(locator).toHaveCount(1);
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

  const getPosition: (
    selector: string
  ) => Promise<{ x: number; y: number; right: number }> = async (
    selector: string
  ) => {
    return await page.evaluate((selector: string) => {
      const codeBlock = document.querySelector(selector);
      const bbox = codeBlock?.getBoundingClientRect() as DOMRect;
      return {
        x: bbox.left + bbox.width / 2,
        y: bbox.top + bbox.height / 2,
        right: bbox.right,
      };
    }, selector);
  };

  const position = await getPosition('affine-code');
  await page.mouse.move(position.x, position.y);

  const optionPosition = await getPosition('.affine-codeblock-option');
  await page.mouse.move(optionPosition.x, optionPosition.y);
  const locator = page.locator('.affine-codeblock-option');
  await expect(locator).toBeVisible();
  await page.mouse.move(optionPosition.right + 10, optionPosition.y);
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
  await type(page, 'const b = "NothingToSay";');
  await page.keyboard.press('ArrowUp', { delay: 50 });
  await page.keyboard.press('Enter', { delay: 50 });
  await page.keyboard.press('Tab', { delay: 50 });
  await assertRichTexts(page, ['const a = 10;\n  \nconst b = "NothingToSay";']);
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
  await expect(
    codeBlockController.codeOption.locator('format-bar-button')
  ).toHaveCount(2);
});

test('should code block lang input supports fuzzy search', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyCodeBlockState(page);
  await focusRichText(page);

  const codeBlockController = getCodeBlock(page);
  const codeBlock = codeBlockController.codeBlock;
  await codeBlock.hover();
  await codeBlockController.clickLanguageButton();
  await expect(codeBlockController.langList).toBeVisible();
  await type(page, 'jas');
  await pressEnter(page);
  await expect(codeBlockController.languageButton).toHaveText('Javascript');
});
