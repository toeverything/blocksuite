import { type Locator, type Page, expect } from '@playwright/test';
import { addNote, switchEditorMode } from 'utils/actions/edgeless.js';
import { pressBackspace, pressEnter, type } from 'utils/actions/keyboard.js';
import {
  enterPlaygroundRoom,
  focusRichTextEnd,
  focusTitle,
  getEditorHostLocator,
  getEditorLocator,
  initEmptyEdgelessState,
  initEmptyParagraphState,
  waitNextFrame,
} from 'utils/actions/misc.js';

import { test } from '../utils/playwright.js';

async function getVerticalCenterFromLocator(locator: Locator) {
  const rect = await locator.boundingBox();
  return rect!.y + rect!.height / 2;
}

async function createHeadingsWithGap(page: Page) {
  // heading 1 to 6
  const editor = getEditorHostLocator(page);

  const headings: Locator[] = [];
  await pressEnter(page, 10);
  for (let i = 1; i <= 6; i++) {
    await type(page, `${'#'.repeat(i)} `);
    await type(page, `Heading ${i}`);
    const heading = editor.locator(`.h${i}`);
    await expect(heading).toBeVisible();
    headings.push(heading);
    await pressEnter(page, 10);
  }
  await pressEnter(page, 10);

  return headings;
}

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

  // TODO(@L-Sun) test other function like enable sorting, show icons, etc
});

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
});
