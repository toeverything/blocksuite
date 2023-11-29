import type { Page } from '@playwright/test';

// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import type { IPoint } from '../../../packages/blocks/src/index.js';
import { toViewCoord } from './edgeless.js';
import { waitNextFrame } from './misc.js';

function getDebugMenu(page: Page) {
  const debugMenu = page.locator('debug-menu');
  return {
    debugMenu,
    undoBtn: debugMenu.locator('sl-tooltip[content="Undo"]'),
    redoBtn: debugMenu.locator('sl-tooltip[content="Redo"]'),

    blockTypeButton: debugMenu.getByRole('button', { name: 'Block Type' }),
    testOperationsButton: debugMenu.getByRole('button', {
      name: 'Test Operations',
    }),

    addNewPageBtn: debugMenu.locator('sl-tooltip[content="Add New Page"]'),
  };
}

export async function click(page: Page, point: IPoint) {
  await page.mouse.click(point.x, point.y);
}

export async function clickView(page: Page, point: [number, number]) {
  const [x, y] = await toViewCoord(page, point);
  await page.mouse.click(x, y);
}

export async function dblclickView(page: Page, point: [number, number]) {
  const [x, y] = await toViewCoord(page, point);
  await page.mouse.dblclick(x, y);
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

export async function addNoteByClick(page: Page) {
  await clickTestOperationsMenuItem(page, 'Add Note');
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
  await page.evaluate(pageId => {
    const { workspace, editor } = window;

    if (!pageId) {
      const pageMetas = workspace.meta.pageMetas;
      if (!pageMetas.length) return;
      pageId = pageMetas[0].id;
    }

    const page = workspace.getPage(pageId);
    if (!page) return;
    editor.page = page;
  }, pageId);
}

export async function clickTestOperationsMenuItem(page: Page, name: string) {
  const menuButton = getDebugMenu(page).testOperationsButton;
  await menuButton.click();
  await waitNextFrame(page); // wait for animation ended

  const menuItem = page.getByRole('menuitem', { name });
  await menuItem.click();
  await menuItem.waitFor({ state: 'hidden' }); // wait for animation ended
}

export async function switchReadonly(page: Page) {
  page.evaluate(() => {
    const defaultPage = document.querySelector(
      'affine-doc-page'
    ) as HTMLElement & {
      page: {
        awarenessStore: { setFlag: (key: string, value: unknown) => void };
      };
    };
    const page = defaultPage.page;
    page.awarenessStore.setFlag('readonly', { 'page:home': true });
  });
}

export async function activeEmbed(page: Page) {
  await page.click('.resizable-img');
}

export async function toggleDarkMode(page: Page) {
  await page.click('sl-tooltip[content="Toggle Dark Mode"] sl-button');
}
