import { expect, test } from '@playwright/test';

import {
  enterVirgoPlayground,
  focusVirgoRichText,
  getDeltaFromVirgoRichText,
  setVirgoRichTextRange,
  type,
} from './utils/misc.js';

const ZERO_WIDTH_SPACE = '\u200B';
test('basic input', async ({ page }) => {
  await enterVirgoPlayground(page);
  await focusVirgoRichText(page);

  const editorA = page.locator('[data-virgo-root="true"]').nth(0);
  const editorB = page.locator('[data-virgo-root="true"]').nth(1);

  const editorAUndo = page.getByText('undo').nth(0);
  const editorARedo = page.getByText('redo').nth(0);

  expect(await editorA.innerText()).toBe(ZERO_WIDTH_SPACE);
  expect(await editorB.innerText()).toBe(ZERO_WIDTH_SPACE);

  await type(page, 'abcdefg');

  expect(await editorA.innerText()).toBe('abcdefg');
  expect(await editorB.innerText()).toBe('abcdefg');

  await editorAUndo.click();

  expect(await editorA.innerText()).toBe(ZERO_WIDTH_SPACE);
  expect(await editorB.innerText()).toBe(ZERO_WIDTH_SPACE);

  await editorARedo.click();

  expect(await editorA.innerText()).toBe('abcdefg');
  expect(await editorB.innerText()).toBe('abcdefg');

  await focusVirgoRichText(page);
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');

  expect(await editorA.innerText()).toBe('abc');
  expect(await editorB.innerText()).toBe('abc');

  await editorAUndo.click();

  expect(await editorA.innerText()).toBe('abcdefg');
  expect(await editorB.innerText()).toBe('abcdefg');

  await editorARedo.click();

  expect(await editorA.innerText()).toBe('abc');
  expect(await editorB.innerText()).toBe('abc');

  await focusVirgoRichText(page);
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await type(page, 'bbb');

  expect(await editorA.innerText()).toBe('abc\n' + ZERO_WIDTH_SPACE + '\nbbb');
  expect(await editorB.innerText()).toBe('abc\n' + ZERO_WIDTH_SPACE + '\nbbb');

  await editorAUndo.click();

  expect(await editorA.innerText()).toBe('abc');
  expect(await editorB.innerText()).toBe('abc');

  await editorARedo.click();

  expect(await editorA.innerText()).toBe('abc\n' + ZERO_WIDTH_SPACE + '\nbbb');
  expect(await editorB.innerText()).toBe('abc\n' + ZERO_WIDTH_SPACE + '\nbbb');

  await focusVirgoRichText(page);
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');

  expect(await editorA.innerText()).toBe('abc');
  expect(await editorB.innerText()).toBe('abc');

  await editorAUndo.click();

  expect(await editorA.innerText()).toBe('abc\n' + ZERO_WIDTH_SPACE + '\nbbb');
  expect(await editorB.innerText()).toBe('abc\n' + ZERO_WIDTH_SPACE + '\nbbb');

  await editorARedo.click();

  expect(await editorA.innerText()).toBe('abc');

  await focusVirgoRichText(page);
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await type(page, 'bb');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await type(page, 'dd');

  expect(await editorA.innerText()).toBe('abbbcdd');
  expect(await editorB.innerText()).toBe('abbbcdd');

  await editorAUndo.click();

  expect(await editorA.innerText()).toBe('abc');

  await editorARedo.click();

  expect(await editorA.innerText()).toBe('abbbcdd');
  expect(await editorB.innerText()).toBe('abbbcdd');

  await focusVirgoRichText(page);
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');

  expect(await editorA.innerText()).toBe('abbbc\n' + ZERO_WIDTH_SPACE + '\ndd');
  expect(await editorB.innerText()).toBe('abbbc\n' + ZERO_WIDTH_SPACE + '\ndd');

  await editorAUndo.click();

  expect(await editorA.innerText()).toBe('abbbcdd');
  expect(await editorB.innerText()).toBe('abbbcdd');

  await editorARedo.click();

  expect(await editorA.innerText()).toBe('abbbc\n' + ZERO_WIDTH_SPACE + '\ndd');
  expect(await editorB.innerText()).toBe('abbbc\n' + ZERO_WIDTH_SPACE + '\ndd');
});

test('readonly mode', async ({ page }) => {
  await enterVirgoPlayground(page);
  await focusVirgoRichText(page);

  const editorA = page.locator('[data-virgo-root="true"]').nth(0);
  const editorB = page.locator('[data-virgo-root="true"]').nth(1);

  expect(await editorA.innerText()).toBe(ZERO_WIDTH_SPACE);
  expect(await editorB.innerText()).toBe(ZERO_WIDTH_SPACE);

  await type(page, 'abcdefg');

  expect(await editorA.innerText()).toBe('abcdefg');
  expect(await editorB.innerText()).toBe('abcdefg');

  await page.evaluate(() => {
    const richTextA = document
      .querySelector('test-page')
      ?.shadowRoot?.querySelector('rich-text');

    if (!richTextA) {
      throw new Error('Cannot find editor');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (richTextA as any).vEditor.setReadOnly(true);
  });

  await type(page, 'aaaa');

  expect(await editorA.innerText()).toBe('abcdefg');
  expect(await editorB.innerText()).toBe('abcdefg');
});

test('basic text style', async ({ page }) => {
  await enterVirgoPlayground(page);
  await focusVirgoRichText(page);

  const editorA = page.locator('[data-virgo-root="true"]').nth(0);
  const editorB = page.locator('[data-virgo-root="true"]').nth(1);

  const editorABold = page.getByText('bold').nth(0);
  const editorAItalic = page.getByText('italic').nth(0);
  const editorAUnderline = page.getByText('underline').nth(0);
  const editorAStrikethrough = page.getByText('strikethrough').nth(0);
  const editorAInlineCode = page.getByText('inline-code').nth(0);
  const editorAReset = page.getByText('reset').nth(0);

  expect(await editorA.innerText()).toBe(ZERO_WIDTH_SPACE);
  expect(await editorB.innerText()).toBe(ZERO_WIDTH_SPACE);

  await type(page, 'abcdefg');

  expect(await editorA.innerText()).toBe('abcdefg');
  expect(await editorB.innerText()).toBe('abcdefg');

  let delta = await getDeltaFromVirgoRichText(page);
  expect(delta).toEqual([
    {
      insert: 'abcdefg',
      attributes: {
        type: 'base',
      },
    },
  ]);

  await setVirgoRichTextRange(page, { index: 2, length: 3 });

  editorABold.click();
  delta = await getDeltaFromVirgoRichText(page);
  expect(delta).toEqual([
    {
      insert: 'ab',
      attributes: {
        type: 'base',
      },
    },
    {
      insert: 'cde',
      attributes: {
        type: 'base',
        bold: true,
      },
    },
    {
      insert: 'fg',
      attributes: {
        type: 'base',
      },
    },
  ]);

  editorAItalic.click();
  delta = await getDeltaFromVirgoRichText(page);
  expect(delta).toEqual([
    {
      insert: 'ab',
      attributes: {
        type: 'base',
      },
    },
    {
      insert: 'cde',
      attributes: {
        type: 'base',
        bold: true,
        italic: true,
      },
    },
    {
      insert: 'fg',
      attributes: {
        type: 'base',
      },
    },
  ]);

  editorAUnderline.click();
  delta = await getDeltaFromVirgoRichText(page);
  expect(delta).toEqual([
    {
      insert: 'ab',
      attributes: {
        type: 'base',
      },
    },
    {
      insert: 'cde',
      attributes: {
        type: 'base',
        bold: true,
        italic: true,
        underline: true,
      },
    },
    {
      insert: 'fg',
      attributes: {
        type: 'base',
      },
    },
  ]);

  editorAStrikethrough.click();
  delta = await getDeltaFromVirgoRichText(page);
  expect(delta).toEqual([
    {
      insert: 'ab',
      attributes: {
        type: 'base',
      },
    },
    {
      insert: 'cde',
      attributes: {
        type: 'base',
        bold: true,
        italic: true,
        underline: true,
        strikethrough: true,
      },
    },
    {
      insert: 'fg',
      attributes: {
        type: 'base',
      },
    },
  ]);

  editorABold.click();
  delta = await getDeltaFromVirgoRichText(page);
  expect(delta).toEqual([
    {
      insert: 'ab',
      attributes: {
        type: 'base',
      },
    },
    {
      insert: 'cde',
      attributes: {
        type: 'base',
        italic: true,
        underline: true,
        strikethrough: true,
      },
    },
    {
      insert: 'fg',
      attributes: {
        type: 'base',
      },
    },
  ]);

  editorAItalic.click();
  delta = await getDeltaFromVirgoRichText(page);
  expect(delta).toEqual([
    {
      insert: 'ab',
      attributes: {
        type: 'base',
      },
    },
    {
      insert: 'cde',
      attributes: {
        type: 'base',
        underline: true,
        strikethrough: true,
      },
    },
    {
      insert: 'fg',
      attributes: {
        type: 'base',
      },
    },
  ]);

  editorAUnderline.click();
  delta = await getDeltaFromVirgoRichText(page);
  expect(delta).toEqual([
    {
      insert: 'ab',
      attributes: {
        type: 'base',
      },
    },
    {
      insert: 'cde',
      attributes: {
        type: 'base',
        strikethrough: true,
      },
    },
    {
      insert: 'fg',
      attributes: {
        type: 'base',
      },
    },
  ]);

  editorAStrikethrough.click();
  delta = await getDeltaFromVirgoRichText(page);
  expect(delta).toEqual([
    {
      insert: 'abcdefg',
      attributes: {
        type: 'base',
      },
    },
  ]);

  editorAReset.click();
  delta = await getDeltaFromVirgoRichText(page);
  expect(delta).toEqual([
    {
      insert: 'abcdefg',
      attributes: {
        type: 'base',
      },
    },
  ]);

  editorAInlineCode.click();
  delta = await getDeltaFromVirgoRichText(page);
  expect(delta).toEqual([
    {
      insert: 'ab',
      attributes: {
        type: 'base',
      },
    },
    {
      insert: 'cde',
      attributes: {
        type: 'inline-code',
      },
    },
    {
      insert: 'fg',
      attributes: {
        type: 'base',
      },
    },
  ]);

  editorAInlineCode.click();
  delta = await getDeltaFromVirgoRichText(page);
  expect(delta).toEqual([
    {
      insert: 'abcdefg',
      attributes: {
        type: 'base',
      },
    },
  ]);
});
