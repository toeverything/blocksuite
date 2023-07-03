import { dragBetweenCoords } from '../utils/actions/drag.js';
import {
  addBasicRectShapeElement,
  deleteAll,
  switchEditorMode,
} from '../utils/actions/edgeless.js';
import {
  enterPlaygroundRoom,
  initEmptyEdgelessState,
} from '../utils/actions/misc.js';
import { waitNextFrame } from '../utils/actions/misc.js';
import { assertEdgelessHoverRect } from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

test('snap', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  await deleteAll(page);

  await addBasicRectShapeElement(page, { x: 0, y: 0 }, { x: 100, y: 100 });
  await addBasicRectShapeElement(
    page,
    { x: 200, y: 6 },
    { x: 200 + 100, y: 6 + 100 }
  );

  await assertEdgelessHoverRect(page, [200, 6, 100, 100]);
  await dragBetweenCoords(
    page,
    {
      x: 291,
      y: 97,
    },
    {
      x: 291,
      y: 91,
    }
  );
  await assertEdgelessHoverRect(page, [200, 0, 100, 100]);
  await waitNextFrame(page);
});

test('snapDistribute', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  await deleteAll(page);

  await addBasicRectShapeElement(page, { x: 0, y: 0 }, { x: 100, y: 100 });
  await addBasicRectShapeElement(
    page,
    { x: 300, y: 0 },
    { x: 300 + 100, y: 100 }
  );
  await addBasicRectShapeElement(
    page,
    { x: 144, y: 0 },
    { x: 144 + 100, y: 100 }
  );

  await assertEdgelessHoverRect(page, [144, 0, 100, 100]);
  await dragBetweenCoords(
    page,
    { x: 144 + 100 - 9, y: 100 - 9 },
    {
      x: 144 + 100 - 9 + 3,
      y: 100 - 9,
    }
  );
  await assertEdgelessHoverRect(page, [150, 0, 100, 100]);
  await waitNextFrame(page);
});
