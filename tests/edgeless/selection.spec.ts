import { expect } from '@playwright/test';

import * as actions from '../utils/actions/edgeless.js';
import {
  createShapeElement,
  edgelessCommonSetup,
  getNoteBoundBoxInEdgeless,
  setEdgelessTool,
  Shape,
  switchEditorMode,
} from '../utils/actions/edgeless.js';
import {
  addBasicBrushElement,
  addBasicRectShapeElement,
  dragBetweenCoords,
  enterPlaygroundRoom,
  getBoundingRect,
  initEmptyEdgelessState,
  initThreeNotes,
  initThreeOverlapFilledShapes,
  initThreeParagraphs,
  pasteByKeyboard,
  pressEnter,
  selectAllByKeyboard,
  triggerComponentToolbarAction,
  waitForVirgoStateUpdated,
  waitNextFrame,
} from '../utils/actions/index.js';
import {
  assertBlockCount,
  assertEdgelessHoverRect,
  assertEdgelessSelectedRect,
  assertSelectionInNote,
} from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

test('should update rect of selection when resizing viewport', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await actions.switchEditorMode(page);

  await addBasicRectShapeElement(page, { x: 100, y: 100 }, { x: 200, y: 200 });
  await dragBetweenCoords(page, { x: 120, y: 90 }, { x: 220, y: 130 });

  const selectedRectClass = '.affine-edgeless-selected-rect';

  await actions.zoomResetByKeyboard(page);

  await assertEdgelessSelectedRect(page, [100, 100, 100, 100]);

  await actions.decreaseZoomLevel(page);
  await waitNextFrame(page);
  await actions.decreaseZoomLevel(page);
  await waitNextFrame(page);
  const selectedRectInZoom = await getBoundingRect(page, selectedRectClass);
  await assertEdgelessSelectedRect(page, [
    selectedRectInZoom.x,
    selectedRectInZoom.y,
    50,
    50,
  ]);

  await actions.switchEditorEmbedMode(page);
  await waitNextFrame(page);
  const selectedRectInEmbed = await getBoundingRect(page, selectedRectClass);
  await assertEdgelessSelectedRect(page, [
    selectedRectInEmbed.x,
    selectedRectInEmbed.y,
    50,
    50,
  ]);

  await actions.switchEditorEmbedMode(page);
  await actions.increaseZoomLevel(page);
  await waitNextFrame(page);
  await actions.increaseZoomLevel(page);
  await waitNextFrame(page);
  await assertEdgelessSelectedRect(page, [100, 100, 100, 100]);
});

test('select multiple shapes and translate', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);

  await switchEditorMode(page);

  await addBasicBrushElement(page, { x: 100, y: 100 }, { x: 200, y: 200 });
  await page.mouse.move(110, 110);
  await assertEdgelessHoverRect(page, [98, 98, 104, 104]);

  await addBasicRectShapeElement(page, { x: 210, y: 110 }, { x: 310, y: 210 });
  await page.mouse.move(220, 120);
  await assertEdgelessHoverRect(page, [210, 110, 100, 100]);

  await dragBetweenCoords(page, { x: 120, y: 90 }, { x: 220, y: 130 });
  await assertEdgelessSelectedRect(page, [98, 98, 212, 112]);

  await dragBetweenCoords(page, { x: 120, y: 120 }, { x: 150, y: 150 });
  await assertEdgelessSelectedRect(page, [128, 128, 212, 112]);

  await page.mouse.move(160, 160);
  await assertEdgelessHoverRect(page, [128, 128, 104, 104]);

  await page.mouse.move(250, 150);
  await assertEdgelessHoverRect(page, [240, 140, 100, 100]);
});

test('selection box of shape element sync on fast dragging', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  await setEdgelessTool(page, 'shape');
  await dragBetweenCoords(page, { x: 100, y: 100 }, { x: 200, y: 200 });
  await setEdgelessTool(page, 'default');
  await dragBetweenCoords(
    page,
    { x: 110, y: 110 },
    { x: 660, y: 460 },
    { click: true }
  );

  await assertEdgelessSelectedRect(page, [650, 447.5, 100, 100]);
});

test('when the selection is always a note, it should remain in an active state', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  const ids = await initEmptyEdgelessState(page);
  await initThreeParagraphs(page);

  await switchEditorMode(page);
  const bound = await getNoteBoundBoxInEdgeless(page, ids.noteId);

  await setEdgelessTool(page, 'note');

  const newNoteX = bound.x;
  const newNoteY = bound.y + bound.height + 100;
  // add text
  await page.mouse.click(newNoteX, newNoteY);
  await waitForVirgoStateUpdated(page);
  await page.keyboard.type('hello');
  await pressEnter(page);
  // should wait for virgo update and resizeObserver callback
  await waitNextFrame(page);
  // assert add text success
  await assertEdgelessSelectedRect(page, [46, 597.5, 448, 128]);

  await page.mouse.click(bound.x + 10, bound.y + 10);
  await assertSelectionInNote(page, ids.noteId);
});

test('copy to clipboard as PNG', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);

  await edgelessCommonSetup(page);
  await createShapeElement(page, [0, 0], [100, 100], Shape.Square);

  await selectAllByKeyboard(page);

  await page.pause();
  await triggerComponentToolbarAction(page, 'copyAsPng');

  await waitNextFrame(page);

  await assertBlockCount(page, 'note', 0);
  await pasteByKeyboard(page);
  await waitNextFrame(page);
  await page.pause();
  await assertBlockCount(page, 'note', 1);
});
