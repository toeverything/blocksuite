import type { Page } from '@playwright/test';

import { waitNextFrame } from './misc.js';

export async function undoByClick(page: Page) {
  await page.click('sl-button[content="Undo"]');
}

export async function redoByClick(page: Page) {
  await page.click('sl-button[content="Redo"]');
}

export async function clickBlockById(page: Page, id: string) {
  await page.click(`[data-block-id="${id}"]`);
}

export async function doubleClickBlockById(page: Page, id: string) {
  await page.click(`[data-block-id="${id}"]`);
}

export async function disconnectByClick(page: Page) {
  await clickTestOperationsMenuItem(page, 'Disconnect');
}

export async function connectByClick(page: Page) {
  await clickTestOperationsMenuItem(page, 'Connect');
}

export async function addFrameByClick(page: Page) {
  await clickTestOperationsMenuItem(page, 'Add Frame');
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

export async function switchReadonly(page: Page) {
  page.evaluate(() => {
    const defaultPage = document.querySelector(
      'affine-default-page'
    ) as HTMLElement & {
      page: {
        awarenessStore: { setFlag: (key: string, value: unknown) => void };
      };
    };
    const page = defaultPage.page;
    page.awarenessStore.setFlag('readonly', { 'space:page0': true });
  });
}

export async function activeEmbed(page: Page) {
  await page.click('.resizable-img');
}
