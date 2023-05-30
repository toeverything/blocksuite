import {
  decreaseZoomLevel,
  increaseZoomLevel,
  switchEditorEmbedMode,
  switchEditorMode,
} from '../utils/actions/edgeless.js';
import {
  addBasicRectShapeElement,
  dragBetweenCoords,
  enterPlaygroundRoom,
  initEmptyEdgelessState,
} from '../utils/actions/index.js';
import {
  assertEdgelessNonSelectedRect,
  assertEdgelessSelectedRect,
} from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

test('should update rect of selection when resizing viewport', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  await addBasicRectShapeElement(page, { x: 100, y: 100 }, { x: 200, y: 200 });

  await dragBetweenCoords(page, { x: 120, y: 90 }, { x: 220, y: 130 });
  await assertEdgelessSelectedRect(page, [100, 100, 100, 100]);

  await decreaseZoomLevel(page);
  await decreaseZoomLevel(page);

  const div = page.locator('.affine-edgeless-selected-rect');

  const selectedRect0 = await div.boundingBox();
  if (!selectedRect0) {
    throw new Error('Missing .affine-edgeless-selected-rect');
  }

  await page.mouse.click(0, 0);
  await assertEdgelessNonSelectedRect(page);

  await page.mouse.click(
    selectedRect0.x + selectedRect0.width / 2,
    selectedRect0.y + selectedRect0.height / 2
  );
  await assertEdgelessSelectedRect(page, [
    selectedRect0.x,
    selectedRect0.y,
    50,
    50,
  ]);

  await switchEditorEmbedMode(page);

  const selectedRect1 = await div.boundingBox();
  if (!selectedRect1) {
    throw new Error('Missing .affine-edgeless-selected-rect');
  }

  await page.mouse.click(0, 0);
  await assertEdgelessNonSelectedRect(page);

  await page.mouse.click(
    selectedRect1.x + selectedRect1.width / 2,
    selectedRect1.y + selectedRect1.height / 2
  );
  await assertEdgelessSelectedRect(page, [
    selectedRect1.x,
    selectedRect1.y,
    50,
    50,
  ]);

  await switchEditorEmbedMode(page);

  await assertEdgelessSelectedRect(page, [
    selectedRect0.x,
    selectedRect0.y,
    50,
    50,
  ]);

  await increaseZoomLevel(page);
  await increaseZoomLevel(page);

  await assertEdgelessSelectedRect(page, [100, 100, 100, 100]);
});
