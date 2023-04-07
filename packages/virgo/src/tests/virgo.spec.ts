import { expect, test } from '@playwright/test';

import { ZERO_WIDTH_SPACE } from '../consts.js';
import type { VEditor } from '../virgo.js';
import {
  enterVirgoPlayground,
  focusVirgoRichText,
  getDeltaFromVirgoRichText,
  getVirgoRichTextLine,
  press,
  setVirgoRichTextRange,
  type,
} from './utils/misc.js';

test('basic input', async ({ page }) => {
  await enterVirgoPlayground(page);
  await focusVirgoRichText(page);

  const editorA = page.locator('[data-virgo-root="true"]').nth(0);
  const editorB = page.locator('[data-virgo-root="true"]').nth(1);

  const editorAUndo = page.getByText('undo').nth(0);
  const editorARedo = page.getByText('redo').nth(0);

  expect(await editorA.innerText()).toBe(ZERO_WIDTH_SPACE);
  expect(await editorB.innerText()).toBe(ZERO_WIDTH_SPACE);

  await page.waitForTimeout(100);

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
  await press(page, 'Delete');
  expect(await editorA.innerText()).toBe('abcdefg');
  expect(await editorB.innerText()).toBe('abcdefg');
  await press(page, 'ArrowLeft');
  await press(page, 'ArrowLeft');
  await press(page, 'Delete');
  await press(page, 'Delete');
  expect(await editorA.innerText()).toBe('abcde');
  expect(await editorB.innerText()).toBe('abcde');

  await editorAUndo.click();
  expect(await editorA.innerText()).toBe('abcdefg');
  expect(await editorB.innerText()).toBe('abcdefg');

  await focusVirgoRichText(page);
  await page.waitForTimeout(100);
  await press(page, 'Backspace');
  await press(page, 'Backspace');
  await press(page, 'Backspace');
  await press(page, 'Backspace');

  expect(await editorA.innerText()).toBe('abc');
  expect(await editorB.innerText()).toBe('abc');

  await editorAUndo.click();

  expect(await editorA.innerText()).toBe('abcdefg');
  expect(await editorB.innerText()).toBe('abcdefg');

  await editorARedo.click();

  expect(await editorA.innerText()).toBe('abc');
  expect(await editorB.innerText()).toBe('abc');

  await focusVirgoRichText(page);
  await page.waitForTimeout(100);
  await press(page, 'Enter');
  await press(page, 'Enter');
  await type(page, 'bbb');

  page.waitForTimeout(100);

  expect(await editorA.innerText()).toBe('abc\n' + ZERO_WIDTH_SPACE + '\nbbb');
  expect(await editorB.innerText()).toBe('abc\n' + ZERO_WIDTH_SPACE + '\nbbb');

  await editorAUndo.click();

  expect(await editorA.innerText()).toBe('abc');
  expect(await editorB.innerText()).toBe('abc');

  await editorARedo.click();

  expect(await editorA.innerText()).toBe('abc\n' + ZERO_WIDTH_SPACE + '\nbbb');
  expect(await editorB.innerText()).toBe('abc\n' + ZERO_WIDTH_SPACE + '\nbbb');

  await focusVirgoRichText(page);
  await page.waitForTimeout(100);
  await press(page, 'Backspace');
  await press(page, 'Backspace');
  await press(page, 'Backspace');
  await press(page, 'Backspace');
  await press(page, 'Backspace');

  expect(await editorA.innerText()).toBe('abc');
  expect(await editorB.innerText()).toBe('abc');

  await editorAUndo.click();

  expect(await editorA.innerText()).toBe('abc\n' + ZERO_WIDTH_SPACE + '\nbbb');
  expect(await editorB.innerText()).toBe('abc\n' + ZERO_WIDTH_SPACE + '\nbbb');

  await editorARedo.click();

  expect(await editorA.innerText()).toBe('abc');

  await focusVirgoRichText(page);
  await page.waitForTimeout(100);
  await press(page, 'ArrowLeft');
  await press(page, 'ArrowLeft');
  await type(page, 'bb');
  await press(page, 'ArrowRight');
  await press(page, 'ArrowRight');
  await type(page, 'dd');

  expect(await editorA.innerText()).toBe('abbbcdd');
  expect(await editorB.innerText()).toBe('abbbcdd');

  await editorAUndo.click();

  expect(await editorA.innerText()).toBe('abc');

  await editorARedo.click();

  expect(await editorA.innerText()).toBe('abbbcdd');
  expect(await editorB.innerText()).toBe('abbbcdd');

  await focusVirgoRichText(page);
  await page.waitForTimeout(100);
  await press(page, 'ArrowLeft');
  await press(page, 'ArrowLeft');
  await press(page, 'Enter');
  await press(page, 'Enter');

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

  await page.waitForTimeout(100);

  await type(page, 'abcdefg');

  expect(await editorA.innerText()).toBe('abcdefg');
  expect(await editorB.innerText()).toBe('abcdefg');

  await page.evaluate(() => {
    const richTextA = document
      .querySelector('test-page')
      ?.querySelector('virgo-test-rich-text');

    if (!richTextA) {
      throw new Error('Cannot find editor');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (richTextA as any).vEditor.setReadonly(true);
  });

  await type(page, 'aaaa');

  expect(await editorA.innerText()).toBe('abcdefg');
  expect(await editorB.innerText()).toBe('abcdefg');
});

test('basic styles', async ({ page }) => {
  await enterVirgoPlayground(page);
  await focusVirgoRichText(page);

  const editorA = page.locator('[data-virgo-root="true"]').nth(0);
  const editorB = page.locator('[data-virgo-root="true"]').nth(1);

  const editorABold = page.getByText('bold').nth(0);
  const editorAItalic = page.getByText('italic').nth(0);
  const editorAUnderline = page.getByText('underline').nth(0);
  const editorAStrike = page.getByText('strike').nth(0);
  const editorACode = page.getByText('code').nth(0);

  const editorAUndo = page.getByText('undo').nth(0);
  const editorARedo = page.getByText('redo').nth(0);

  expect(await editorA.innerText()).toBe(ZERO_WIDTH_SPACE);
  expect(await editorB.innerText()).toBe(ZERO_WIDTH_SPACE);

  await page.waitForTimeout(100);

  await type(page, 'abcdefg');

  expect(await editorA.innerText()).toBe('abcdefg');
  expect(await editorB.innerText()).toBe('abcdefg');

  let delta = await getDeltaFromVirgoRichText(page);
  expect(delta).toEqual([
    {
      insert: 'abcdefg',
    },
  ]);

  await setVirgoRichTextRange(page, { index: 2, length: 3 });

  editorABold.click();
  page.waitForTimeout(100);
  delta = await getDeltaFromVirgoRichText(page);
  expect(delta).toEqual([
    {
      insert: 'ab',
    },
    {
      insert: 'cde',
      attributes: {
        bold: true,
      },
    },
    {
      insert: 'fg',
    },
  ]);

  editorAItalic.click();
  page.waitForTimeout(100);
  delta = await getDeltaFromVirgoRichText(page);
  expect(delta).toEqual([
    {
      insert: 'ab',
    },
    {
      insert: 'cde',
      attributes: {
        bold: true,
        italic: true,
      },
    },
    {
      insert: 'fg',
    },
  ]);

  editorAUnderline.click();
  page.waitForTimeout(100);
  delta = await getDeltaFromVirgoRichText(page);
  expect(delta).toEqual([
    {
      insert: 'ab',
    },
    {
      insert: 'cde',
      attributes: {
        bold: true,
        italic: true,
        underline: true,
      },
    },
    {
      insert: 'fg',
    },
  ]);

  editorAStrike.click();
  page.waitForTimeout(100);
  delta = await getDeltaFromVirgoRichText(page);
  expect(delta).toEqual([
    {
      insert: 'ab',
    },
    {
      insert: 'cde',
      attributes: {
        bold: true,
        italic: true,
        underline: true,
        strike: true,
      },
    },
    {
      insert: 'fg',
    },
  ]);

  editorACode.click();
  page.waitForTimeout(100);
  delta = await getDeltaFromVirgoRichText(page);
  expect(delta).toEqual([
    {
      insert: 'ab',
    },
    {
      insert: 'cde',
      attributes: {
        bold: true,
        italic: true,
        underline: true,
        strike: true,
        code: true,
      },
    },
    {
      insert: 'fg',
    },
  ]);

  editorAUndo.click({
    clickCount: 5,
  });
  page.waitForTimeout(100);
  delta = await getDeltaFromVirgoRichText(page);
  expect(delta).toEqual([
    {
      insert: 'abcdefg',
    },
  ]);

  editorARedo.click({
    clickCount: 5,
  });
  page.waitForTimeout(100);
  delta = await getDeltaFromVirgoRichText(page);
  expect(delta).toEqual([
    {
      insert: 'ab',
    },
    {
      insert: 'cde',
      attributes: {
        bold: true,
        italic: true,
        underline: true,
        strike: true,
        code: true,
      },
    },
    {
      insert: 'fg',
    },
  ]);

  editorABold.click();
  page.waitForTimeout(100);
  delta = await getDeltaFromVirgoRichText(page);
  expect(delta).toEqual([
    {
      insert: 'ab',
    },
    {
      insert: 'cde',
      attributes: {
        italic: true,
        underline: true,
        strike: true,
        code: true,
      },
    },
    {
      insert: 'fg',
    },
  ]);

  editorAItalic.click();
  page.waitForTimeout(100);
  delta = await getDeltaFromVirgoRichText(page);
  expect(delta).toEqual([
    {
      insert: 'ab',
    },
    {
      insert: 'cde',
      attributes: {
        underline: true,
        strike: true,
        code: true,
      },
    },
    {
      insert: 'fg',
    },
  ]);

  editorAUnderline.click();
  page.waitForTimeout(100);
  delta = await getDeltaFromVirgoRichText(page);
  expect(delta).toEqual([
    {
      insert: 'ab',
    },
    {
      insert: 'cde',
      attributes: {
        strike: true,
        code: true,
      },
    },
    {
      insert: 'fg',
    },
  ]);

  editorAStrike.click();
  page.waitForTimeout(100);
  delta = await getDeltaFromVirgoRichText(page);
  expect(delta).toEqual([
    {
      insert: 'ab',
    },
    {
      insert: 'cde',
      attributes: {
        code: true,
      },
    },
    {
      insert: 'fg',
    },
  ]);

  editorACode.click();
  page.waitForTimeout(100);
  delta = await getDeltaFromVirgoRichText(page);
  expect(delta).toEqual([
    {
      insert: 'abcdefg',
    },
  ]);
});

test('overlapping styles', async ({ page }) => {
  await enterVirgoPlayground(page);
  await focusVirgoRichText(page);

  const editorA = page.locator('[data-virgo-root="true"]').nth(0);
  const editorB = page.locator('[data-virgo-root="true"]').nth(1);

  const editorABold = page.getByText('bold').nth(0);
  const editorAItalic = page.getByText('italic').nth(0);

  const editorAUndo = page.getByText('undo').nth(0);
  const editorARedo = page.getByText('redo').nth(0);

  expect(await editorA.innerText()).toBe(ZERO_WIDTH_SPACE);
  expect(await editorB.innerText()).toBe(ZERO_WIDTH_SPACE);

  await page.waitForTimeout(100);

  await type(page, 'abcdefghijk');

  expect(await editorA.innerText()).toBe('abcdefghijk');
  expect(await editorB.innerText()).toBe('abcdefghijk');

  let delta = await getDeltaFromVirgoRichText(page);
  expect(delta).toEqual([
    {
      insert: 'abcdefghijk',
    },
  ]);

  await setVirgoRichTextRange(page, { index: 1, length: 3 });
  editorABold.click();

  delta = await getDeltaFromVirgoRichText(page);
  expect(delta).toEqual([
    {
      insert: 'a',
    },
    {
      insert: 'bcd',
      attributes: {
        bold: true,
      },
    },
    {
      insert: 'efghijk',
    },
  ]);

  await setVirgoRichTextRange(page, { index: 7, length: 3 });
  editorABold.click();

  delta = await getDeltaFromVirgoRichText(page);
  expect(delta).toEqual([
    {
      insert: 'a',
    },
    {
      insert: 'bcd',
      attributes: {
        bold: true,
      },
    },
    {
      insert: 'efg',
    },
    {
      insert: 'hij',
      attributes: {
        bold: true,
      },
    },
    {
      insert: 'k',
    },
  ]);

  await setVirgoRichTextRange(page, { index: 3, length: 5 });
  editorAItalic.click();

  delta = await getDeltaFromVirgoRichText(page);
  expect(delta).toEqual([
    {
      insert: 'a',
    },
    {
      insert: 'bc',
      attributes: {
        bold: true,
      },
    },
    {
      insert: 'd',
      attributes: {
        bold: true,
        italic: true,
      },
    },
    {
      insert: 'efg',
      attributes: {
        italic: true,
      },
    },
    {
      insert: 'h',
      attributes: {
        bold: true,
        italic: true,
      },
    },
    {
      insert: 'ij',
      attributes: {
        bold: true,
      },
    },
    {
      insert: 'k',
    },
  ]);

  editorAUndo.click({
    clickCount: 3,
  });
  delta = await getDeltaFromVirgoRichText(page);
  expect(delta).toEqual([
    {
      insert: 'abcdefghijk',
    },
  ]);

  editorARedo.click({
    clickCount: 3,
  });
  delta = await getDeltaFromVirgoRichText(page);
  expect(delta).toEqual([
    {
      insert: 'a',
    },
    {
      insert: 'bc',
      attributes: {
        bold: true,
      },
    },
    {
      insert: 'd',
      attributes: {
        bold: true,
        italic: true,
      },
    },
    {
      insert: 'efg',
      attributes: {
        italic: true,
      },
    },
    {
      insert: 'h',
      attributes: {
        bold: true,
        italic: true,
      },
    },
    {
      insert: 'ij',
      attributes: {
        bold: true,
      },
    },
    {
      insert: 'k',
    },
  ]);
});

test('input continuous spaces', async ({ page }) => {
  await enterVirgoPlayground(page);
  await focusVirgoRichText(page);

  const editorA = page.locator('[data-virgo-root="true"]').nth(0);
  const editorB = page.locator('[data-virgo-root="true"]').nth(1);

  expect(await editorA.innerText()).toBe(ZERO_WIDTH_SPACE);
  expect(await editorB.innerText()).toBe(ZERO_WIDTH_SPACE);

  await page.waitForTimeout(100);

  await type(page, 'abc   def');

  expect(await editorA.innerText()).toBe('abc   def');
  expect(await editorB.innerText()).toBe('abc   def');

  await focusVirgoRichText(page);
  await page.waitForTimeout(100);
  await press(page, 'ArrowLeft');
  await press(page, 'ArrowLeft');
  await press(page, 'ArrowLeft');
  await press(page, 'ArrowLeft');

  await press(page, 'Enter');

  expect(await editorA.innerText()).toBe('abc  \n' + ' def');
  expect(await editorB.innerText()).toBe('abc  \n' + ' def');
});

test('select from the start of line using shift+arrow', async ({ page }) => {
  await enterVirgoPlayground(page);
  await focusVirgoRichText(page);

  const editorA = page.locator('[data-virgo-root="true"]').nth(0);
  const editorB = page.locator('[data-virgo-root="true"]').nth(1);

  expect(await editorA.innerText()).toBe(ZERO_WIDTH_SPACE);
  expect(await editorB.innerText()).toBe(ZERO_WIDTH_SPACE);

  await page.waitForTimeout(100);

  await type(page, 'abc');
  await press(page, 'Enter');
  await type(page, 'def');
  await press(page, 'Enter');
  await type(page, 'ghi');

  expect(await editorA.innerText()).toBe('abc\ndef\nghi');
  expect(await editorB.innerText()).toBe('abc\ndef\nghi');

  /**
   * abc
   * def
   * |ghi
   */
  await press(page, 'ArrowLeft');
  await press(page, 'ArrowLeft');
  await press(page, 'ArrowLeft');

  /**
   * |abc
   * def
   * |ghi
   */
  await page.keyboard.down('Shift');
  await press(page, 'ArrowUp');
  await press(page, 'ArrowUp');

  /**
   * a|bc
   * def
   * |ghi
   */
  await press(page, 'ArrowRight');
  await press(page, 'Backspace');

  expect(await editorA.innerText()).toBe('aghi');
  expect(await editorB.innerText()).toBe('aghi');
});

test('getLine', async ({ page }) => {
  await enterVirgoPlayground(page);
  await focusVirgoRichText(page);

  const editorA = page.locator('[data-virgo-root="true"]').nth(0);
  const editorB = page.locator('[data-virgo-root="true"]').nth(1);

  expect(await editorA.innerText()).toBe(ZERO_WIDTH_SPACE);
  expect(await editorB.innerText()).toBe(ZERO_WIDTH_SPACE);

  await page.waitForTimeout(100);

  await type(page, 'abc');
  await press(page, 'Enter');
  await type(page, 'def');
  await press(page, 'Enter');
  await type(page, 'ghi');

  expect(await editorA.innerText()).toBe('abc\ndef\nghi');
  expect(await editorB.innerText()).toBe('abc\ndef\nghi');

  const [line1, offset1] = await getVirgoRichTextLine(page, 0);
  const [line2, offset2] = await getVirgoRichTextLine(page, 1);
  const [line3, offset3] = await getVirgoRichTextLine(page, 4);
  const [line4, offset4] = await getVirgoRichTextLine(page, 5);
  const [line5, offset5] = await getVirgoRichTextLine(page, 8);
  const [line6, offset6] = await getVirgoRichTextLine(page, 11);

  expect(line1).toEqual('abc');
  expect(offset1).toEqual(0);
  expect(line2).toEqual('abc');
  expect(offset2).toEqual(1);
  expect(line3).toEqual('def');
  expect(offset3).toEqual(0);
  expect(line4).toEqual('def');
  expect(offset4).toEqual(1);
  expect(line5).toEqual('ghi');
  expect(offset5).toEqual(0);
  expect(line6).toEqual('ghi');
  expect(offset6).toEqual(3);
});

test('yText should not contain \r', async ({ page }) => {
  await enterVirgoPlayground(page);
  await focusVirgoRichText(page);

  await page.waitForTimeout(100);
  const message = await page.evaluate(() => {
    const richText = document
      .querySelector('test-page')
      ?.querySelector('virgo-test-rich-text');

    if (!richText) {
      throw new Error('Cannot find virgo-test-rich-text');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const editor = (richText as any).vEditor as VEditor;

    try {
      editor.insertText({ index: 0, length: 0 }, 'abc\r');
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (e as any).message;
    }
  });

  expect(message).toBe(
    'yText must not contain \r because it will break the range synclization'
  );
});
