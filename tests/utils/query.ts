import { expect, type Page } from '@playwright/test';

import { assertAlmostEqual } from './asserts.js';

export function getFormatBar(page: Page) {
  const formatBar = page.locator('.affine-format-bar-widget');
  const boldBtn = formatBar.getByTestId('bold');
  const italicBtn = formatBar.getByTestId('italic');
  const underlineBtn = formatBar.getByTestId('underline');
  const strikeBtn = formatBar.getByTestId('strike');
  const codeBtn = formatBar.getByTestId('code');
  const linkBtn = formatBar.getByTestId('link');
  const copyBtn = formatBar.getByTestId('copy');
  // highlight
  const highlightBtn = formatBar.locator('.highlight-icon');
  const redForegroundBtn = formatBar.getByTestId(
    'var(--affine-text-highlight-foreground-red)'
  );
  const defaultColorBtn = formatBar.getByTestId('unset');
  const highlight = {
    highlightBtn,
    redForegroundBtn,
    defaultColorBtn,
  };

  const paragraphBtn = formatBar.locator(`.paragraph-button`);
  const openParagraphMenu = async () => {
    await expect(formatBar).toBeVisible();
    await paragraphBtn.hover();
  };

  const textBtn = formatBar.getByTestId('affine:paragraph/text');
  const h1Btn = formatBar.getByTestId('affine:paragraph/h1');
  const bulletedBtn = formatBar.getByTestId('affine:list/bulleted');
  const codeBlockBtn = formatBar.getByTestId('affine:code/');

  const assertBoundingBox = async (x: number, y: number) => {
    const boundingBox = await formatBar.boundingBox();
    if (!boundingBox) {
      throw new Error("formatBar doesn't exist");
    }
    assertAlmostEqual(boundingBox.x, x, 6);
    assertAlmostEqual(boundingBox.y, y, 6);
  };

  return {
    formatBar,
    boldBtn,
    italicBtn,
    underlineBtn,
    strikeBtn,
    codeBtn,
    linkBtn,
    copyBtn,
    highlight,

    openParagraphMenu,
    textBtn,
    h1Btn,
    bulletedBtn,
    codeBlockBtn,

    assertBoundingBox,
  };
}
