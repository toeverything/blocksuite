import { expect } from '@playwright/test';

import { deleteAll, switchEditorMode } from '../utils/actions/edgeless.js';
import {
  click,
  dragBetweenCoords,
  enterPlaygroundRoom,
  getCenterPosition,
  initEmptyEdgelessState,
  initThreeParagraphs,
  type,
  waitNextFrame,
} from '../utils/actions/index.js';
import { assertRichTexts } from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

test('block hub should drag and drop a card into existing note', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await switchEditorMode(page);

  await expect(page.locator('.affine-edgeless-child-note')).toHaveCount(1);

  await page.click('.block-hub-menu-container [role="menuitem"]');
  await page.waitForTimeout(200);
  const blankMenu = '.block-hub-icon-container:nth-child(1)';

  const blankMenuRect = await getCenterPosition(page, blankMenu);
  const targetPos = await getCenterPosition(page, '[data-block-id="3"]');
  await dragBetweenCoords(
    page,
    { x: blankMenuRect.x, y: blankMenuRect.y },
    { x: targetPos.x, y: targetPos.y + 5 },
    { steps: 50 }
  );

  await waitNextFrame(page);
  await type(page, '000');
  await assertRichTexts(page, ['123', '000', '456', '789']);

  await expect(page.locator('.affine-edgeless-child-note')).toHaveCount(1);
});

test('block hub should add new note when dragged to blank area', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await switchEditorMode(page);

  await expect(page.locator('.affine-edgeless-child-note')).toHaveCount(1);

  await page.click('.block-hub-menu-container [role="menuitem"]');
  await page.waitForTimeout(200);
  const blankMenu = '.block-hub-icon-container:nth-child(1)';

  const blankMenuRect = await getCenterPosition(page, blankMenu);
  await dragBetweenCoords(
    page,
    { x: blankMenuRect.x, y: blankMenuRect.y },
    { x: 30, y: 40 },
    { steps: 50 }
  );

  await waitNextFrame(page);
  await type(page, '000');
  await assertRichTexts(page, ['123', '456', '789', '000']);

  await expect(page.locator('.affine-edgeless-child-note')).toHaveCount(2);
});

test('click blank area do not remvoe database in edgeless', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);
  await deleteAll(page);

  await page.click('.block-hub-menu-container [role="menuitem"]');
  await page.waitForTimeout(200);
  const databaseMenu = '.block-hub-icon-container:nth-child(5)';

  const databaseRect = await getCenterPosition(page, databaseMenu);

  await dragBetweenCoords(
    page,
    { x: databaseRect.x, y: databaseRect.y },
    { x: 100, y: 100 },
    { steps: 50 }
  );

  await click(page, { x: 50, y: 50 });

  const database = page.locator('affine-database');
  expect(database).toBeVisible();
  const tagColumn = page.locator('.affine-database-column').nth(1);
  expect(await tagColumn.innerText()).toBe('Tag');
  const defaultRows = page.locator('.affine-database-block-row');
  expect(await defaultRows.count()).toBe(3);
});
