import { expect, type Page } from '@playwright/test';

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
    formatBar,
    boldBtn,
    italicBtn,
    underlineBtn,
    strikeBtn,
    codeBtn,
    linkBtn,
    highlight,
    createLinkedDocBtn,

    openParagraphMenu,
    textBtn,
    h1Btn,
    bulletedBtn,
    codeBlockBtn,

    moreBtn,
    openMoreMenu,
    copyBtn,
    duplicateBtn,
    deleteBtn,

    assertBoundingBox,
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
    embedCardToolbar,
    copyButton,
    editButton,
    cardStyleButton,
    captionButton,
    moreButton,
    openCardStyleMenu,
    openMoreMenu,
    cardStyleHorizontalButton,
    cardStyleListButton,
  };
}
