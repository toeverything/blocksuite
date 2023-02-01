import { expect, test } from '@playwright/test';
import {
  addCodeBlock,
  copyByKeyboard,
  createCodeBlock,
  dragBetweenCoords,
  enterPlaygroundRoom,
  focusRichText,
  getQuillSelectionText,
  initEmptyCodeBlockState,
  initEmptyParagraphState,
  pasteByKeyboard,
  pressEnter,
  redoByKeyboard,
  selectAllByKeyboard,
  SHORT_KEY,
  type,
  undoByKeyboard,
} from './utils/actions/index.js';
import { assertKeyboardWorkInInput, assertRichTexts } from './utils/asserts.js';

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
  const inlineCodelocator = page.locator('code');
  await expect(inlineCodelocator).toBeVisible();
  const codes = await inlineCodelocator.innerText();
  expect(codes).toEqual('```');
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
  await initEmptyCodeBlockState(page);
  await focusRichText(page);

  const position = await page.evaluate(() => {
    const codeBlock = document.querySelector('affine-code');
    const bbox = codeBlock?.getBoundingClientRect() as DOMRect;
    return {
      x: bbox.left + bbox.width / 2,
      y: bbox.top + bbox.height / 2,
    };
  });

  await page.mouse.move(position.x, position.y);

  const codeLangSelector = '.lang-container > code-block-button:nth-child(1)';
  await page.click(codeLangSelector);
  const locator = page.locator('.lang-list-button-container');
  await expect(locator).toBeVisible();
  await assertKeyboardWorkInInput(page, page.locator('#filter-input'));

  await type(page, 'rust');
  await page.click(
    '.lang-list-button-container > code-block-button:nth-child(1)'
  );
  await expect(locator).toBeHidden();

  await page.mouse.move(position.x, position.y);
  await expect(page.locator(codeLangSelector)).toHaveText('Rust');
});

test('language select list can disappear when click other place', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyCodeBlockState(page);
  await focusRichText(page);

  const codeLangSelector = '.lang-container > code-block-button:nth-child(1)';
  await page.click(codeLangSelector);
  const locator = page.locator('.lang-list-button-container');
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

test('drag copy paste', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyCodeBlockState(page);
  await focusRichText(page);

  await type(page, 'use');
  const position = await page.evaluate(() => {
    const code = document.querySelector('pre');
    const bbox = code?.getBoundingClientRect() as DOMRect;
    return {
      startX: bbox.left,
      startY: bbox.bottom - bbox.height / 2,
      endX: bbox.left + 100,
      endY: bbox.bottom - bbox.height / 2,
    };
  });

  await dragBetweenCoords(
    page,
    { x: position.startX, y: position.startY },
    { x: position.endX, y: position.endY }
  );
  await copyByKeyboard(page);
  await pasteByKeyboard(page);

  const content = await getQuillSelectionText(page);
  expect(content).toBe('use\n');
});

test('split code by enter', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyCodeBlockState(page);
  await focusRichText(page);

  await type(page, 'hello');

  // he|llo
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');

  await pressEnter(page);
  await assertRichTexts(page, ['he\nllo\n']);

  await undoByKeyboard(page);
  await assertRichTexts(page, ['hello\n']);

  await redoByKeyboard(page);
  await assertRichTexts(page, ['he\nllo\n']);
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
  await assertRichTexts(page, ['he\no\n']);

  await undoByKeyboard(page);
  await assertRichTexts(page, ['hello\n']);

  await redoByKeyboard(page);
  await assertRichTexts(page, ['he\no\n']);
});

test('keyboard selection and copy paste', async ({ page }) => {
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
  await pasteByKeyboard(page);

  const content = await getQuillSelectionText(page);
  expect(content).toBe('use\n');
});

test('drag select code block can delete it', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyCodeBlockState(page);
  await focusRichText(page);

  const position = await page.evaluate(() => {
    const code = document.querySelector('affine-code');
    const bbox = code?.getBoundingClientRect() as DOMRect;
    return {
      startX: bbox.left,
      startY: bbox.bottom - bbox.height / 2,
      endX: bbox.right,
      endY: bbox.bottom - bbox.height / 2,
    };
  });
  await page.mouse.click(position.endX + 150, position.endY + 150);
  await dragBetweenCoords(
    page,
    { x: position.startX, y: position.startY },
    { x: position.endX, y: position.endY }
  );
  await page.locator('.ql-syntax').evaluate(e => e.blur());
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

test('press ArrowDown before code block can select code block', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  await pressEnter(page);
  await addCodeBlock(page);
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowDown');

  const locator = page.locator('.affine-page-selected-rects-container');
  await expect(locator).toHaveCount(1);
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

  const locator = page.locator('.affine-page-selected-rects-container');
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

  const locator = page.locator('.affine-page-selected-rects-container');
  await expect(locator).toHaveCount(1);
});

test('undo and redo works in code block', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyCodeBlockState(page);
  await focusRichText(page);

  await type(page, 'const a = 10;');
  await assertRichTexts(page, ['const a = 10;\n']);
  await undoByKeyboard(page);
  await assertRichTexts(page, ['\n']);

  await redoByKeyboard(page);
  await assertRichTexts(page, ['const a = 10;\n']);
});

test('code block option will not disappear when hovering on it', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyCodeBlockState(page);
  await focusRichText(page);

  const getCenterPosition: (
    selector: string
  ) => Promise<{ x: number; y: number }> = async (selector: string) => {
    return await page.evaluate((selector: string) => {
      const codeBlock = document.querySelector(selector);
      const bbox = codeBlock?.getBoundingClientRect() as DOMRect;
      return {
        x: bbox.left + bbox.width / 2,
        y: bbox.top + bbox.height / 2,
      };
    }, selector);
  };

  const position = await getCenterPosition('affine-code');
  await page.mouse.move(position.x, position.y);

  const optionPosition = await getCenterPosition('.code-block-option');
  await page.mouse.move(optionPosition.x, optionPosition.y);
  const locator = page.locator('.code-block-option');
  await expect(locator).toBeVisible();
});

test('should ctrl+enter works in code block', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyCodeBlockState(page);
  await focusRichText(page);

  await type(page, 'const a = 10;');
  await assertRichTexts(page, ['const a = 10;\n']);
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press(`${SHORT_KEY}+Enter`);
  // TODO fix this
  // actual
  await assertRichTexts(page, ['const a = 10\n;\n']);
  test.fail();
  // but expected
  await assertRichTexts(page, ['const a = 10;\n\n']);
});
