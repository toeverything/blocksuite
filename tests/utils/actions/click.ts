import type { Page } from '@playwright/test';
import { waitNextFrame } from './misc.js';

export async function undoByClick(page: Page) {
  await page.click('sl-button[content="Undo"]');
}

export async function redoByClick(page: Page) {
  await page.click('sl-button[content="Redo"]');
}

export async function disconnectByClick(page: Page) {
  await clickTestOperationsMenuItem(page, 'Disconnect');
}

export async function connectByClick(page: Page) {
  await clickTestOperationsMenuItem(page, 'Connect');
}

export async function addGroupByClick(page: Page) {
  await clickTestOperationsMenuItem(page, 'Add Group');
}

export async function clickTestOperationsMenuItem(page: Page, name: string) {
  const menuButton = page.getByRole('button', { name: 'Test Operations' });
  await menuButton.click();
  await waitNextFrame(page); // wait for animation ended

  const menuItem = page.getByRole('menuitem', { name });
  await menuItem.click();
  await menuItem.waitFor({ state: 'hidden' }); // wait for animation ended
}

export async function clickBlockTypeMenuItem(page: Page, name: string) {
  const menuButton = page.getByRole('button', { name: 'Block Type' });
  await menuButton.click();

  const menuItem = page.getByRole('menuitem', { name });
  await menuItem.click();
  await menuItem.waitFor({ state: 'hidden' });
}

export async function addCodeBlock(page: Page) {
  await clickBlockTypeMenuItem(page, 'Code');
  await page.waitForFunction(() => {
    const loader = document.querySelector('affine-code loader-element');
    return !loader;
  });
}

export async function switchEditorMode(page: Page) {
  await page.click('sl-button[content="Switch Editor Mode"]');
}

export async function switchMouseMode(page: Page) {
  await page.click('sl-button[content="Switch Mouse Mode"]');
}

export async function switchShapeColor(page: Page, color: string) {
  await page.click('sl-select[aria-label="Shape Color"]');
  await page.evaluate(color => {
    window.debugMenu.shapeModeColor =
      color as typeof window.debugMenu.shapeModeColor;
  }, color);
}

export async function switchShapeType(page: Page, shapeType: string) {
  await page.click('sl-select[aria-label="Shape Type"]');

  const menuItem = page.getByRole('menuitem', { name: shapeType });
  await menuItem.click();
}

export async function switchReadonly(page: Page) {
  await clickTestOperationsMenuItem(page, 'Toggle Readonly');
}

export async function activeEmbed(page: Page) {
  await page.click('.resizable-img');
}
