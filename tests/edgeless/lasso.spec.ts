import {
  assertEdgelessNonSelectedRect,
  assertEdgelessSelectedRect,
} from 'utils/asserts.js';

import {
  addBasicRectShapeElement,
  assertEdgelessTool,
  edgelessCommonSetup as commonSetup,
  setEdgelessTool,
} from '../utils/actions/edgeless.js';
import {
  dragBetweenCoords,
  selectAllByKeyboard,
} from '../utils/actions/index.js';
import { test } from '../utils/playwright.js';

test('lasso tool should deselect when dragging in an empty area', async ({
  page,
}) => {
  await commonSetup(page);

  const start = { x: 100, y: 100 };
  const end = { x: 200, y: 200 };
  await addBasicRectShapeElement(page, start, end);
  await assertEdgelessSelectedRect(page, [100, 100, 100, 100]);

  await setEdgelessTool(page, 'lasso');
  await assertEdgelessTool(page, 'lasso');

  await dragBetweenCoords(page, { x: 10, y: 10 }, { x: 15, y: 15 });

  await assertEdgelessNonSelectedRect(page);
});

test('freehand lasso basic test', async ({ page }) => {
  await commonSetup(page);

  await addBasicRectShapeElement(page, { x: 100, y: 100 }, { x: 200, y: 200 });
  await addBasicRectShapeElement(page, { x: 300, y: 300 }, { x: 400, y: 400 });

  await page.mouse.click(10, 10); // deselect

  await setEdgelessTool(page, 'lasso');
  await assertEdgelessTool(page, 'lasso');

  await assertEdgelessNonSelectedRect(page);

  // simulate a basic lasso selection to select both the rects

  await page.mouse.move(90, 90);
  await page.mouse.down();
  await page.mouse.move(500, 100);
  await page.mouse.move(500, 500);
  await page.mouse.move(90, 500);
  await page.mouse.up();

  await assertEdgelessSelectedRect(page, [100, 100, 200, 200]);
});

test('freehand lasso add to selection', async ({ page }) => {
  await commonSetup(page);

  await addBasicRectShapeElement(page, { x: 100, y: 100 }, { x: 200, y: 200 });
  await addBasicRectShapeElement(page, { x: 300, y: 300 }, { x: 400, y: 400 });

  await page.mouse.click(10, 10); // deselect

  await setEdgelessTool(page, 'lasso');
  await assertEdgelessTool(page, 'lasso');
  await assertEdgelessNonSelectedRect(page);

  // some random selection covering the rectangle
  await page.mouse.move(90, 90);
  await page.mouse.down();
  await page.mouse.move(250, 90);
  await page.mouse.move(250, 300);
  await page.mouse.move(10, 300);
  await page.mouse.up();

  await assertEdgelessSelectedRect(page, [100, 100, 100, 100]);

  await page.keyboard.down('Shift'); // addition selection
  await page.mouse.move(250, 250);
  await page.mouse.down();
  await page.mouse.move(400, 250);
  await page.mouse.move(400, 450);
  await page.mouse.move(250, 450);
  await page.mouse.up();

  await assertEdgelessSelectedRect(page, [100, 100, 200, 200]);
});

test('freehand lasso subtract from selection', async ({ page }) => {
  await commonSetup(page);

  await addBasicRectShapeElement(page, { x: 100, y: 100 }, { x: 200, y: 200 });
  await addBasicRectShapeElement(page, { x: 300, y: 300 }, { x: 400, y: 400 });
  await setEdgelessTool(page, 'default');

  await selectAllByKeyboard(page);

  await setEdgelessTool(page, 'lasso');

  await page.keyboard.down('Alt');

  await page.mouse.move(290, 290);
  await page.mouse.down();
  await page.mouse.move(410, 290);
  await page.mouse.move(410, 410);
  await page.mouse.move(290, 410);
  await page.mouse.up();

  await assertEdgelessSelectedRect(page, [100, 100, 100, 100]); // only the first rectangle should be selected
});
