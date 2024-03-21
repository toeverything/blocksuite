import { assertExists } from '@global/utils.js';
import { expect, type Page } from '@playwright/test';
import { switchEditorMode, zoomOutByKeyboard } from 'utils/actions/edgeless.js';
import { pressEnter, type } from 'utils/actions/keyboard.js';
import { getLinkedDocPopover } from 'utils/actions/linked-doc.js';
import {
  enterPlaygroundRoom,
  focusRichText,
  initEmptyEdgelessState,
  initEmptyParagraphState,
  waitNextFrame,
} from 'utils/actions/misc.js';
import { assertTitle } from 'utils/asserts.js';

import { test } from './utils/playwright.js';

test.describe('Embed synced doc', () => {
  test.beforeEach(async ({ page }) => {
    await enterPlaygroundRoom(page);
  });

  async function createAndConvertToEmbedSyncedDoc(page: Page) {
    const { createLinkedDoc } = getLinkedDocPopover(page);
    const linkedDoc = await createLinkedDoc('page1');
    const lickedDocBox = await linkedDoc.boundingBox();
    assertExists(lickedDocBox);
    await page.mouse.move(
      lickedDocBox.x + lickedDocBox.width / 2,
      lickedDocBox.y + lickedDocBox.height / 2
    );

    await waitNextFrame(page, 200);
    const referencePopup = page.locator('.affine-reference-popover-container');
    await expect(referencePopup).toBeVisible();

    const embedSyncedDocBtn = page.locator(
      '.affine-reference-popover-view-selector-button.embed-view'
    );
    await expect(embedSyncedDocBtn).toBeVisible();

    await embedSyncedDocBtn.click();
    await waitNextFrame(page, 200);

    const embedSyncedBlock = page.locator('affine-embed-synced-doc-block');
    expect(await embedSyncedBlock.count()).toBe(1);
  }

  async function typeParagraphs(page: Page, count: number) {
    for (let i = 0; i < count; i++) {
      await type(page, 'Hello');
      await pressEnter(page);
    }
  }

  test('can change linked doc to embed synced doc', async ({ page }) => {
    await initEmptyParagraphState(page);
    await focusRichText(page);

    await createAndConvertToEmbedSyncedDoc(page);
  });

  test('drag embed synced doc to whiteboard should fit in height', async ({
    page,
  }) => {
    await initEmptyEdgelessState(page);
    await focusRichText(page);

    await createAndConvertToEmbedSyncedDoc(page);

    // Focus on the embed synced doc
    const embedSyncedBlock = page.locator('affine-embed-synced-doc-block');
    let embedSyncedBox = await embedSyncedBlock.boundingBox();
    assertExists(embedSyncedBox);
    await page.mouse.click(
      embedSyncedBox.x + embedSyncedBox.width / 2,
      embedSyncedBox.y + embedSyncedBox.height / 2
    );

    // Type some text to make the embed synced doc has some height
    await typeParagraphs(page, 12);
    await waitNextFrame(page, 200);

    // Switch to edgeless mode
    await switchEditorMode(page);
    await waitNextFrame(page, 200);
    await page.mouse.click(100, 100);
    await zoomOutByKeyboard(page);

    // Double click on note to enter edit status
    const notePortal = page.locator('.edgeless-block-portal-note');
    const notePortalBox = await notePortal.boundingBox();
    assertExists(notePortalBox);
    await page.mouse.dblclick(notePortalBox.x + 10, notePortalBox.y + 10);
    await waitNextFrame(page, 200);

    // Drag the embed synced doc to whiteboard
    embedSyncedBox = await embedSyncedBlock.boundingBox();
    assertExists(embedSyncedBox);
    const height = embedSyncedBox.height;
    await page.mouse.move(embedSyncedBox.x - 10, embedSyncedBox.y - 100);
    await page.mouse.move(embedSyncedBox.x - 10, embedSyncedBox.y + 10);
    await waitNextFrame(page);
    await page.mouse.down();
    await page.mouse.move(100, 200, { steps: 30 });
    await page.mouse.up();

    // Check the height of the embed synced doc portal, it should be the same as the embed synced doc in note
    const EmbedSyncedDocPortal = page.locator('.edgeless-block-portal-embed');
    const EmbedSyncedDocPortalBox = await EmbedSyncedDocPortal.boundingBox();
    assertExists(EmbedSyncedDocPortalBox);
    expect(EmbedSyncedDocPortalBox.height).toBe(height);
  });

  test('can jump to other docs when click linked doc inside embed synced doc block', async ({
    page,
  }) => {
    await initEmptyParagraphState(page);
    await focusRichText(page);

    await createAndConvertToEmbedSyncedDoc(page);

    // Focus on the embed synced doc
    const embedSyncedBlock = page.locator('affine-embed-synced-doc-block');
    const embedSyncedBox = await embedSyncedBlock.boundingBox();
    assertExists(embedSyncedBox);
    await page.mouse.click(
      embedSyncedBox.x + embedSyncedBox.width / 2,
      embedSyncedBox.y + embedSyncedBox.height / 2
    );

    // Create a linked doc inside the embed synced doc
    await type(page, '@');
    await type(page, 'Linked Doc');
    await pressEnter(page);
    const refNode = page.locator(`affine-reference`, {
      has: page.locator(`.affine-reference-title[data-title="Linked Doc"]`),
    });
    await expect(refNode).toBeVisible();
    // Click the linked doc inside the embed synced doc to jump to the linked doc
    await refNode.click();
    await waitNextFrame(page, 200);

    await assertTitle(page, 'Linked Doc');
  });
});
