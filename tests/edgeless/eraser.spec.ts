import { expect } from '@playwright/test';

import { click } from '../utils/actions/click.js';
import { dragBetweenCoords } from '../utils/actions/drag.js';
import {
  addBasicRectShapeElement,
  countBlock,
  deleteAll,
  getNoteBoundBoxInEdgeless,
  setMouseMode,
  switchEditorMode,
} from '../utils/actions/edgeless.js';
import {
  enterPlaygroundRoom,
  initEmptyEdgelessState,
} from '../utils/actions/misc.js';
import { assertEdgelessNonSelectedRect } from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

test('earse shape', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  await deleteAll(page);

  await addBasicRectShapeElement(page, { x: 0, y: 0 }, { x: 100, y: 100 });
  await setMouseMode(page, 'eraser');

  await dragBetweenCoords(page, { x: 50, y: 150 }, { x: 50, y: 50 });
  await click(page, { x: 50, y: 50 });
  await assertEdgelessNonSelectedRect(page);
});

test('earse note', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  await setMouseMode(page, 'eraser');
  const box = await getNoteBoundBoxInEdgeless(page, noteId);
  await dragBetweenCoords(
    page,
    { x: 0, y: 0 },
    { x: box.x + 10, y: box.y + 10 }
  );
  const count = await countBlock(page, 'affine-frame');
  expect(count).toBe(0);
});
