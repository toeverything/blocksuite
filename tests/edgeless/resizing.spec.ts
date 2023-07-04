import { switchEditorMode } from '../utils/actions/edgeless.js';
import {
  addBasicBrushElement,
  addBasicRectShapeElement,
  dragBetweenCoords,
  enterPlaygroundRoom,
  initEmptyEdgelessState,
  resizeElementByHandle,
} from '../utils/actions/index.js';
import {
  assertEdgelessHoverRect,
  assertEdgelessSelectedRect,
} from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

test.describe('resizing shapes and aspect ratio will be maintained', () => {
  test('positive adjustment', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyEdgelessState(page);
    await switchEditorMode(page);

    await addBasicBrushElement(page, { x: 100, y: 100 }, { x: 200, y: 200 });
    await page.mouse.move(110, 110);
    await assertEdgelessHoverRect(page, [98, 98, 104, 104]);

    await addBasicRectShapeElement(
      page,
      { x: 210, y: 110 },
      { x: 310, y: 210 }
    );
    await page.mouse.move(220, 120);
    await assertEdgelessHoverRect(page, [210, 110, 100, 100]);

    await dragBetweenCoords(page, { x: 120, y: 90 }, { x: 220, y: 130 });
    await assertEdgelessSelectedRect(page, [98, 98, 212, 112]);

    // const x = 100;
    // const y = 100;
    // const w = 210;
    // const h = 110;
    // const p = w / h;
    // const dx = 50;
    // const dy = 50 / p;
    // [x + dx - 2, y + dy - 2, w - dx + 2, h - dy + 2];

    await resizeElementByHandle(page, { x: 50, y: 50 });
    await assertEdgelessSelectedRect(page, [148, 124.19, 162, 85.81]);

    await page.mouse.move(160, 160);
    await assertEdgelessSelectedRect(page, [148, 124.19, 162, 85.81]);

    await page.mouse.move(260, 160);
    await assertEdgelessSelectedRect(page, [148, 124.19, 162, 85.81]);
  });

  test('negative adjustment', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyEdgelessState(page);
    await switchEditorMode(page);

    await addBasicBrushElement(page, { x: 100, y: 100 }, { x: 200, y: 200 });
    await page.mouse.move(110, 110);
    await assertEdgelessHoverRect(page, [98, 98, 104, 104]);

    await addBasicRectShapeElement(
      page,
      { x: 210, y: 110 },
      { x: 310, y: 210 }
    );
    await page.mouse.move(220, 120);
    await assertEdgelessHoverRect(page, [210, 110, 100, 100]);

    await dragBetweenCoords(page, { x: 120, y: 90 }, { x: 220, y: 130 });
    await assertEdgelessSelectedRect(page, [98, 98, 212, 112]);

    // const x = 100;
    // const y = 100;
    // const w = 210;
    // const h = 110;
    // const p = w / h;
    // const minX = x + w = 100 + 210 = 310;
    // const minY = y + h = 100 + 110 = 210;
    // const tx = x + 400 = 500
    // const ty = y + 300 = 400
    // const nh = 400 - 210 = 190 - 2 = 188
    // const nw = 188 * p = 358 - 2 = 356

    await resizeElementByHandle(page, { x: 400, y: 300 }, 'top-left', 30);
    await assertEdgelessSelectedRect(page, [310, 210, 356, 188]);

    await page.mouse.move(450, 300);
    await assertEdgelessSelectedRect(page, [310, 210, 356, 188]);

    await page.mouse.move(320, 220);
    await assertEdgelessSelectedRect(page, [310, 210, 356, 188]);
  });
});
