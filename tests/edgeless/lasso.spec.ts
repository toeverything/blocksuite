import { sleep } from '@blocksuite/global/utils';
import { expect } from '@playwright/test';

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
import {
  assertEdgelessNonSelectedRect,
  assertEdgelessSelectedRect,
} from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

test.skip('lasso tool should deselect when dragging in an empty area', async ({
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

test.skip('freehand lasso basic test', async ({ page }) => {
  await commonSetup(page);

  await addBasicRectShapeElement(page, { x: 100, y: 100 }, { x: 200, y: 200 });
  await addBasicRectShapeElement(page, { x: 300, y: 300 }, { x: 400, y: 400 });

  await page.mouse.click(10, 10); // deselect

  await setEdgelessTool(page, 'lasso');
  await assertEdgelessTool(page, 'lasso');

  await assertEdgelessNonSelectedRect(page);

  // simulate a basic lasso selection to select both the rects
  const points: [number, number][] = [
    [500, 100],
    [500, 500],
    [90, 500],
  ];
  await page.mouse.move(90, 90);
  await page.mouse.down();
  for (const point of points) await page.mouse.move(...point);
  await page.mouse.up();

  await assertEdgelessSelectedRect(page, [100, 100, 200, 200]);
});

test.skip('freehand lasso add to selection', async ({ page }) => {
  await commonSetup(page);

  await addBasicRectShapeElement(page, { x: 100, y: 100 }, { x: 200, y: 200 });
  await addBasicRectShapeElement(page, { x: 300, y: 300 }, { x: 400, y: 400 });

  await page.mouse.click(10, 10); // deselect

  await setEdgelessTool(page, 'lasso');
  await assertEdgelessTool(page, 'lasso');
  await assertEdgelessNonSelectedRect(page);

  // some random selection covering the rectangle
  let points: [number, number][] = [
    [250, 90],
    [250, 300],
    [10, 300],
  ];
  await page.mouse.move(90, 90);
  await page.mouse.down();
  for (const point of points) await page.mouse.move(...point);
  await page.mouse.up();

  await assertEdgelessSelectedRect(page, [100, 100, 100, 100]);

  points = [
    [400, 250],
    [400, 450],
    [250, 450],
  ];

  await page.keyboard.down('Shift'); // addition selection
  await page.mouse.move(250, 250);
  await page.mouse.down();
  for (const point of points) await page.mouse.move(...point);
  await page.mouse.up();

  await assertEdgelessSelectedRect(page, [100, 100, 200, 200]);
});

test.skip('freehand lasso subtract from selection', async ({ page }) => {
  await commonSetup(page);

  await addBasicRectShapeElement(page, { x: 100, y: 100 }, { x: 200, y: 200 });
  await addBasicRectShapeElement(page, { x: 300, y: 300 }, { x: 400, y: 400 });
  await setEdgelessTool(page, 'default');

  await selectAllByKeyboard(page);

  await setEdgelessTool(page, 'lasso');

  const points: [number, number][] = [
    [410, 290],
    [410, 410],
    [290, 410],
  ];

  await page.keyboard.down('Alt');

  await page.mouse.move(290, 290);
  await page.mouse.down();
  for (const point of points) await page.mouse.move(...point);
  await page.mouse.up();

  await assertEdgelessSelectedRect(page, [100, 100, 100, 100]); // only the first rectangle should be selected
});

test.skip('polygonal lasso basic test', async ({ page }) => {
  await commonSetup(page);
  await addBasicRectShapeElement(page, { x: 100, y: 100 }, { x: 200, y: 200 });
  await addBasicRectShapeElement(page, { x: 300, y: 300 }, { x: 400, y: 400 });
  await page.mouse.click(10, 10); // deselect

  await assertEdgelessNonSelectedRect(page);

  await setEdgelessTool(page, 'lasso');
  await setEdgelessTool(page, 'lasso'); // switch to polygonal lasso
  await sleep(100);

  const points: [number, number][] = [
    [90, 90],
    [500, 90],
    [500, 500],
    [90, 500],
    [90, 90],
  ];

  for (const point of points) {
    await page.mouse.click(...point);
  }

  await assertEdgelessSelectedRect(page, [100, 100, 200, 200]);
});

test.skip('polygonal lasso add to selection by holding Shift Key', async ({
  page,
}) => {
  await commonSetup(page);

  await addBasicRectShapeElement(page, { x: 100, y: 100 }, { x: 200, y: 200 });
  await addBasicRectShapeElement(page, { x: 300, y: 300 }, { x: 400, y: 400 });

  await page.mouse.click(10, 10); // deselect
  await assertEdgelessNonSelectedRect(page);

  await setEdgelessTool(page, 'lasso');
  await setEdgelessTool(page, 'lasso');
  await sleep(100);

  let points: [number, number][] = [
    [90, 90],
    [150, 90],
    [150, 150],
    [90, 150],
    [90, 90],
  ];

  // select the first rectangle
  for (const point of points) await page.mouse.click(...point);

  points = [
    [290, 290],
    [350, 290],
    [350, 350],
    [290, 350],
    [290, 290],
  ];

  await page.keyboard.down('Shift'); // add to selection
  // selects the second rectangle
  for (const point of points) await page.mouse.click(...point);

  // by the end both of the rects should be selected
  await assertEdgelessSelectedRect(page, [100, 100, 200, 200]);
});

test.skip('polygonal lasso subtract from selection by holding Alt', async ({
  page,
}) => {
  await commonSetup(page);

  await addBasicRectShapeElement(page, { x: 100, y: 100 }, { x: 200, y: 200 });
  await addBasicRectShapeElement(page, { x: 300, y: 300 }, { x: 400, y: 400 });

  await selectAllByKeyboard(page);

  const points: [number, number][] = [
    [290, 290],
    [350, 290],
    [350, 350],
    [290, 350],
    [290, 290],
  ];

  // switch to polygonal lasso tool
  await setEdgelessTool(page, 'lasso');
  await setEdgelessTool(page, 'lasso');
  await sleep(100);

  await page.keyboard.down('Alt'); // subtract from selection
  for (const point of points) await page.mouse.click(...point);

  // By the end the second rectangle must be deselected leaving the first rect selection
  await assertEdgelessSelectedRect(page, [100, 100, 100, 100]);
});

test.skip('polygonal lasso should complete selection when clicking the last point', async ({
  page,
}) => {
  await commonSetup(page);

  // switch to polygonal lasso
  await setEdgelessTool(page, 'lasso');
  await setEdgelessTool(page, 'lasso');
  await sleep(100);

  const lassoPoints: [number, number][] = [
    [100, 100],
    [200, 200],
    [250, 150],
    [100, 100],
  ];

  for (const point of lassoPoints) await page.mouse.click(...point);

  const isSelecting = await page.evaluate(() => {
    const edgeless = document.querySelector('affine-edgeless-root');
    if (!edgeless) throw new Error('Missing edgless root block');

    const curController = edgeless.gfx.tool.currentTool$.peek();
    if (curController?.toolName !== 'lasso')
      throw new Error('expected lasso tool controller');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (curController as any)['_isSelecting'];
  });

  expect(isSelecting).toBe(false);
});
