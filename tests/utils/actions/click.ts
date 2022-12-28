import type { Page } from '@playwright/test';

export async function undoByClick(page: Page) {
  await page.click('sl-button[content="Undo"]');
}

export async function redoByClick(page: Page) {
  await page.click('sl-button[content="Redo"]');
}

export async function disconnectByClick(page: Page) {
  await page.click('button[aria-label="disconnect"]');
}

export async function connectByClick(page: Page) {
  await page.click('button[aria-label="connect"]');
}

export async function addGroupByClick(page: Page) {
  await page.click('button[aria-label="add group"]');
}

export async function clickBlockTypeMenuButton(page: Page, name: string) {
  const menuButton = page.getByRole('button', { name: 'Block Type' });
  await menuButton.click();

  const menuItem = page.getByRole('menuitem', { name });
  await menuItem.click();
  await menuItem.waitFor({ state: 'hidden' });
}

export async function switchMode(page: Page) {
  await page.click('button[aria-label="switch mode"]');
}

export async function addCodeBlock(page: Page) {
  await clickBlockTypeMenuButton(page, 'Code');
  await page.waitForFunction(() => {
    const loader = document.querySelector('affine-code loader-element');
    return !loader;
  });
}

export async function switchMouseMode(page: Page) {
  await page.click('button[aria-label="switch mouse mode"]');
}

export async function switchShapeColor(page: Page, color: string) {
  await page.selectOption('select[aria-label="switch shape color"]', color);
}

export async function switchShapeType(page: Page, shapeType: string) {
  await page.selectOption('select[aria-label="switch shape type"]', shapeType);
}

export async function switchReadonly(page: Page) {
  await page.click('button[aria-label="toggle readonly"]');
}

export async function activeEmbed(page: Page) {
  await page.click('.resizable-img');
}
