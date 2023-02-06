import { expect, test } from '@playwright/test';
import {
  enterVirgoPlayground,
  focusRichText,
  getDeltaFromFirstEditor,
  pagePress,
  pageType,
  setFirstEditorRange,
} from './utils/actions/misc.js';

const ZERO_WIDTH_SPACE = '\u200B';
test('basic input', async ({ page }) => {
  await enterVirgoPlayground(page);
  await focusRichText(page);

  const editorA = page.locator('[data-virgo-root="true"]').nth(0);
  const editorB = page.locator('[data-virgo-root="true"]').nth(1);

  const editorAUndo = page.getByText('undo').nth(0);
  const editorARedo = page.getByText('redo').nth(0);

  expect(await editorA.innerText()).toBe(ZERO_WIDTH_SPACE);
  expect(await editorB.innerText()).toBe(ZERO_WIDTH_SPACE);

  await pageType(page, 'abcdefg');

  expect(await editorA.innerText()).toBe('abcdefg');
  expect(await editorB.innerText()).toBe('abcdefg');

  await editorAUndo.click();

  expect(await editorA.innerText()).toBe(ZERO_WIDTH_SPACE);
  expect(await editorB.innerText()).toBe(ZERO_WIDTH_SPACE);

  await editorARedo.click();

  expect(await editorA.innerText()).toBe('abcdefg');
  expect(await editorB.innerText()).toBe('abcdefg');

  await focusRichText(page);
  await pagePress(page, 'Backspace');
  await pagePress(page, 'Backspace');
  await pagePress(page, 'Backspace');
  await pagePress(page, 'Backspace');

  expect(await editorA.innerText()).toBe('abc');
  expect(await editorB.innerText()).toBe('abc');

  await editorAUndo.click();

  expect(await editorA.innerText()).toBe('abcdefg');
  expect(await editorB.innerText()).toBe('abcdefg');

  await editorARedo.click();

  expect(await editorA.innerText()).toBe('abc');
  expect(await editorB.innerText()).toBe('abc');

  await focusRichText(page);
  await pagePress(page, 'Enter');
  await pagePress(page, 'Enter');
  await pageType(page, 'bbb');

  expect(await editorA.innerText()).toBe('abc\n' + ZERO_WIDTH_SPACE + '\nbbb');
  expect(await editorB.innerText()).toBe('abc\n' + ZERO_WIDTH_SPACE + '\nbbb');

  await editorAUndo.click();

  expect(await editorA.innerText()).toBe('abc');
  expect(await editorB.innerText()).toBe('abc');

  await editorARedo.click();

  expect(await editorA.innerText()).toBe('abc\n' + ZERO_WIDTH_SPACE + '\nbbb');
  expect(await editorB.innerText()).toBe('abc\n' + ZERO_WIDTH_SPACE + '\nbbb');

  await focusRichText(page);
  await pagePress(page, 'Backspace');
  await pagePress(page, 'Backspace');
  await pagePress(page, 'Backspace');
  await pagePress(page, 'Backspace');
  await pagePress(page, 'Backspace');

  expect(await editorA.innerText()).toBe('abc');
  expect(await editorB.innerText()).toBe('abc');

  await editorAUndo.click();

  expect(await editorA.innerText()).toBe('abc\n' + ZERO_WIDTH_SPACE + '\nbbb');
  expect(await editorB.innerText()).toBe('abc\n' + ZERO_WIDTH_SPACE + '\nbbb');

  await editorARedo.click();

  expect(await editorA.innerText()).toBe('abc');

  await focusRichText(page);
  await pagePress(page, 'ArrowLeft');
  await pagePress(page, 'ArrowLeft');
  await pageType(page, 'bb');
  await pagePress(page, 'ArrowRight');
  await pagePress(page, 'ArrowRight');
  await pageType(page, 'dd');

  expect(await editorA.innerText()).toBe('abbbcdd');
  expect(await editorB.innerText()).toBe('abbbcdd');

  await editorAUndo.click();

  expect(await editorA.innerText()).toBe('abc');

  await editorARedo.click();

  expect(await editorA.innerText()).toBe('abbbcdd');
  expect(await editorB.innerText()).toBe('abbbcdd');

  await focusRichText(page);
  await pagePress(page, 'ArrowLeft');
  await pagePress(page, 'ArrowLeft');
  await pagePress(page, 'Enter');
  await pagePress(page, 'Enter');

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
  await focusRichText(page);

  const editorA = page.locator('[data-virgo-root="true"]').nth(0);
  const editorB = page.locator('[data-virgo-root="true"]').nth(1);

  expect(await editorA.innerText()).toBe(ZERO_WIDTH_SPACE);
  expect(await editorB.innerText()).toBe(ZERO_WIDTH_SPACE);

  await pageType(page, 'abcdefg');

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

  await pageType(page, 'aaaa');

  expect(await editorA.innerText()).toBe('abcdefg');
  expect(await editorB.innerText()).toBe('abcdefg');
});

test('basic text style', async ({ page }) => {
  await enterVirgoPlayground(page);
  await focusRichText(page);

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

  await pageType(page, 'abcdefg');

  expect(await editorA.innerText()).toBe('abcdefg');
  expect(await editorB.innerText()).toBe('abcdefg');

  let delta = await getDeltaFromFirstEditor(page);
  expect(delta).toEqual([
    {
      insert: 'abcdefg',
      attributes: {
        type: 'base',
      },
    },
  ]);

  await setFirstEditorRange(page, { index: 2, length: 3 });

  editorABold.click();
  delta = await getDeltaFromFirstEditor(page);
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
  delta = await getDeltaFromFirstEditor(page);
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
  delta = await getDeltaFromFirstEditor(page);
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
  delta = await getDeltaFromFirstEditor(page);
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
  delta = await getDeltaFromFirstEditor(page);
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
  delta = await getDeltaFromFirstEditor(page);
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
  delta = await getDeltaFromFirstEditor(page);
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
  delta = await getDeltaFromFirstEditor(page);
  expect(delta).toEqual([
    {
      insert: 'abcdefg',
      attributes: {
        type: 'base',
      },
    },
  ]);

  editorAReset.click();
  delta = await getDeltaFromFirstEditor(page);
  expect(delta).toEqual([
    {
      insert: 'abcdefg',
      attributes: {
        type: 'base',
      },
    },
  ]);

  editorAInlineCode.click();
  delta = await getDeltaFromFirstEditor(page);
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
  delta = await getDeltaFromFirstEditor(page);
  expect(delta).toEqual([
    {
      insert: 'abcdefg',
      attributes: {
        type: 'base',
      },
    },
  ]);
});
