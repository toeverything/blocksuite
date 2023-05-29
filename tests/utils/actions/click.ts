import type { IPoint } from '@blocksuite/blocks';
import type { Page } from '@playwright/test';

import { waitNextFrame } from './misc.js';

function getDebugMenu(page: Page) {
  const debugMenu = page.locator('debug-menu');
  return {
    debugMenu,
    undoBtn: debugMenu.locator('sl-button[content="Undo"]'),
    redoBtn: debugMenu.locator('sl-button[content="Redo"]'),

    blockTypeButton: debugMenu.getByRole('button', { name: 'Block Type' }),
    testOperationsButton: debugMenu.getByRole('button', {
      name: 'Test Operations',
    }),

    addNewPageBtn: debugMenu.locator('sl-button[content="Add New Page"]'),
  };
}

export async function click(page: Page, point: IPoint) {
  await page.mouse.click(point.x, point.y);
}

export async function undoByClick(page: Page) {
  await getDebugMenu(page).undoBtn.click();
}

export async function redoByClick(page: Page) {
  await getDebugMenu(page).redoBtn.click();
}

export async function clickBlockById(page: Page, id: string) {
  await page.click(`[data-block-id="${id}"]`);
}

export async function doubleClickBlockById(page: Page, id: string) {
  await page.dblclick(`[data-block-id="${id}"]`);
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

export async function addNewPage(page: Page) {
  const { addNewPageBtn } = getDebugMenu(page);
  await addNewPageBtn.click();
  const pageMetas = await page.evaluate(() => {
    const { workspace } = window;
    return workspace.meta.pageMetas;
  });
  if (!pageMetas.length) throw new Error('Add new page failed');
  return pageMetas[pageMetas.length - 1];
}

export async function switchToPage(page: Page, pageId?: string) {
  if (!pageId) {
    const pageMetas = await page.evaluate(() => {
      const { workspace } = window;
      return workspace.meta.pageMetas;
    });
    if (!pageMetas.length) throw new Error("There's no page to switch to");

    pageId = pageMetas[0].id;
  }

  const { debugMenu, addNewPageBtn } = getDebugMenu(page);
  if (!(await addNewPageBtn.isVisible())) {
    await clickTestOperationsMenuItem(page, 'Toggle Tab Menu');
  }
  const targetTab = debugMenu.locator(`sl-tab[panel="${pageId}"]`);
  await targetTab.click();
}

export async function clickTestOperationsMenuItem(page: Page, name: string) {
  const menuButton = getDebugMenu(page).testOperationsButton;
  await menuButton.click();
  await waitNextFrame(page); // wait for animation ended

  const menuItem = page.getByRole('menuitem', { name });
  await menuItem.click();
  await menuItem.waitFor({ state: 'hidden' }); // wait for animation ended
}

export async function clickBlockTypeMenuItem(page: Page, name: string) {
  const menuButton = getDebugMenu(page).blockTypeButton;
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

export async function toggleDarkMode(page: Page) {
  await page.click('sl-tooltip[content="Toggle Dark Mode"] sl-button');
}
