import {
  addBasicRectShapeElement,
  dragBetweenCoords,
  enterPlaygroundRoom,
  initEmptyEdgelessState,
  rotateElementByHandle,
  switchEditorMode,
} from '../utils/actions/index.js';
import {
  assertEdgelessSelectedRect,
  assertEdgelessSelectedRectRotation,
} from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

test.describe('rotation', () => {
  test('single shape', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyEdgelessState(page);
    await switchEditorMode(page);

    await addBasicRectShapeElement(
      page,
      { x: 100, y: 100 },
      { x: 200, y: 200 }
    );
    await assertEdgelessSelectedRect(page, [100, 100, 100, 100]);

    await rotateElementByHandle(page, 45, 'top-right');

    await assertEdgelessSelectedRectRotation(page, 45);
  });

  test('multiple shapes', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyEdgelessState(page);
    await switchEditorMode(page);

    await addBasicRectShapeElement(
      page,
      { x: 100, y: 100 },
      { x: 200, y: 200 }
    );
    await addBasicRectShapeElement(
      page,
      { x: 200, y: 100 },
      { x: 300, y: 200 }
    );

    await dragBetweenCoords(page, { x: 90, y: 90 }, { x: 310, y: 110 });
    await assertEdgelessSelectedRect(page, [100, 100, 200, 100]);

    await rotateElementByHandle(page, 90, 'bottom-right');

    await assertEdgelessSelectedRectRotation(page, 90);
  });
});
