import { expect } from '@playwright/test';

import {
  locatorComponentToolbar,
  selectNoteInEdgeless,
  switchEditorMode,
} from '../utils/actions/edgeless.js';
import {
  enterPlaygroundRoom,
  initEmptyEdgelessState,
} from '../utils/actions/misc.js';
import { test } from '../utils/playwright.js';

test('toolbar should appear when select note', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  await selectNoteInEdgeless(page, noteId);

  const toolbar = locatorComponentToolbar(page);
  await expect(toolbar).toBeVisible();
});

test('tooltip should be hidden after clicking on button', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  await selectNoteInEdgeless(page, noteId);

  const toolbar = locatorComponentToolbar(page);
  const modeBtn = toolbar.locator(
    '.display-mode-button-group edgeless-tool-icon-button'
  );

  await modeBtn.hover();
  await expect(page.locator('.blocksuite-portal')).toBeVisible();

  await modeBtn.click();
  await expect(page.locator('.blocksuite-portal')).toBeHidden();
  await expect(page.locator('note-display-mode-panel')).toBeVisible();

  await modeBtn.click();
  await expect(page.locator('.blocksuite-portal')).toBeVisible();
  await expect(page.locator('note-display-mode-panel')).toBeHidden();

  await modeBtn.click();
  await expect(page.locator('.blocksuite-portal')).toBeHidden();
  await expect(page.locator('note-display-mode-panel')).toBeVisible();

  const colorBtn = toolbar.locator(
    'edgeless-tool-icon-button.fill-color-button'
  );

  await colorBtn.hover();
  await expect(page.locator('.blocksuite-portal')).toBeVisible();

  await colorBtn.click();
  await expect(page.locator('.blocksuite-portal')).toBeHidden();
  await expect(page.locator('note-display-mode-panel')).toBeHidden();
  await expect(page.locator('edgeless-color-panel')).toBeVisible();
});
