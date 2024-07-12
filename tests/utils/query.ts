import { type Page, expect } from '@playwright/test';

import { waitNextFrame } from './actions/misc.js';
import { assertAlmostEqual } from './asserts.js';

export function getFormatBar(page: Page) {
  const formatBar = page.locator('.affine-format-bar-widget');
  const boldBtn = formatBar.getByTestId('bold');
  const italicBtn = formatBar.getByTestId('italic');
  const underlineBtn = formatBar.getByTestId('underline');
  const strikeBtn = formatBar.getByTestId('strike');
  const codeBtn = formatBar.getByTestId('code');
  const linkBtn = formatBar.getByTestId('link');
  // highlight
  const highlightBtn = formatBar.locator('.highlight-icon');
  const redForegroundBtn = formatBar.getByTestId(
    'var(--affine-text-highlight-foreground-red)'
  );
  const createLinkedDocBtn = formatBar.getByTestId('convert-to-linked-doc');
  const defaultColorBtn = formatBar.getByTestId('unset');
  const highlight = {
    defaultColorBtn,
    highlightBtn,
    redForegroundBtn,
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

  const moreBtn = formatBar.getByRole('button', { name: 'More' });
  const copyBtn = formatBar.getByRole('button', { name: 'Copy' });
  const duplicateBtn = formatBar.getByRole('button', { name: 'Duplicate' });
  const deleteBtn = formatBar.getByRole('button', { name: 'Delete' });
  const openMoreMenu = async () => {
    await expect(formatBar).toBeVisible();
    await moreBtn.click();
  };

  const assertBoundingBox = async (x: number, y: number) => {
    const boundingBox = await formatBar.boundingBox();
    if (!boundingBox) {
      throw new Error("formatBar doesn't exist");
    }
    assertAlmostEqual(boundingBox.x, x, 6);
    assertAlmostEqual(boundingBox.y, y, 6);
  };

  return {
    assertBoundingBox,
    boldBtn,
    bulletedBtn,
    codeBlockBtn,
    codeBtn,
    copyBtn,
    createLinkedDocBtn,
    deleteBtn,
    duplicateBtn,

    formatBar,
    h1Btn,
    highlight,
    italicBtn,
    linkBtn,

    moreBtn,
    openMoreMenu,
    openParagraphMenu,
    strikeBtn,
    textBtn,

    underlineBtn,
  };
}

export function getEmbedCardToolbar(page: Page) {
  const embedCardToolbar = page.locator('.embed-card-toolbar');
  function createButtonLocator(name: string) {
    return embedCardToolbar.getByRole('button', { name });
  }
  const copyButton = createButtonLocator('copy');
  const editButton = createButtonLocator('edit');
  const cardStyleButton = createButtonLocator('card style');
  const captionButton = createButtonLocator('caption');
  const moreButton = createButtonLocator('more');

  const cardStyleHorizontalButton = embedCardToolbar.getByRole('button', {
    name: 'Large horizontal style',
  });
  const cardStyleListButton = embedCardToolbar.getByRole('button', {
    name: 'Small horizontal style',
  });

  const openCardStyleMenu = async () => {
    await expect(embedCardToolbar).toBeVisible();
    await cardStyleButton.click();
    await waitNextFrame(page);
  };

  const openMoreMenu = async () => {
    await expect(embedCardToolbar).toBeVisible();
    await moreButton.click();
    await waitNextFrame(page);
  };

  return {
    captionButton,
    cardStyleButton,
    cardStyleHorizontalButton,
    cardStyleListButton,
    copyButton,
    editButton,
    embedCardToolbar,
    moreButton,
    openCardStyleMenu,
    openMoreMenu,
  };
}
