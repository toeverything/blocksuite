import * as actions from '../utils/actions/edgeless.js';
import {
  getFrameBoundBoxInEdgeless,
  setMouseMode,
  switchEditorMode,
} from '../utils/actions/edgeless.js';
import {
  addBasicBrushElement,
  addBasicRectShapeElement,
  clickInCenter,
  dragBetweenCoords,
  enterPlaygroundRoom,
  getBoundingRect,
  initEmptyEdgelessState,
  initThreeParagraphs,
  pressEnter,
  resizeElementByTopLeftHandle,
  waitForVirgoStateUpdated,
  waitNextFrame,
} from '../utils/actions/index.js';
import {
  assertEdgelessHoverRect,
  assertEdgelessSelectedRect,
  assertSelectionInFrame,
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

  await assertEdgelessSelectedRect(page, [100, 100, 100, 100]);
  await actions.decreaseZoomLevel(page);
  await actions.decreaseZoomLevel(page);
  await waitNextFrame(page);

  const selectedRectInZoom = await getBoundingRect(page, selectedRectClass);

  await page.mouse.click(0, 0);
  await clickInCenter(page, selectedRectInZoom);
  await assertEdgelessSelectedRect(page, [
    selectedRectInZoom.x,
    selectedRectInZoom.y,
    50,
    50,
  ]);

  await actions.switchEditorEmbedMode(page);

  const selectedRectInEmbed = await getBoundingRect(page, selectedRectClass);

  await page.mouse.click(0, 0);
  await clickInCenter(page, selectedRectInEmbed);
  await assertEdgelessSelectedRect(page, [
    selectedRectInEmbed.x,
    selectedRectInEmbed.y,
    50,
    50,
  ]);

  await actions.switchEditorEmbedMode(page);
  await assertEdgelessSelectedRect(page, [
    selectedRectInZoom.x,
    selectedRectInZoom.y,
    50,
    50,
  ]);

  await actions.increaseZoomLevel(page);
  await actions.increaseZoomLevel(page);
  await waitNextFrame(page);
  await assertEdgelessSelectedRect(page, [100, 100, 100, 100]);
});

test('select multiple shapes and resize', async ({ page }) => {
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

  await resizeElementByTopLeftHandle(page, { x: 50, y: 50 });
  await assertEdgelessSelectedRect(page, [148, 148, 162, 62]);

  await page.mouse.move(160, 160);
  await assertEdgelessHoverRect(page, [148, 148, 79, 57.5]);

  await page.mouse.move(260, 160);
  await assertEdgelessHoverRect(page, [234, 155, 76, 55]);
});

test('select multiple shapes and resize to negative', async ({ page }) => {
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

  await resizeElementByTopLeftHandle(page, { x: 400, y: 300 }, 30);
  await assertEdgelessSelectedRect(page, [310, 210, 188, 188]);

  await page.mouse.move(450, 300);
  await assertEdgelessHoverRect(page, [406, 223, 92, 174.5]);

  await page.mouse.move(320, 220);
  await assertEdgelessHoverRect(page, [310, 210, 88.6, 167.8]);
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

  await page.mouse.move(260, 160);
  await assertEdgelessHoverRect(page, [240, 140, 100, 100]);
});

test('selection box of shape element sync on fast dragging', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  await setMouseMode(page, 'shape');
  await dragBetweenCoords(page, { x: 100, y: 100 }, { x: 200, y: 200 });
  await setMouseMode(page, 'default');
  await dragBetweenCoords(
    page,
    { x: 150, y: 150 },
    { x: 700, y: 500 },
    { click: true }
  );

  await assertEdgelessHoverRect(page, [650, 450, 100, 100]);
});

test('when the selection is always a frame, it should remain in an active state', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  const ids = await initEmptyEdgelessState(page);
  await initThreeParagraphs(page);

  await switchEditorMode(page);
  const bound = await getFrameBoundBoxInEdgeless(page, ids.frameId);

  await setMouseMode(page, 'note');

  const newFrameX = bound.x;
  const newFrameY = bound.y + bound.height + 100;
  // add text
  await page.mouse.click(newFrameX, newFrameY);
  await waitForVirgoStateUpdated(page);
  await page.keyboard.type('hello');
  await pressEnter(page);
  // should wait for virgo update and resizeObserver callback
  await waitNextFrame(page);
  // assert add text success
  await assertEdgelessSelectedRect(page, [46, 410, 448, 112]);

  await page.mouse.click(bound.x + 10, bound.y + 10);
  await assertSelectionInFrame(page, ids.frameId);
});
