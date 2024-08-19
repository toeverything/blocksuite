import { type Page, expect } from '@playwright/test';
import {
  addNote,
  locatorScalePanelButton,
  selectNoteInEdgeless,
  switchEditorMode,
  triggerComponentToolbarAction,
  zoomResetByKeyboard,
} from 'utils/actions/edgeless.js';
import {
  copyByKeyboard,
  pasteByKeyboard,
  selectAllByKeyboard,
} from 'utils/actions/keyboard.js';
import {
  enterPlaygroundRoom,
  initEmptyEdgelessState,
  waitNextFrame,
} from 'utils/actions/misc.js';
import { test } from 'utils/playwright.js';

async function setupAndAddNote(page: Page) {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);
  await zoomResetByKeyboard(page);
  const noteId = await addNote(page, 'hello world', 100, 200);
  await page.mouse.click(0, 0);
  return noteId;
}

async function openScalePanel(page: Page, noteId: string) {
  await selectNoteInEdgeless(page, noteId);
  await triggerComponentToolbarAction(page, 'changeNoteScale');
  await waitNextFrame(page);
  const scalePanel = page.locator('edgeless-scale-panel');
  await expect(scalePanel).toBeVisible();
  return scalePanel;
}

async function checkNoteScale(
  page: Page,
  noteId: string,
  expectedScale: number
) {
  const edgelessNote = page.locator(
    `affine-edgeless-note[data-block-id="${noteId}"]`
  );
  const noteContainer = edgelessNote.locator('.edgeless-note-container');
  const style = await noteContainer.getAttribute('style');
  expect(style).toContain(`transform: scale(${expectedScale})`);
}

test.describe('note scale', () => {
  test('Note scale can be changed by scale panel button', async ({ page }) => {
    const noteId = await setupAndAddNote(page);
    await openScalePanel(page, noteId);

    const scale150 = locatorScalePanelButton(page, 50);
    await scale150.click();

    await checkNoteScale(page, noteId, 0.5);
  });

  test('Note scale can be changed by scale panel input', async ({ page }) => {
    const noteId = await setupAndAddNote(page);
    const scalePanel = await openScalePanel(page, noteId);

    const scaleInput = scalePanel.locator('.scale-input');
    await scaleInput.click();
    await page.keyboard.type('50');
    await page.keyboard.press('Enter');

    await checkNoteScale(page, noteId, 0.5);
  });

  test('Note scale input support copy paste', async ({ page }) => {
    const noteId = await setupAndAddNote(page);
    const scalePanel = await openScalePanel(page, noteId);

    const scaleInput = scalePanel.locator('.scale-input');
    await scaleInput.click();
    await page.keyboard.type('50');
    await selectAllByKeyboard(page);
    await copyByKeyboard(page);
    await page.mouse.click(0, 0);

    await selectNoteInEdgeless(page, noteId);
    await triggerComponentToolbarAction(page, 'changeNoteScale');
    await waitNextFrame(page);

    await scaleInput.click();
    await pasteByKeyboard(page);
    await page.keyboard.press('Enter');

    await checkNoteScale(page, noteId, 0.5);
  });
});
