import { assertExists } from '@blocksuite/global/utils';
import { expect } from '@playwright/test';

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
import { assertEdgelessSelectedRect } from '../utils/asserts.js';
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

  await assertEdgelessSelectedRect(page, [275, 200, 50, 50]);

  await switchEditorEmbedMode(page);

  await assertEdgelessSelectedRect(page, [291, 210, 50, 50]);

  await switchEditorEmbedMode(page);

  await assertEdgelessSelectedRect(page, [275, 200, 50, 50]);

  await increaseZoomLevel(page);
  await increaseZoomLevel(page);

  await assertEdgelessSelectedRect(page, [100, 100, 100, 100]);
});
