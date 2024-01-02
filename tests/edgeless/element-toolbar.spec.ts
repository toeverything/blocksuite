import { expect } from '@playwright/test';

import {
  getNoteProps,
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

test('toggle hidden/show button of note should work', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  await selectNoteInEdgeless(page, noteId);

  const toolbar = locatorComponentToolbar(page);
  const hideOnPageButton = toolbar.locator(
    'edgeless-change-note-button > div:nth-child(1)'
  );

  await expect(hideOnPageButton).toBeVisible();
  await hideOnPageButton.click();
  expect((await getNoteProps(page, noteId))?.['hidden']).toBe(true);

  const showOnPageButton = toolbar.locator(
    'edgeless-change-note-button > div:nth-child(1)'
  );
  await expect(showOnPageButton).toBeVisible();
  await showOnPageButton.click();

  expect((await getNoteProps(page, noteId))?.['hidden']).toBe(false);
});
