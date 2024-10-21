import { expect } from '@playwright/test';

import {
  addBasicBrushElement,
  createConnectorElement,
  createFrameElement,
  createNote,
  createShapeElement,
  setEdgelessTool,
  Shape,
  triggerComponentToolbarAction,
} from '../utils/actions/edgeless.js';
import {
  clickView,
  edgelessCommonSetup as commonSetup,
  selectAllByKeyboard,
  type,
  waitNextFrame,
} from '../utils/actions/index.js';
import {
  assertEdgelessSelectedRect,
  getSelectedRect,
} from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

test.describe('auto arrange align', () => {
  test('arrange shapes', async ({ page }) => {
    await commonSetup(page);
    await createShapeElement(page, [0, 0], [100, 100], Shape.Diamond);
    await createShapeElement(page, [100, -100], [300, 100], Shape.Ellipse);
    await createShapeElement(page, [200, 300], [300, 400], Shape.Square);
    await createShapeElement(page, [400, 100], [500, 200], Shape.Triangle);
    await createShapeElement(
      page,
      [0, 200],
      [100, 300],
      Shape['Rounded rectangle']
    );

    await page.mouse.click(0, 0);
    await selectAllByKeyboard(page);
    await assertEdgelessSelectedRect(page, [80, 302.5, 500, 500]);

    // arrange
    await triggerComponentToolbarAction(page, 'autoArrange');
    await waitNextFrame(page, 200);
    await assertEdgelessSelectedRect(page, [80, 402.5, 560, 320]);
  });

  test('arrange rotated shapes', async ({ page }) => {
    await commonSetup(page);
    await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
    await createShapeElement(page, [100, 100], [200, 200], Shape.Ellipse);

    await page.mouse.click(100, 420);
    await page.mouse.move(75, 395);
    await page.mouse.down();
    await page.mouse.move(125, 395);
    await page.mouse.up();

    await selectAllByKeyboard(page);
    await assertEdgelessSelectedRect(page, [60, 382, 220, 220]);

    // arrange
    await triggerComponentToolbarAction(page, 'autoArrange');
    await waitNextFrame(page, 200);
    await assertEdgelessSelectedRect(page, [60, 382, 260.5, 140.5]);
  });

  test('arrange connected shapes', async ({ page }) => {
    await commonSetup(page);
    await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
    await createShapeElement(page, [100, 100], [200, 200], Shape.Ellipse);
    await createConnectorElement(page, [50, 100], [150, 100]);

    await selectAllByKeyboard(page);
    await assertEdgelessSelectedRect(page, [80, 402.5, 200, 200]);

    // arrange
    await triggerComponentToolbarAction(page, 'autoArrange');
    await waitNextFrame(page, 200);
    await assertEdgelessSelectedRect(page, [80, 381.7, 220, 141.4]);
  });

  test('arrange connector', async ({ page }) => {
    await commonSetup(page);
    await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
    await createConnectorElement(page, [200, 200], [300, 200]);

    await selectAllByKeyboard(page);
    await assertEdgelessSelectedRect(page, [80, 402.5, 300, 200]);

    // arrange
    await triggerComponentToolbarAction(page, 'autoArrange');
    await waitNextFrame(page, 200);
    await assertEdgelessSelectedRect(page, [80, 402.5, 220, 100]);
  });

  test('arrange edgeless text', async ({ page }) => {
    await commonSetup(page);
    await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
    await setEdgelessTool(page, 'default');
    await page.mouse.dblclick(300, 300, {
      delay: 100,
    });
    await waitNextFrame(page);
    await type(page, 'a');
    await page.mouse.click(0, 0);

    await selectAllByKeyboard(page);
    await assertEdgelessSelectedRect(page, [80, 275, 245, 227.5]);

    // arrange
    await triggerComponentToolbarAction(page, 'autoArrange');
    await waitNextFrame(page, 200);
    await assertEdgelessSelectedRect(page, [80, 402.5, 170, 100]);
  });

  test('arrange group', async ({ page }) => {
    await commonSetup(page);
    await createShapeElement(page, [200, 300], [300, 400], Shape.Square);
    await createShapeElement(page, [400, 100], [500, 200], Shape.Triangle);
    await selectAllByKeyboard(page);
    await triggerComponentToolbarAction(page, 'addGroup');

    await createShapeElement(page, [0, 0], [100, 100], Shape.Diamond);
    await selectAllByKeyboard(page);
    await assertEdgelessSelectedRect(page, [80, 402.5, 500, 400]);

    // arrange
    await triggerComponentToolbarAction(page, 'autoArrange');
    await waitNextFrame(page, 200);
    await assertEdgelessSelectedRect(page, [80, 402.5, 420, 300]);
  });

  test('arrange frame', async ({ page }) => {
    await commonSetup(page);
    await createShapeElement(page, [200, 300], [300, 400], Shape.Square);
    await createShapeElement(page, [400, 100], [500, 200], Shape.Triangle);
    await selectAllByKeyboard(page);
    await createFrameElement(page, [150, 50], [550, 450]);

    await createShapeElement(page, [0, 0], [100, 100], Shape.Diamond);

    await page.mouse.click(0, 0);
    await page.mouse.move(75, 395);
    await page.mouse.down();
    await page.mouse.move(650, 880);
    await page.mouse.up();
    await assertEdgelessSelectedRect(page, [80, 402.5, 550, 450]);

    // arrange
    await triggerComponentToolbarAction(page, 'autoArrange');
    await waitNextFrame(page, 200);
    await assertEdgelessSelectedRect(page, [80, 402.5, 520, 400]);
  });

  // TODO mindmap size different on CI
  test('arrange mindmap', async ({ page }) => {
    await commonSetup(page);
    await createShapeElement(page, [0, 0], [100, 100], Shape.Diamond);
    await page.keyboard.press('m');
    await clickView(page, [500, 200]);

    await selectAllByKeyboard(page);
    const box1 = await getSelectedRect(page);
    expect(box1.width).toBeGreaterThan(700);
    expect(box1.height).toBeGreaterThan(300);

    // arrange
    await triggerComponentToolbarAction(page, 'autoArrange');
    await waitNextFrame(page, 200);
    const box2 = await getSelectedRect(page);
    expect(box2.width).toBeLessThan(550);
    expect(box2.height).toBeLessThan(210);
  });

  test('arrange shape, note, connector, brush and edgeless text', async ({
    page,
  }) => {
    await commonSetup(page);
    // shape
    await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
    await createShapeElement(page, [150, 150], [300, 300], Shape.Ellipse);
    //note
    await createNote(page, [150, 50], 'Hello World');
    // connector
    await createConnectorElement(page, [200, -200], [400, -100]);
    // brush
    const start = { x: 400, y: 400 };
    const end = { x: 480, y: 480 };
    await addBasicBrushElement(page, start, end);
    // edgeless text
    await setEdgelessTool(page, 'default');
    await page.mouse.dblclick(100, 300, {
      delay: 100,
    });
    await waitNextFrame(page);
    await type(page, 'edgeless text');

    await page.mouse.click(0, 0);
    await selectAllByKeyboard(page);

    await assertEdgelessSelectedRect(page, [75, 202.5, 623, 500]);
    // arrange
    await triggerComponentToolbarAction(page, 'autoArrange');
    await waitNextFrame(page, 200);
    await assertEdgelessSelectedRect(page, [75, 275, 668, 270]);
  });
});

test.describe('auto resize align', () => {
  test('resize and arrange shapes', async ({ page }) => {
    await commonSetup(page);
    await createShapeElement(page, [0, 0], [100, 100], Shape.Diamond);
    await createShapeElement(page, [100, -100], [300, 100], Shape.Ellipse);
    await createShapeElement(page, [200, 300], [300, 400], Shape.Square);
    await createShapeElement(page, [400, 100], [500, 200], Shape.Triangle);
    await createShapeElement(
      page,
      [0, 200],
      [100, 300],
      Shape['Rounded rectangle']
    );

    await page.mouse.click(0, 0);
    await selectAllByKeyboard(page);

    await assertEdgelessSelectedRect(page, [80, 302.5, 500, 500]);
    // arrange
    await triggerComponentToolbarAction(page, 'autoResize');
    await waitNextFrame(page, 200);
    await assertEdgelessSelectedRect(page, [80, 402.5, 860, 420]);
  });

  test('resize and arrange rotated shapes', async ({ page }) => {
    await commonSetup(page);
    await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
    await createShapeElement(page, [100, 100], [200, 200], Shape.Ellipse);

    await page.mouse.click(100, 420);
    await page.mouse.move(75, 395);
    await page.mouse.down();
    await page.mouse.move(125, 395);
    await page.mouse.up();

    await selectAllByKeyboard(page);
    await assertEdgelessSelectedRect(page, [60, 382, 220, 220]);

    // arrange
    await triggerComponentToolbarAction(page, 'autoResize');
    await waitNextFrame(page, 200);
    await assertEdgelessSelectedRect(page, [51, 373.5, 420, 200]);
  });

  test('resize and arrange connected shapes', async ({ page }) => {
    await commonSetup(page);
    await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
    await createShapeElement(page, [100, 100], [200, 200], Shape.Ellipse);
    await createConnectorElement(page, [50, 100], [150, 100]);

    await selectAllByKeyboard(page);
    await assertEdgelessSelectedRect(page, [80, 402.5, 200, 200]);

    // arrange
    await triggerComponentToolbarAction(page, 'autoResize');
    await waitNextFrame(page, 200);
    await assertEdgelessSelectedRect(page, [80, 386, 420, 232]);
  });

  test('resize and arrange connector', async ({ page }) => {
    await commonSetup(page);
    await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
    await createConnectorElement(page, [200, 200], [300, 200]);

    await selectAllByKeyboard(page);
    await assertEdgelessSelectedRect(page, [80, 402.5, 300, 200]);

    // arrange
    await triggerComponentToolbarAction(page, 'autoResize');
    await waitNextFrame(page, 200);
    await assertEdgelessSelectedRect(page, [80, 402.5, 320, 200]);
  });

  test('resize and arrange edgeless text', async ({ page }) => {
    await commonSetup(page);
    await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
    await setEdgelessTool(page, 'default');
    await page.mouse.dblclick(300, 300, {
      delay: 100,
    });
    await waitNextFrame(page);
    await type(page, 'a');
    await page.mouse.click(0, 0);

    await selectAllByKeyboard(page);
    await assertEdgelessSelectedRect(page, [80, 275, 245, 227.5]);

    // arrange
    await triggerComponentToolbarAction(page, 'autoResize');
    await waitNextFrame(page, 200);
    await assertEdgelessSelectedRect(page, [80, 402.5, 270, 200]);
  });

  test('resize and arrange group', async ({ page }) => {
    await commonSetup(page);
    await createShapeElement(page, [200, 300], [300, 400], Shape.Square);
    await createShapeElement(page, [400, 100], [500, 200], Shape.Triangle);
    await selectAllByKeyboard(page);
    await triggerComponentToolbarAction(page, 'addGroup');

    await createShapeElement(page, [0, 0], [100, 100], Shape.Diamond);
    await selectAllByKeyboard(page);
    await assertEdgelessSelectedRect(page, [80, 402.5, 500, 400]);

    // arrange
    await triggerComponentToolbarAction(page, 'autoResize');
    await waitNextFrame(page, 200);
    await assertEdgelessSelectedRect(page, [80, 402.5, 420, 200]);
  });

  test('resize and arrange frame', async ({ page }) => {
    await commonSetup(page);
    await createShapeElement(page, [200, 300], [300, 400], Shape.Square);
    await createShapeElement(page, [400, 100], [500, 200], Shape.Triangle);
    await selectAllByKeyboard(page);
    await createFrameElement(page, [150, 50], [550, 450]);

    await createShapeElement(page, [0, 0], [100, 100], Shape.Diamond);

    await page.mouse.click(0, 0);
    await page.mouse.move(75, 395);
    await page.mouse.down();
    await page.mouse.move(650, 880);
    await page.mouse.up();
    await assertEdgelessSelectedRect(page, [80, 402.5, 550, 450]);

    // arrange
    await triggerComponentToolbarAction(page, 'autoResize');
    await waitNextFrame(page, 200);
    await assertEdgelessSelectedRect(page, [80, 402.5, 420, 200]);
  });

  // TODO mindmap size different on CI
  test('resize and arrange mindmap', async ({ page }) => {
    await commonSetup(page);
    await createShapeElement(page, [0, 0], [100, 100], Shape.Diamond);
    await page.keyboard.press('m');
    await clickView(page, [500, 200]);

    await selectAllByKeyboard(page);
    const box1 = await getSelectedRect(page);
    expect(box1.width).toBeGreaterThan(700);
    expect(box1.height).toBeGreaterThan(300);

    // arrange
    await triggerComponentToolbarAction(page, 'autoResize');
    await waitNextFrame(page, 200);
    const box2 = await getSelectedRect(page);
    expect(box2.width).toBeLessThan(650);
    expect(box2.height).toBeLessThan(210);
  });

  test('resize and arrange shape, note, connector, brush and text', async ({
    page,
  }) => {
    await commonSetup(page);
    // shape
    await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
    await createShapeElement(page, [150, 150], [300, 300], Shape.Ellipse);
    //note
    await createNote(page, [150, 50], 'Hello World');
    // connector
    await createConnectorElement(page, [200, -200], [400, -100]);
    // brush
    const start = { x: 400, y: 400 };
    const end = { x: 480, y: 480 };
    await addBasicBrushElement(page, start, end);
    // edgeless text
    await setEdgelessTool(page, 'default');
    await page.mouse.dblclick(100, 300, {
      delay: 100,
    });
    await waitNextFrame(page);
    await type(page, 'edgeless text');
    await page.mouse.click(0, 0);

    await selectAllByKeyboard(page);
    await assertEdgelessSelectedRect(page, [75, 202.5, 623, 500]);
    // arrange
    await triggerComponentToolbarAction(page, 'autoResize');
    await waitNextFrame(page, 200);
    await assertEdgelessSelectedRect(page, [75, 275, 1303, 420]);
  });
});
