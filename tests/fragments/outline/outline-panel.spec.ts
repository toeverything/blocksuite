import { NoteDisplayMode } from '@blocksuite/affine-model';
import { expect, type Locator, type Page } from '@playwright/test';
import {
  addNote,
  changeNoteDisplayModeWithId,
  switchEditorMode,
  triggerComponentToolbarAction,
  zoomResetByKeyboard,
} from 'utils/actions/edgeless.js';
import { pressBackspace, pressEnter, type } from 'utils/actions/keyboard.js';
import {
  enterPlaygroundRoom,
  focusRichTextEnd,
  focusTitle,
  getEditorHostLocator,
  initEmptyEdgelessState,
  initEmptyParagraphState,
  waitNextFrame,
} from 'utils/actions/misc.js';
import { assertRichTexts } from 'utils/asserts.js';

import { test } from '../../utils/playwright.js';
import {
  createHeadingsWithGap,
  getVerticalCenterFromLocator,
} from './utils.js';

test.describe('toc-panel', () => {
  async function toggleTocPanel(page: Page) {
    await page.click('sl-button:text("Test Operations")');
    await page.click('sl-menu-item:text("Toggle Outline Panel")');
    await waitNextFrame(page);
    const panel = page.locator('affine-outline-panel');
    await expect(panel).toBeVisible();

    return panel;
  }

  function getHeading(panel: Locator, level: number) {
    return panel.locator(`affine-outline-panel-body .h${level} > span`);
  }

  function getTitle(panel: Locator) {
    return panel.locator(`affine-outline-panel-body .title`);
  }

  async function toggleNoteSorting(page: Page) {
    const enableSortingButton = page.locator(
      '.outline-panel-header-container .note-sorting-button'
    );
    await enableSortingButton.click();
  }

  async function dragNoteCard(page: Page, fromCard: Locator, toCard: Locator) {
    const fromRect = await fromCard.boundingBox();
    const toRect = await toCard.boundingBox();

    await page.mouse.move(fromRect!.x + 10, fromRect!.y + 10);
    await page.mouse.down();
    await page.mouse.move(toRect!.x + 5, toRect!.y + 5, { steps: 10 });
    await page.mouse.up();
  }

  test('should display placeholder when no headings', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    const panel = await toggleTocPanel(page);

    const noHeadingPlaceholder = panel.locator('.note-placeholder');

    await focusTitle(page);
    await type(page, 'Title');
    await focusRichTextEnd(page);
    await type(page, 'Hello World');

    await expect(noHeadingPlaceholder).toBeVisible();
  });

  test('should not display empty when there are only empty headings', async ({
    page,
  }) => {
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    const panel = await toggleTocPanel(page);

    await focusTitle(page);
    await type(page, 'Title');
    await focusRichTextEnd(page);

    // heading 1 to 6
    for (let i = 1; i <= 6; i++) {
      await type(page, `${'#'.repeat(i)} `);
      await pressEnter(page);
      await expect(getHeading(panel, i)).toBeHidden();
    }

    // Title also should be hidden
    await expect(getTitle(panel)).toBeHidden();
  });

  test('should display title and headings when there are non-empty headings in editor', async ({
    page,
  }) => {
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    const panel = await toggleTocPanel(page);

    await focusRichTextEnd(page);

    // heading 1 to 6
    for (let i = 1; i <= 6; i++) {
      await type(page, `${'#'.repeat(i)} `);
      await type(page, `Heading ${i}`);
      await pressEnter(page);

      const heading = getHeading(panel, i);
      await expect(heading).toBeVisible();
      await expect(heading).toContainText(`Heading ${i}`);
    }

    const title = getTitle(panel);
    await expect(title).toBeHidden();
    await focusTitle(page);
    await type(page, 'Title');
    await expect(title).toHaveText('Title');

    // heading 1 to 6
    for (let i = 1; i <= 6; i++) {
      const heading = getHeading(panel, i);
      await expect(heading).toBeVisible();
      await expect(heading).toContainText(`Heading ${i}`);
    }
  });

  test('should update headings', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    const panel = await toggleTocPanel(page);

    await focusRichTextEnd(page);

    const h1 = getHeading(panel, 1);

    await type(page, '# Heading 1');
    await expect(h1).toContainText('Heading 1');

    await pressBackspace(page, 'Heading 1'.length);
    await expect(h1).toBeHidden();
    await type(page, 'Hello World');
    await expect(h1).toContainText('Hello World');

    const title = getTitle(panel);

    await focusTitle(page);
    await type(page, 'Title');
    await expect(title).toContainText('Title');

    await pressBackspace(page, 2);
    await expect(title).toContainText('Tit');
  });

  test('should add padding to sub-headings', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    const panel = await toggleTocPanel(page);

    await focusRichTextEnd(page);

    await type(page, '# Heading 1');
    await pressEnter(page);

    await type(page, '## Heading 2');
    await pressEnter(page);

    const h1 = getHeading(panel, 1);
    const h2 = getHeading(panel, 2);

    const h1Rect = await h1.boundingBox();
    const h2Rect = await h2.boundingBox();

    expect(h1Rect).not.toBeNull();
    expect(h2Rect).not.toBeNull();

    expect(h1Rect!.x).toBeLessThan(h2Rect!.x);
  });

  test('should highlight heading when scroll to area before viewport center', async ({
    page,
  }) => {
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    const editor = getEditorHostLocator(page);
    const panel = await toggleTocPanel(page);

    await focusRichTextEnd(page);
    const headings = await createHeadingsWithGap(page);
    await editor.locator('.inline-editor').first().scrollIntoViewIfNeeded();

    const viewportCenter = await getVerticalCenterFromLocator(
      page.locator('body')
    );

    const activeHeadingContainer = panel.locator(
      'affine-outline-panel-body .active'
    );

    for (let i = 0; i < headings.length; i++) {
      const lastHeadingCenter = await getVerticalCenterFromLocator(headings[i]);
      await page.mouse.wheel(0, lastHeadingCenter - viewportCenter + 50);
      await waitNextFrame(page);
      await expect(activeHeadingContainer).toContainText(`Heading ${i + 1}`);
    }
  });

  test('should scroll to heading and highlight heading when click item in outline panel', async ({
    page,
  }) => {
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    const panel = await toggleTocPanel(page);

    await focusRichTextEnd(page);
    const headings = await createHeadingsWithGap(page);
    const activeHeadingContainer = panel.locator(
      'affine-outline-panel-body .active'
    );

    const headingsInPanel = Array.from({ length: 6 }, (_, i) =>
      getHeading(panel, i + 1)
    );

    await headingsInPanel[2].click();
    await expect(headings[2]).toBeVisible();
    await expect(activeHeadingContainer).toContainText('Heading 3');
  });

  test('should scroll to title when click title in outline panel', async ({
    page,
  }) => {
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    const panel = await toggleTocPanel(page);

    await focusTitle(page);
    await type(page, 'Title');

    await focusRichTextEnd(page);
    await createHeadingsWithGap(page);

    const title = page.locator('doc-title');
    const titleInPanel = getTitle(panel);

    await expect(title).not.toBeInViewport();
    await titleInPanel.click();
    await waitNextFrame(page, 50);
    await expect(title).toBeVisible();
  });

  test('should update notes when change note display mode from note toolbar', async ({
    page,
  }) => {
    await enterPlaygroundRoom(page);
    await initEmptyEdgelessState(page);
    await switchEditorMode(page);
    await zoomResetByKeyboard(page);
    const noteId = await addNote(page, 'hello', 300, 300);
    await page.mouse.click(100, 100);

    await toggleTocPanel(page);
    await toggleNoteSorting(page);
    const docVisibleCard = page.locator(
      '.card-container[data-invisible="false"]'
    );
    const docInvisibleCard = page.locator(
      '.card-container[data-invisible="true"]'
    );

    await expect(docVisibleCard).toHaveCount(1);
    await expect(docInvisibleCard).toHaveCount(1);

    await changeNoteDisplayModeWithId(
      page,
      noteId,
      NoteDisplayMode.DocAndEdgeless
    );

    await expect(docVisibleCard).toHaveCount(2);
    await expect(docInvisibleCard).toHaveCount(0);
  });

  test('should reorder notes when drag and drop note in outline panel', async ({
    page,
  }) => {
    await enterPlaygroundRoom(page);
    await initEmptyEdgelessState(page);
    await switchEditorMode(page);
    await zoomResetByKeyboard(page);
    const note1 = await addNote(page, 'hello', 300, 300);
    const note2 = await addNote(page, 'world', 300, 500);
    await page.mouse.click(100, 100);

    await changeNoteDisplayModeWithId(
      page,
      note1,
      NoteDisplayMode.DocAndEdgeless
    );
    await changeNoteDisplayModeWithId(
      page,
      note2,
      NoteDisplayMode.DocAndEdgeless
    );

    await toggleTocPanel(page);
    await toggleNoteSorting(page);
    const docVisibleCard = page.locator(
      '.card-container[data-invisible="false"]'
    );

    await expect(docVisibleCard).toHaveCount(3);
    await assertRichTexts(page, ['', 'hello', 'world']);

    const noteCard3 = docVisibleCard.nth(2);
    const noteCard1 = docVisibleCard.nth(0);

    await dragNoteCard(page, noteCard3, noteCard1);

    await waitNextFrame(page);
    await assertRichTexts(page, ['world', '', 'hello']);
  });

  test('should update notes after slicing note', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyEdgelessState(page);
    await switchEditorMode(page);
    await zoomResetByKeyboard(page);
    const note1 = await addNote(page, 'hello', 100, 300);
    await pressEnter(page);
    await type(page, 'world');
    await page.mouse.click(100, 100);

    await changeNoteDisplayModeWithId(
      page,
      note1,
      NoteDisplayMode.DocAndEdgeless
    );

    await toggleTocPanel(page);
    await toggleNoteSorting(page);
    const docVisibleCard = page.locator(
      '.card-container[data-invisible="false"]'
    );

    await expect(docVisibleCard).toHaveCount(2);

    await triggerComponentToolbarAction(page, 'changeNoteSlicerSetting');
    await expect(page.locator('.note-slicer-button')).toBeVisible();
    await page.locator('.note-slicer-button').click();

    await expect(docVisibleCard).toHaveCount(3);
  });
});
