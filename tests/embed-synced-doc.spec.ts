import type { DatabaseBlockModel } from '@blocksuite/affine-model';

import { assertExists } from '@blocksuite/global/utils';
import { expect, type Page } from '@playwright/test';
import { switchEditorMode, zoomOutByKeyboard } from 'utils/actions/edgeless.js';
import { getLinkedDocPopover } from 'utils/actions/linked-doc.js';
import {
  enterPlaygroundRoom,
  focusRichText,
  initEmptyEdgelessState,
  initEmptyParagraphState,
  waitNextFrame,
} from 'utils/actions/misc.js';

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

    const switchButton = page.getByRole('button', { name: 'Switch view' });
    await switchButton.click();

    const embedSyncedDocBtn = page.getByRole('button', { name: 'Embed view' });
    await expect(embedSyncedDocBtn).toBeVisible();

    await embedSyncedDocBtn.click();
    await waitNextFrame(page, 200);

    const embedSyncedBlock = page.locator('affine-embed-synced-doc-block');
    expect(await embedSyncedBlock.count()).toBe(1);
  }

  test('can change linked doc to embed synced doc', async ({ page }) => {
    await initEmptyParagraphState(page);
    await focusRichText(page);

    await createAndConvertToEmbedSyncedDoc(page);
  });

  test('can change embed synced doc to card view', async ({ page }) => {
    await initEmptyParagraphState(page);
    await focusRichText(page);

    await createAndConvertToEmbedSyncedDoc(page);

    const syncedDoc = page.locator(`affine-embed-synced-doc-block`);
    const syncedDocBox = await syncedDoc.boundingBox();
    assertExists(syncedDocBox);
    await page.mouse.click(
      syncedDocBox.x + syncedDocBox.width / 2,
      syncedDocBox.y + syncedDocBox.height / 2
    );

    await waitNextFrame(page, 200);
    const toolbar = page.locator('.embed-card-toolbar');
    await expect(toolbar).toBeVisible();

    const switchBtn = toolbar.getByRole('button', { name: 'Switch view' });
    await expect(switchBtn).toBeVisible();

    await switchBtn.click();
    await waitNextFrame(page, 200);

    const cardBtn = toolbar.getByRole('button', { name: 'Card view' });
    await cardBtn.click();
    await waitNextFrame(page, 200);

    const embedSyncedBlock = page.locator('affine-embed-linked-doc-block');
    expect(await embedSyncedBlock.count()).toBe(1);
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

    // Switch to edgeless mode
    await switchEditorMode(page);
    await waitNextFrame(page, 200);
    await page.mouse.click(100, 100);
    await zoomOutByKeyboard(page);

    // Double click on note to enter edit status
    const noteBlock = page.locator('affine-edgeless-note');
    const noteBlockBox = await noteBlock.boundingBox();
    assertExists(noteBlockBox);
    await page.mouse.dblclick(noteBlockBox.x + 10, noteBlockBox.y + 10);
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
    const EmbedSyncedDocBlock = page.locator(
      'affine-embed-edgeless-synced-doc-block'
    );
    const EmbedSyncedDocBlockBox = await EmbedSyncedDocBlock.boundingBox();
    const border = 1;
    assertExists(EmbedSyncedDocBlockBox);
    expect(EmbedSyncedDocBlockBox.height).toBeCloseTo(height + 2 * border, 1);
  });

  test('nested embed synced doc should be rendered as card when depth >=1', async ({
    page,
  }) => {
    await page.evaluate(() => {
      const { doc, collection } = window;
      const rootId = doc.addBlock('affine:page', {
        title: new doc.Text(),
      });

      const noteId = doc.addBlock('affine:note', {}, rootId);
      doc.addBlock('affine:paragraph', {}, noteId);

      const doc2 = collection.createDoc({ id: 'doc2' });
      doc2.load();
      const rootId2 = doc2.addBlock('affine:page', {
        title: new doc.Text('Doc 2'),
      });

      const noteId2 = doc2.addBlock('affine:note', {}, rootId2);
      doc2.addBlock(
        'affine:paragraph',
        {
          text: new doc.Text('Hello from Doc 2'),
        },
        noteId2
      );

      const doc3 = collection.createDoc({ id: 'doc3' });
      doc3.load();
      const rootId3 = doc3.addBlock('affine:page', {
        title: new doc.Text('Doc 3'),
      });

      const noteId3 = doc3.addBlock('affine:note', {}, rootId3);
      doc3.addBlock(
        'affine:paragraph',
        {
          text: new doc.Text('Hello from Doc 3'),
        },
        noteId3
      );

      doc2.addBlock(
        'affine:embed-synced-doc',
        {
          pageId: 'doc3',
        },
        noteId2
      );
      doc.addBlock(
        'affine:embed-synced-doc',
        {
          pageId: 'doc2',
        },
        noteId
      );
    });
    expect(await page.locator('affine-embed-synced-doc-block').count()).toBe(2);
    expect(await page.locator('affine-paragraph').count()).toBe(2);
    expect(await page.locator('affine-embed-synced-doc-card').count()).toBe(1);
    expect(await page.locator('editor-host').count()).toBe(2);
  });

  test.describe('synced doc should be readonly', () => {
    test('synced doc should be readonly', async ({ page }) => {
      await initEmptyParagraphState(page);
      await focusRichText(page);
      await createAndConvertToEmbedSyncedDoc(page);
      const locator = page.locator('affine-embed-synced-doc-block');
      await locator.click();

      const toolbar = page.locator('editor-toolbar');
      const openMenu = toolbar.getByRole('button', { name: 'Open' });
      await openMenu.click();

      const button = toolbar.getByRole('button', { name: 'Open this doc' });
      await button.click();

      await page.evaluate(async () => {
        const { collection } = window;
        const getDocCollection = () => {
          for (const [id, doc] of collection.docs.entries()) {
            if (id === 'doc:home') {
              continue;
            }
            return doc;
          }
          return null;
        };

        const doc2Collection = getDocCollection();
        const doc2 = doc2Collection!.getDoc();
        const [noteBlock] = doc2!.getBlocksByFlavour('affine:note');
        const noteId = noteBlock.id;

        const databaseId = doc2.addBlock(
          'affine:database',
          {
            title: new doc2.Text('Database 1'),
          },
          noteId
        );
        const model = doc2.getBlockById(databaseId) as DatabaseBlockModel;
        await new Promise(resolve => setTimeout(resolve, 100));
        const databaseBlock = document.querySelector('affine-database');
        const databaseService = databaseBlock?.service;
        if (databaseService) {
          databaseService.databaseViewInitEmpty(
            model,
            databaseService.viewPresets.tableViewMeta.type
          );
          databaseService.applyColumnUpdate(model);
        }
      });

      // go back to previous doc
      await page.evaluate(() => {
        const { collection, editor } = window;
        editor.doc = collection.getDoc('doc:home')!;
      });

      const databaseFirstCell = page.locator(
        '.affine-database-column-header.database-row'
      );
      await databaseFirstCell.click({ force: true });
      const indicatorCount = await page
        .locator('affine-drag-indicator')
        .count();
      expect(indicatorCount).toBe(1);
    });
  });
});
