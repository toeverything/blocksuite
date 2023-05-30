import * as actions from '../utils/actions/edgeless.js';
import {
  addBasicRectShapeElement,
  clickInCenter,
  dragBetweenCoords,
  enterPlaygroundRoom,
  getBoundingRect,
  initEmptyEdgelessState,
} from '../utils/actions/index.js';
import { assertEdgelessSelectedRect } from '../utils/asserts.js';
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

  let selectedRect = await getBoundingRect(page, selectedRectClass);

  await page.mouse.click(0, 0);
  await clickInCenter(page, selectedRect);
  await assertEdgelessSelectedRect(page, [
    selectedRect.x,
    selectedRect.y,
    50,
    50,
  ]);

  await actions.switchEditorEmbedMode(page);

  selectedRect = await getBoundingRect(page, selectedRectClass);

  await page.mouse.click(0, 0);
  await clickInCenter(page, selectedRect);
  await assertEdgelessSelectedRect(page, [
    selectedRect.x,
    selectedRect.y,
    50,
    50,
  ]);

  await actions.switchEditorEmbedMode(page);
  await assertEdgelessSelectedRect(page, [
    selectedRect.x,
    selectedRect.y,
    50,
    50,
  ]);

  await actions.increaseZoomLevel(page);
  await actions.increaseZoomLevel(page);
  await assertEdgelessSelectedRect(page, [100, 100, 100, 100]);
});
