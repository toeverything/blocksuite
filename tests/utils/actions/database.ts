import type { Page } from '@playwright/test';

export async function doColumnAction(
  page: Page,
  columnId: string,
  action: string
) {
  const titleRow = page.locator('.affine-database-column-header');
  const columnTitle = titleRow.locator(`[data-column-id="${columnId}"]`);
  await columnTitle.click();

  const actionMenu = page.locator(`.${action}`);
  await actionMenu.click();
}
