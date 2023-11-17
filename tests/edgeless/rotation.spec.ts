import {
  addBasicRectShapeElement,
  dragBetweenCoords,
  enterPlaygroundRoom,
  initEmptyEdgelessState,
  resizeElementByHandle,
  rotateElementByHandle,
  switchEditorMode,
} from '../utils/actions/index.js';
import {
  assertEdgelessSelectedRect,
  assertEdgelessSelectedRectRotation,
} from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

test.describe('rotation', () => {
  test('angle adjustment by four corners', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyEdgelessState(page);
    await switchEditorMode(page);

    await addBasicRectShapeElement(
      page,
      { x: 100, y: 100 },
      { x: 200, y: 200 }
    );

    await rotateElementByHandle(page, 45, 'top-left');
    await assertEdgelessSelectedRectRotation(page, 45);

    await rotateElementByHandle(page, 45, 'top-right');
    await assertEdgelessSelectedRectRotation(page, 90);

    await rotateElementByHandle(page, 45, 'bottom-right');
    await assertEdgelessSelectedRectRotation(page, 135);

    await rotateElementByHandle(page, 45, 'bottom-left');
    await assertEdgelessSelectedRectRotation(page, 180);
  });

  test('angle snap', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyEdgelessState(page);
    await switchEditorMode(page);

    await addBasicRectShapeElement(
      page,
      { x: 100, y: 100 },
      { x: 200, y: 200 }
    );

    await page.keyboard.down('Shift');

    await rotateElementByHandle(page, 5);
    await assertEdgelessSelectedRectRotation(page, 0);

    await rotateElementByHandle(page, 10);
    await assertEdgelessSelectedRectRotation(page, 15);

    await rotateElementByHandle(page, 10);
    await assertEdgelessSelectedRectRotation(page, 30);

    await rotateElementByHandle(page, 10);
    await assertEdgelessSelectedRectRotation(page, 45);

    await rotateElementByHandle(page, 5);
    await assertEdgelessSelectedRectRotation(page, 45);

    await page.keyboard.up('Shift');
  });

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
    await assertEdgelessSelectedRect(page, [88, 88, 224, 124]);

    await rotateElementByHandle(page, 90, 'bottom-right');
    await assertEdgelessSelectedRectRotation(page, 0);
    await assertEdgelessSelectedRect(page, [138, 38, 124, 224]);
  });

  test('combination with resizing', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyEdgelessState(page);
    await switchEditorMode(page);

    await addBasicRectShapeElement(
      page,
      { x: 100, y: 100 },
      { x: 200, y: 200 }
    );
    await rotateElementByHandle(page, 90, 'bottom-left');
    await assertEdgelessSelectedRectRotation(page, 90);

    await resizeElementByHandle(page, { x: 10, y: -10 }, 'bottom-right');
    await assertEdgelessSelectedRect(page, [110, 100, 90, 90]);

    await rotateElementByHandle(page, -90, 'bottom-right');
    await assertEdgelessSelectedRectRotation(page, 0);

    await resizeElementByHandle(page, { x: 10, y: 10 }, 'bottom-right');
    await assertEdgelessSelectedRect(page, [110, 100, 100, 100]);
  });

  test('combination with resizing for multiple shapes', async ({ page }) => {
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
    await assertEdgelessSelectedRect(page, [88, 88, 224, 124]);

    await rotateElementByHandle(page, 90, 'bottom-left');
    await assertEdgelessSelectedRectRotation(page, 0);
    await assertEdgelessSelectedRect(page, [138, 38, 124, 224]);

    await resizeElementByHandle(page, { x: -10, y: -20 }, 'bottom-right');
    await assertEdgelessSelectedRect(page, [138, 38, 114, 204]);

    await rotateElementByHandle(page, -90, 'bottom-right');
    await assertEdgelessSelectedRectRotation(page, 0);
    await assertEdgelessSelectedRect(page, [93, 83, 204, 114]);

    await resizeElementByHandle(page, { x: 20, y: 10 }, 'bottom-right');
    await assertEdgelessSelectedRect(page, [93, 83, 224, 124]);
  });
});
