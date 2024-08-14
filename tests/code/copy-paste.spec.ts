import type { Page } from '@playwright/test';

import { expect } from '@playwright/test';

import {
  copyByKeyboard,
  pasteByKeyboard,
  pressArrowLeft,
  pressEnter,
  pressEnterWithShortkey,
  selectAllByKeyboard,
  type,
} from '../utils/actions/keyboard.js';
import {
  enterPlaygroundRoom,
  focusRichText,
  getInlineSelectionText,
  getPageSnapshot,
  initEmptyCodeBlockState,
  setSelection,
} from '../utils/actions/misc.js';
import {
  assertRichTextInlineRange,
  assertStoreMatchJSX,
} from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

/**
 * @example
 * ```ts
 * const codeBlockController = getCodeBlock(page);
 * const codeBlock = codeBlockController.codeBlock;
 * ```
 */
function getCodeBlock(page: Page) {
  const codeBlock = page.locator('affine-code');
  const languageButton = page.getByTestId('lang-button');

  const clickLanguageButton = async () => {
    await codeBlock.hover();
    await languageButton.click({ delay: 50 });
  };

  const langList = page.locator('affine-filterable-list');
  const langFilterInput = langList.locator('#filter-input');

  const codeToolbar = page.locator('affine-code-toolbar');

  const copyButton = codeToolbar.getByTestId('copy-code');
  const moreButton = codeToolbar.getByTestId('more');
  const captionButton = codeToolbar.getByTestId('caption');

  const moreMenu = page.locator('.more-popup-menu');

  const openMore = async () => {
    await moreButton.click();
    const menu = page.locator('.more-popup-menu');

    const wrapButton = page.locator('.menu-item.wrap');

    const cancelWrapButton = page.locator('.menu-item.cancel-wrap');

    const duplicateButton = page.locator('.menu-item.duplicate');

    const deleteButton = page.locator('.menu-item.delete');

    return {
      menu,
      wrapButton,
      cancelWrapButton,
      duplicateButton,
      deleteButton,
    };
  };

  return {
    codeBlock,
    codeToolbar,
    captionButton,
    languageButton,
    langList,
    copyButton,
    moreButton,
    langFilterInput,
    moreMenu,

    openMore,
    clickLanguageButton,
  };
}

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

  await setSelection(page, 2, 0, 2, 3);
  await copyByKeyboard(page);
  await pressArrowLeft(page);
  await pasteByKeyboard(page);

  const content = await getInlineSelectionText(page);
  expect(content).toBe('useuse');

  await assertRichTextInlineRange(page, 0, 3, 0);
});

test.skip('use keyboard copy inside code block copy', async ({
  page,
}, testInfo) => {
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
  expect(await getPageSnapshot(page, true)).toMatchSnapshot(
    `${testInfo.title}_pasted.json`
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
    <affine:code
      prop:caption=""
      prop:language="javascript"
      prop:text="use"
      prop:wrap={false}
    />
    <affine:code
      prop:caption=""
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
    <affine:code
      prop:caption=""
      prop:language="javascript"
      prop:wrap={false}
    />
    <affine:code
      prop:caption=""
      prop:language="javascript"
      prop:wrap={false}
    />
  </affine:note>
</affine:page>`
  );
});
