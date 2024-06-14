import { expect, type Page } from '@playwright/test';

import { clickView, moveView } from '../utils/actions/click.js';
import { dragBetweenCoords } from '../utils/actions/drag.js';
import {
  addNote,
  changeEdgelessNoteBackground,
  changeShapeFillColor,
  changeShapeStrokeColor,
  createShapeElement,
  deleteAll,
  dragBetweenViewCoords,
  edgelessCommonSetup,
  getEdgelessSelectedRectModel,
  Shape,
  switchEditorMode,
  toViewCoord,
  triggerComponentToolbarAction,
} from '../utils/actions/edgeless.js';
import {
  enterPlaygroundRoom,
  initEmptyEdgelessState,
  waitForInlineEditorStateUpdated,
  waitNextFrame,
} from '../utils/actions/misc.js';
import {
  assertConnectorStrokeColor,
  assertEdgelessCanvasText,
  assertEdgelessNoteBackground,
  assertExists,
  assertRichTexts,
  assertSelectedBound,
} from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

function getAutoCompletePanelButton(page: Page, type: string) {
  return page
    .locator('.auto-complete-panel-container')
    .locator('edgeless-tool-icon-button')
    .filter({ hasText: `${type}` });
}

test.describe('auto-complete', () => {
  test.describe('click on auto-complete button', () => {
    test('click on right auto-complete button', async ({ page }) => {
      await edgelessCommonSetup(page);
      await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
      await assertSelectedBound(page, [0, 0, 100, 100]);
      await clickView(page, [120, 50]);
      await assertSelectedBound(page, [200, 0, 100, 100]);
    });
    test('click on bottom auto-complete button', async ({ page }) => {
      await edgelessCommonSetup(page);
      await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
      await assertSelectedBound(page, [0, 0, 100, 100]);
      await clickView(page, [50, 120]);
      await assertSelectedBound(page, [0, 200, 100, 100]);
    });
    test('click on left auto-complete button', async ({ page }) => {
      await edgelessCommonSetup(page);
      await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
      await assertSelectedBound(page, [0, 0, 100, 100]);
      await clickView(page, [-20, 50]);
      await assertSelectedBound(page, [-200, 0, 100, 100]);
    });
    test('click on top auto-complete button', async ({ page }) => {
      await edgelessCommonSetup(page);
      await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
      await assertSelectedBound(page, [0, 0, 100, 100]);
      await clickView(page, [50, -20]);
      await assertSelectedBound(page, [0, -200, 100, 100]);
    });

    test('click on note auto-complete button', async ({ page }) => {
      await edgelessCommonSetup(page);
      await addNote(page, 'note', 100, 100);
      await page.mouse.click(600, 50);
      await page.mouse.click(300, 50);
      await page.mouse.click(150, 120);
      const rect = await getEdgelessSelectedRectModel(page);
      await moveView(page, [rect[0] + rect[2] + 30, rect[1] + rect[3] / 2]);
      await clickView(page, [rect[0] + rect[2] + 30, rect[1] + rect[3] / 2]);
      const newRect = await getEdgelessSelectedRectModel(page);
      expect(rect[0]).not.toEqual(newRect[0]);
      expect(rect[1]).toEqual(newRect[1]);
      expect(rect[2]).toEqual(newRect[2]);
      expect(rect[3]).toEqual(newRect[3]);
    });
  });

  test.describe('drag on auto-complete button', () => {
    test('drag on right auto-complete button to add shape', async ({
      page,
    }) => {
      await edgelessCommonSetup(page);
      await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
      await assertSelectedBound(page, [0, 0, 100, 100]);
      await dragBetweenViewCoords(page, [120, 50], [200, 0]);

      const ellipseButton = getAutoCompletePanelButton(page, 'ellipse');
      await expect(ellipseButton).toBeVisible();
      await ellipseButton.click();

      await assertSelectedBound(page, [200, -50, 100, 100]);
    });

    test('drag on right auto-complete button to add canvas text', async ({
      page,
    }) => {
      await enterPlaygroundRoom(page, {
        flags: {
          enable_edgeless_text: false,
        },
      });
      await initEmptyEdgelessState(page);
      await switchEditorMode(page);
      await deleteAll(page);
      await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
      await assertSelectedBound(page, [0, 0, 100, 100]);
      await dragBetweenViewCoords(page, [120, 50], [200, 0]);

      const canvasTextButton = getAutoCompletePanelButton(page, 'text');
      await expect(canvasTextButton).toBeVisible();
      await canvasTextButton.click();

      await waitForInlineEditorStateUpdated(page);
      await waitNextFrame(page);
      await page.keyboard.type('hello');
      await assertEdgelessCanvasText(page, 'hello');
    });

    test('drag on right auto-complete button to add note', async ({ page }) => {
      await edgelessCommonSetup(page);
      await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
      await assertSelectedBound(page, [0, 0, 100, 100]);
      await triggerComponentToolbarAction(page, 'changeShapeStrokeColor');
      const lineColor = '--affine-palette-line-red';
      await changeShapeStrokeColor(page, lineColor);
      await triggerComponentToolbarAction(page, 'changeShapeFillColor');
      const color = '--affine-palette-shape-green';
      await changeShapeFillColor(page, color);
      await dragBetweenViewCoords(page, [120, 50], [200, 0]);

      const noteButton = getAutoCompletePanelButton(page, 'note');
      await expect(noteButton).toBeVisible();
      await noteButton.click();
      await waitNextFrame(page);

      const portalNote = page.locator('.edgeless-block-portal-note');

      expect(await portalNote.locator('affine-note').count()).toBe(1);
      const [x, y] = await toViewCoord(page, [240, 0]);
      await page.mouse.click(x, y);
      await page.keyboard.type('hello');
      await waitNextFrame(page);
      await assertRichTexts(page, ['hello']);

      const noteId = await page.evaluate(() => {
        const note = document.body.querySelector('affine-note');
        return note?.getAttribute('data-block-id');
      });
      assertExists(noteId);
      await assertEdgelessNoteBackground(
        page,
        noteId,
        '--affine-note-background-green'
      );

      const rect = await portalNote.boundingBox();
      assertExists(rect);

      // blur note block
      await page.mouse.click(rect.x + rect.width / 2, rect.y + rect.height * 3);
      await waitNextFrame(page);

      // select connector
      await dragBetweenViewCoords(page, [140, 50], [160, 0]);
      await waitNextFrame(page);
      await assertConnectorStrokeColor(page, lineColor);

      // select note block
      await page.mouse.click(rect.x + rect.width / 2, rect.y + rect.height / 2);
      await waitNextFrame(page);

      await triggerComponentToolbarAction(page, 'changeNoteColor');
      const noteColor = '--affine-note-background-red';
      await changeEdgelessNoteBackground(page, noteColor);

      // move to arrow icon
      await page.mouse.move(
        rect.x + rect.width + 20,
        rect.y + rect.height / 2,
        { steps: 5 }
      );
      await waitNextFrame(page);

      // drag arrow
      await dragBetweenCoords(
        page,
        {
          x: rect.x + rect.width + 20,
          y: rect.y + rect.height / 2,
        },
        {
          x: rect.x + rect.width + 20 + 50,
          y: rect.y + rect.height / 2 + 50,
        }
      );

      // `Add a same object` button has the same type.
      const noteButton2 = getAutoCompletePanelButton(page, 'note').nth(0);
      await expect(noteButton2).toBeVisible();
      await noteButton2.click();
      await waitNextFrame(page);

      const noteId2 = await page.evaluate(() => {
        const note = document.body.querySelectorAll('affine-note')[1];
        return note?.getAttribute('data-block-id');
      });
      assertExists(noteId2);
      await assertEdgelessNoteBackground(page, noteId, noteColor);

      expect(await portalNote.locator('affine-note').count()).toBe(2);
    });

    test('drag on right auto-complete button to add frame', async ({
      page,
    }) => {
      await edgelessCommonSetup(page);
      await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
      await assertSelectedBound(page, [0, 0, 100, 100]);
      await dragBetweenViewCoords(page, [120, 50], [200, 0]);

      expect(await page.locator('.affine-frame-container').count()).toBe(0);

      const frameButton = getAutoCompletePanelButton(page, 'frame');
      await expect(frameButton).toBeVisible();
      await frameButton.click();

      expect(await page.locator('.affine-frame-container').count()).toBe(1);
    });
  });
});
