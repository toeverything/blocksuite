import type { OutlineViewer } from '@blocksuite/presets';

import { noop } from '@blocksuite/global/utils';
import { expect, type Page } from '@playwright/test';
import { addNote, switchEditorMode } from 'utils/actions/edgeless.js';
import { pressEnter, type } from 'utils/actions/keyboard.js';
import {
  enterPlaygroundRoom,
  focusRichTextEnd,
  focusTitle,
  getEditorLocator,
  initEmptyEdgelessState,
  initEmptyParagraphState,
  waitNextFrame,
} from 'utils/actions/misc.js';

import { test } from '../../utils/playwright.js';
import {
  createHeadingsWithGap,
  getVerticalCenterFromLocator,
} from './utils.js';

test.describe('toc-viewer', () => {
  async function toggleTocViewer(page: Page) {
    await page.click('sl-button:text("Test Operations")');
    await page.click('sl-menu-item:text("Enable Outline Viewer")');
    await waitNextFrame(page);
    const viewer = page.locator('affine-outline-viewer');
    return viewer;
  }

  function getIndicators(page: Page) {
    return page.locator('affine-outline-viewer .outline-viewer-indicator');
  }

  test('should display highlight indicators when non-empty headings exists', async ({
    page,
  }) => {
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    await toggleTocViewer(page);

    await focusRichTextEnd(page);

    const indicators = getIndicators(page);

    // heading 1 to 6
    for (let i = 1; i <= 6; i++) {
      await type(page, `${'#'.repeat(i)} `);
      await type(page, `Heading ${i}`);
      await pressEnter(page);

      await expect(indicators.nth(i - 1)).toBeVisible();
    }
  });

  test('should be hidden when only empty headings exists', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    await toggleTocViewer(page);

    await focusTitle(page);
    await type(page, 'Title');
    await focusRichTextEnd(page);

    const indicators = getIndicators(page);

    // heading 1 to 6
    for (let i = 1; i <= 6; i++) {
      await type(page, `${'#'.repeat(i)} `);
      await pressEnter(page);
      await expect(indicators).toHaveCount(0);
    }
  });

  test('should display outline content when hovering over indicators', async ({
    page,
  }) => {
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    await toggleTocViewer(page);

    await focusRichTextEnd(page);

    await type(page, '# Heading 1');
    await pressEnter(page);

    const indicator = getIndicators(page).first();
    await indicator.hover({ force: true });

    const items = page.locator('.outline-viewer-item');
    await expect(items).toHaveCount(2);
    await expect(items.nth(0)).toContainText(['Table of Contents']);
    await expect(items.nth(1)).toContainText(['Heading 1']);
  });

  test('should highlight indicator when scrolling', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    await toggleTocViewer(page);
    await focusRichTextEnd(page);

    const editor = getEditorLocator(page);
    const indicators = getIndicators(page);
    const headings = await createHeadingsWithGap(page);
    await editor.locator('.inline-editor').first().scrollIntoViewIfNeeded();

    const viewportCenter = await getVerticalCenterFromLocator(
      page.locator('body')
    );
    for (let i = 0; i < headings.length; i++) {
      const lastHeadingCenter = await getVerticalCenterFromLocator(headings[i]);
      await page.mouse.wheel(0, lastHeadingCenter - viewportCenter + 50);
      await expect(indicators.nth(i)).toHaveClass(/active/);
    }
  });

  test('should highlight indicator when click item in outline panel', async ({
    page,
  }) => {
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    const viewer = await toggleTocViewer(page);

    await focusRichTextEnd(page);
    const headings = await createHeadingsWithGap(page);

    const indicators = getIndicators(page);
    await indicators.first().hover({ force: true });

    const headingsInPanel = Array.from({ length: 6 }, (_, i) =>
      viewer.locator(`.h${i + 1} > span`)
    );

    await headingsInPanel[2].click();
    await expect(headings[2]).toBeVisible();
    await expect(indicators.nth(2)).toHaveClass(/active/);
  });

  test('should hide in edgeless mode', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyEdgelessState(page);
    await toggleTocViewer(page);

    const indicators = getIndicators(page);

    await focusRichTextEnd(page);
    await type(page, '# Heading 1');
    await pressEnter(page);

    await expect(indicators).toHaveCount(1);

    await switchEditorMode(page);

    await expect(indicators).toHaveCount(0);
  });

  test('should hide edgeless-only note headings', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyEdgelessState(page);
    const viewer = await toggleTocViewer(page);

    await focusRichTextEnd(page);

    await type(page, '# Heading 1');
    await pressEnter(page);

    await type(page, '## Heading 2');
    await pressEnter(page);

    await switchEditorMode(page);

    await addNote(page, '# Edgeless', 300, 300);

    await switchEditorMode(page);

    const indicators = getIndicators(page);
    await expect(indicators).toHaveCount(2);

    await indicators.first().hover({ force: true });

    await expect(viewer).toBeVisible();
    const hiddenTitle = viewer.locator('.hidden-title');
    await expect(hiddenTitle).toBeHidden();
  });

  test('outline panel toggle button', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    const viewer = await toggleTocViewer(page);

    await focusRichTextEnd(page);
    await createHeadingsWithGap(page);

    const toggleButton = viewer.locator(
      '[data-testid="toggle-outline-panel-button"]'
    );
    await expect(toggleButton).toHaveCount(0);
    await viewer.evaluate((el: OutlineViewer) => {
      el.toggleOutlinePanel = () => {
        noop();
      };
    });

    await waitNextFrame(page);
    await expect(toggleButton).toHaveCount(1);
    await expect(toggleButton).toBeVisible();
  });
});
