import type { Page } from '@playwright/test';

/**
 * @example
 * ```ts
 * const codeBlockController = getCodeBlock(page);
 * const codeBlock = codeBlockController.codeBlock;
 * ```
 */
export function getCodeBlock(page: Page) {
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
