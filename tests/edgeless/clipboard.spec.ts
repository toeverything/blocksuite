import { expect } from '@playwright/test';

import {
  addBasicConnectorElement,
  deleteAll,
  getConnectorPath,
  switchEditorMode,
  toViewCoord,
} from '../utils/actions/edgeless.js';
import {
  addBasicRectShapeElement,
  copyByKeyboard,
  enterPlaygroundRoom,
  initEmptyEdgelessState,
  pasteByKeyboard,
  selectAllByKeyboard,
} from '../utils/actions/index.js';
import { assertConnectorPath } from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

test('copy and paste connector whose both sides connect nothing', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);
  await deleteAll(page);

  const start = await toViewCoord(page, [0, 0]);
  const end = await toViewCoord(page, [200, 100]);
  await addBasicConnectorElement(
    page,
    { x: start[0], y: start[1] },
    { x: end[0], y: end[1] }
  );

  await copyByKeyboard(page);
  const move = await toViewCoord(page, [100, -50]);
  await page.mouse.click(move[0], move[1]);
  await pasteByKeyboard(page, false);
  await assertConnectorPath(
    page,
    [
      [0, -100],
      [100, -100],
      [100, 0],
      [200, 0],
    ],
    1
  );
});

test('copy and paste connector whose both sides connect elements', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);
  await deleteAll(page);

  let start = await toViewCoord(page, [0, 0]);
  let end = await toViewCoord(page, [100, 100]);
  await addBasicRectShapeElement(
    page,
    { x: start[0], y: start[1] },
    { x: end[0], y: end[1] }
  );

  start = await toViewCoord(page, [200, 0]);
  end = await toViewCoord(page, [300, 100]);
  await addBasicRectShapeElement(
    page,
    { x: start[0], y: start[1] },
    { x: end[0], y: end[1] }
  );

  start = await toViewCoord(page, [50, 50]);
  end = await toViewCoord(page, [250, 50]);
  await addBasicConnectorElement(
    page,
    { x: start[0], y: start[1] },
    { x: end[0], y: end[1] }
  );

  await selectAllByKeyboard(page);
  await copyByKeyboard(page);
  const move = await toViewCoord(page, [150, -50]);
  await page.mouse.click(move[0], move[1]);
  await pasteByKeyboard(page, false);
  await assertConnectorPath(
    page,
    [
      [100, -50],
      [200, -50],
    ],
    1
  );
});

test('copy and paste connector whose both sides connect elements, but only paste connector', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);
  await deleteAll(page);

  let start = await toViewCoord(page, [0, 0]);
  let end = await toViewCoord(page, [100, 100]);
  await addBasicRectShapeElement(
    page,
    { x: start[0], y: start[1] },
    { x: end[0], y: end[1] }
  );

  start = await toViewCoord(page, [200, 0]);
  end = await toViewCoord(page, [300, 100]);
  await addBasicRectShapeElement(
    page,
    { x: start[0], y: start[1] },
    { x: end[0], y: end[1] }
  );

  start = await toViewCoord(page, [50, 50]);
  end = await toViewCoord(page, [250, 50]);
  await addBasicConnectorElement(
    page,
    { x: start[0], y: start[1] },
    { x: end[0], y: end[1] }
  );

  await page.pause();
  await copyByKeyboard(page);
  const move = await toViewCoord(page, [150, -49.5]);
  await page.mouse.move(move[0], move[1]);
  await pasteByKeyboard(page, false);
  await assertConnectorPath(
    page,
    [
      [100, -50],
      [200, -50],
    ],
    1
  );
});

test('copy and paste connector whose one side connects elements', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);
  await deleteAll(page);

  let start = await toViewCoord(page, [0, 0]);
  let end = await toViewCoord(page, [100, 100]);
  await addBasicRectShapeElement(
    page,
    { x: start[0], y: start[1] },
    { x: end[0], y: end[1] }
  );

  start = await toViewCoord(page, [50, 50]);
  end = await toViewCoord(page, [200, 50]);
  await addBasicConnectorElement(
    page,
    { x: start[0], y: start[1] },
    { x: end[0], y: end[1] }
  );

  await selectAllByKeyboard(page);
  await copyByKeyboard(page);
  const move = await toViewCoord(page, [100, -50]);
  await page.mouse.click(move[0], move[1]);
  await pasteByKeyboard(page, false);
  await assertConnectorPath(
    page,
    [
      [100, -50],
      [200, -50],
    ],
    1
  );
});
