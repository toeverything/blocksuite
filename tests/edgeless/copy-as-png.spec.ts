import {
  createShapeElement,
  edgelessCommonSetup,
  Shape,
  triggerComponentToolbarAction,
} from 'utils/actions/edgeless.js';
import {
  pasteByKeyboard,
  selectAllByKeyboard,
} from 'utils/actions/keyboard.js';
import { waitNextFrame } from 'utils/actions/misc.js';
import { assertBlockCount } from 'utils/asserts.js';

import { test } from '../utils/playwright.js';

test.describe.only('copy as png', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await edgelessCommonSetup(page);
  });

  test('copy to clipboard as PNG', async ({ page }) => {
    await createShapeElement(page, [0, 0], [100, 100], Shape.Square);

    await selectAllByKeyboard(page);

    await triggerComponentToolbarAction(page, 'copyAsPng');

    await waitNextFrame(page);

    await assertBlockCount(page, 'note', 0);
    await assertBlockCount(page, 'image', 0);
    await pasteByKeyboard(page);
    await waitNextFrame(page);
    await assertBlockCount(page, 'note', 0);
    await assertBlockCount(page, 'image', 1);
  });

  test('copy as png for frame', async ({ page }) => {
    await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
    await createShapeElement(page, [100, 0], [200, 100], Shape.Square);
    await selectAllByKeyboard(page);
    await triggerComponentToolbarAction(page, 'addFrame');
    await triggerComponentToolbarAction(page, 'copyAsPng');
    await waitNextFrame(page);
    await assertBlockCount(page, 'image', 0);
    await pasteByKeyboard(page);
    await waitNextFrame(page);
    await assertBlockCount(page, 'image', 1);
  });

  test('copy as png for image', async ({ page }) => {
    await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
    await triggerComponentToolbarAction(page, 'copyAsPng');
    await waitNextFrame(page);
    await assertBlockCount(page, 'image', 0);
    await pasteByKeyboard(page);
    await waitNextFrame(page);
    await assertBlockCount(page, 'image', 1);
    await triggerComponentToolbarAction(page, 'copyAsPng');
    await waitNextFrame(page);
    await assertBlockCount(page, 'image', 1);
    await pasteByKeyboard(page);
    await waitNextFrame(page);
    await assertBlockCount(page, 'image', 2);
  });
});
