import { expect } from '@playwright/test';

import {
  activeFrameInEdgeless,
  setMouseMode,
  switchEditorMode,
} from '../utils/actions/edgeless.js';
import {
  addBasicRectShapeElement,
  dragBetweenCoords,
  enterPlaygroundRoom,
  initEmptyEdgelessState,
  locatorPanButton,
  type,
  waitForVirgoStateUpdated,
} from '../utils/actions/index.js';
import { assertEdgelessHoverRect, assertRichTexts } from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

test('pan tool basic', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  const start = { x: 100, y: 100 };
  const end = { x: 200, y: 200 };
  await addBasicRectShapeElement(page, start, end);

  await setMouseMode(page, 'pan');
  await dragBetweenCoords(
    page,
    {
      x: start.x + 5,
      y: start.y + 5,
    },
    {
      x: start.x + 25,
      y: start.y + 25,
    }
  );
  await setMouseMode(page, 'default');

  await page.mouse.move(start.x + 25, start.y + 25);
  await assertEdgelessHoverRect(page, [120, 120, 100, 100]);
});

test('pan tool shortcut', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  const start = { x: 100, y: 100 };
  const end = { x: 200, y: 200 };
  await addBasicRectShapeElement(page, start, end);

  await page.mouse.move(start.x + 5, start.y + 5);
  await assertEdgelessHoverRect(page, [100, 100, 100, 100]);

  await page.keyboard.down('Space');
  const panButton = locatorPanButton(page);
  expect(await panButton.getAttribute('active')).toEqual('');

  await dragBetweenCoords(
    page,
    {
      x: start.x + 5,
      y: start.y + 5,
    },
    {
      x: start.x + 25,
      y: start.y + 25,
    }
  );

  await page.keyboard.up('Space');

  expect(await panButton.getAttribute('active')).toBeNull();

  await page.mouse.move(start.x + 25, start.y + 25);
  await assertEdgelessHoverRect(page, [120, 120, 100, 100]);
});

test('pan tool shortcut when user is editing', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const ids = await initEmptyEdgelessState(page);
  await switchEditorMode(page);
  await setMouseMode(page, 'default');

  await activeFrameInEdgeless(page, ids.frameId);
  await waitForVirgoStateUpdated(page);

  await type(page, 'hello');
  await assertRichTexts(page, ['hello']);

  await page.keyboard.down('Space');
  const panButton = locatorPanButton(page);
  expect(await panButton.getAttribute('active')).toBeNull();
});
