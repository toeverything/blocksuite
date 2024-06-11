import { expect, type Page } from '@playwright/test';

import {
  assertEdgelessTool,
  changeShapeFillColor,
  changeShapeStrokeColor,
  changeShapeStrokeStyle,
  changeShapeStrokeWidth,
  changeShapeStyle,
  clickComponentToolbarMoreMenuButton,
  getEdgelessSelectedRect,
  locatorComponentToolbar,
  locatorEdgelessToolButton,
  locatorShapeStrokeStyleButton,
  openComponentToolbarMoreMenu,
  pickColorAtPoints,
  resizeElementByHandle,
  setEdgelessTool,
  switchEditorMode,
  triggerComponentToolbarAction,
  zoomResetByKeyboard,
} from '../utils/actions/edgeless.js';
import {
  addBasicBrushElement,
  addBasicRectShapeElement,
  copyByKeyboard,
  dragBetweenCoords,
  enterPlaygroundRoom,
  focusRichText,
  initEmptyEdgelessState,
  pasteByKeyboard,
  type,
  waitNextFrame,
} from '../utils/actions/index.js';
import {
  assertEdgelessCanvasText,
  assertEdgelessColorSameWithHexColor,
  assertEdgelessNonSelectedRect,
  assertEdgelessSelectedRect,
  assertExists,
  assertRichTexts,
} from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

test.describe('add shape', () => {
  test('without holding shift key', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyEdgelessState(page);
    await switchEditorMode(page);

    const start0 = { x: 100, y: 100 };
    const end0 = { x: 150, y: 200 };
    await addBasicRectShapeElement(page, start0, end0);

    await assertEdgelessTool(page, 'default');
    await assertEdgelessSelectedRect(page, [100, 100, 50, 100]);

    const start1 = { x: 100, y: 100 };
    const end1 = { x: 200, y: 150 };
    await addBasicRectShapeElement(page, start1, end1);

    await assertEdgelessTool(page, 'default');
    await assertEdgelessSelectedRect(page, [100, 100, 100, 50]);
  });

  test('with holding shift key', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyEdgelessState(page);
    await switchEditorMode(page);

    await page.keyboard.down('Shift');

    const start0 = { x: 100, y: 100 };
    const end0 = { x: 150, y: 200 };
    await addBasicRectShapeElement(page, start0, end0);

    await page.keyboard.up('Shift');

    await assertEdgelessTool(page, 'default');
    await assertEdgelessSelectedRect(page, [100, 100, 100, 100]);

    await page.keyboard.down('Shift');

    const start1 = { x: 100, y: 100 };
    const end1 = { x: 200, y: 150 };
    await addBasicRectShapeElement(page, start1, end1);

    await assertEdgelessTool(page, 'default');
    await assertEdgelessSelectedRect(page, [100, 100, 100, 100]);
  });
  test('with holding space bar', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyEdgelessState(page);
    await switchEditorMode(page);

    const start0 = { x: 100, y: 100 };
    const end0 = { x: 200, y: 200 };
    await setEdgelessTool(page, 'shape');
    await dragBetweenCoords(page, start0, end0, {
      steps: 50,
      beforeMouseUp: async () => {
        // move the shape
        await page.keyboard.down('Space');
        await page.mouse.move(300, 300);
        await page.keyboard.up('Space');

        await page.mouse.move(500, 600);
      },
    });

    await assertEdgelessSelectedRect(page, [200, 200, 300, 400]);
  });

  test('with holding space bar + shift', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyEdgelessState(page);
    await switchEditorMode(page);

    const start0 = { x: 100, y: 100 };
    const end0 = { x: 200, y: 200 };
    await setEdgelessTool(page, 'shape');
    await page.keyboard.down('Shift');
    await dragBetweenCoords(page, start0, end0, {
      steps: 50,
      beforeMouseUp: async () => {
        // move the shape
        await page.keyboard.down('Space');
        await page.mouse.move(300, 300);
        await page.keyboard.up('Space');

        await page.mouse.move(500, 600);
      },
    });

    await assertEdgelessSelectedRect(page, [200, 200, 400, 400]);
  });
});

test('delete shape by component-toolbar', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  const start = { x: 100, y: 100 };
  const end = { x: 200, y: 200 };
  await addBasicBrushElement(page, start, end);

  await page.mouse.click(110, 110);
  await openComponentToolbarMoreMenu(page);
  await clickComponentToolbarMoreMenuButton(page, 'delete');
  await assertEdgelessNonSelectedRect(page);
});

//FIXME: need a way to test hand-drawn-like style
test.skip('change shape fill color', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  const rect = {
    start: { x: 100, y: 100 },
    end: { x: 200, y: 200 },
  };
  await addBasicRectShapeElement(page, rect.start, rect.end);

  await page.mouse.click(rect.start.x + 5, rect.start.y + 5);
  await triggerComponentToolbarAction(page, 'changeShapeFillColor');
  const color = '--affine-palette-shape-teal';
  await changeShapeFillColor(page, color);
  await page.waitForTimeout(50);
  const [picked] = await pickColorAtPoints(page, [
    [rect.start.x + 20, rect.start.y + 20],
  ]);

  await assertEdgelessColorSameWithHexColor(page, color, picked);
});

test('change shape stroke color', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  const rect = {
    start: { x: 100, y: 100 },
    end: { x: 200, y: 200 },
  };
  await addBasicRectShapeElement(page, rect.start, rect.end);

  await page.mouse.click(rect.start.x + 5, rect.start.y + 5);
  await triggerComponentToolbarAction(page, 'changeShapeStrokeColor');
  const color = '--affine-palette-line-teal';
  await changeShapeStrokeColor(page, color);
  await page.waitForTimeout(50);
  const [picked] = await pickColorAtPoints(page, [
    [rect.start.x + 1, rect.start.y + 1],
  ]);

  await assertEdgelessColorSameWithHexColor(page, color, picked);
});

test('the tooltip of shape tool button should be hidden when the shape menu is shown', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  const shapeTool = await locatorEdgelessToolButton(page, 'shape');
  const shapeToolBox = await shapeTool.boundingBox();
  const tooltip = page.locator('.affine-tooltip');

  assertExists(shapeToolBox);

  await page.mouse.move(shapeToolBox.x + 2, shapeToolBox.y + 2);
  await expect(tooltip).toBeVisible();

  await page.mouse.click(shapeToolBox.x + 2, shapeToolBox.y + 2);
  await expect(tooltip).toBeHidden();

  await page.mouse.click(shapeToolBox.x + 2, shapeToolBox.y + 2);
  await expect(tooltip).toBeVisible();
});

test('delete shape block by keyboard', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);

  await switchEditorMode(page);
  await setEdgelessTool(page, 'shape');
  await dragBetweenCoords(page, { x: 100, y: 100 }, { x: 200, y: 200 });

  await setEdgelessTool(page, 'default');
  const startPoint = await page.evaluate(() => {
    const hitbox = document.querySelector('[data-block-id="3"]');
    if (!hitbox) {
      throw new Error('hitbox is null');
    }
    const rect = hitbox.getBoundingClientRect();
    if (rect == null) {
      throw new Error('rect is null');
    }
    return {
      x: rect.x,
      y: rect.y,
    };
  });
  await page.mouse.click(startPoint.x + 2, startPoint.y + 2);
  await waitNextFrame(page);
  await page.keyboard.press('Backspace');
  const exist = await page.evaluate(() => {
    return document.querySelector('[data-block-id="3"]') != null;
  });
  expect(exist).toBe(false);
});

test('edgeless toolbar shape menu shows up and close normally', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  const toolbarLocator = page.locator('.edgeless-toolbar-container');
  await expect(toolbarLocator).toBeVisible();

  const shapeTool = await locatorEdgelessToolButton(page, 'shape');
  const shapeToolBox = await shapeTool.boundingBox();

  assertExists(shapeToolBox);

  await page.mouse.click(shapeToolBox.x + 2, shapeToolBox.y + 2);

  const shapeMenu = page.locator('edgeless-shape-menu');
  await expect(shapeMenu).toBeVisible();
  await page.waitForTimeout(500);

  await page.mouse.click(shapeToolBox.x + 2, shapeToolBox.y + 2);
  await page.waitForTimeout(500);
  await expect(shapeMenu).toBeHidden();
});

test('hovering on shape should not have effect on underlying block', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await focusRichText(page);

  await type(page, 'hello');
  await assertRichTexts(page, ['hello']);

  await switchEditorMode(page);

  const block = page.locator('.edgeless-block-portal-note');
  const blockBox = await block.boundingBox();
  if (blockBox === null) throw new Error('Unexpected box value: box is null');

  const { x, y } = blockBox;

  await setEdgelessTool(page, 'shape');
  await dragBetweenCoords(page, { x, y }, { x: x + 100, y: y + 100 });
  await setEdgelessTool(page, 'default');

  await page.mouse.click(x + 10, y + 10);
  await assertEdgelessSelectedRect(page, [x, y, 100, 100]);
});

test('shape element should not move when the selected state is inactive', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  await setEdgelessTool(page, 'shape');
  await dragBetweenCoords(page, { x: 100, y: 100 }, { x: 200, y: 200 });
  await setEdgelessTool(page, 'default');
  await dragBetweenCoords(
    page,
    { x: 50, y: 50 },
    { x: 110, y: 110 },
    { steps: 2 }
  );

  await assertEdgelessSelectedRect(page, [100, 100, 100, 100]);
});

test('change shape stroke width', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  const start = { x: 100, y: 150 };
  const end = { x: 200, y: 250 };
  await addBasicRectShapeElement(page, start, end);

  await page.mouse.click(start.x + 5, start.y + 5);
  await triggerComponentToolbarAction(page, 'changeShapeStrokeColor');
  await changeShapeStrokeColor(page, '--affine-palette-line-teal');

  await triggerComponentToolbarAction(page, 'changeShapeStrokeStyles');
  await changeShapeStrokeWidth(page);
  await page.mouse.click(start.x + 5, start.y + 5);
  await assertEdgelessSelectedRect(page, [100, 150, 100, 100]);

  await waitNextFrame(page);

  await triggerComponentToolbarAction(page, 'changeShapeStrokeStyles');
});

test('change shape stroke style', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  const start = { x: 100, y: 150 };
  const end = { x: 200, y: 250 };
  await addBasicRectShapeElement(page, start, end);

  await page.mouse.click(start.x + 5, start.y + 5);
  await triggerComponentToolbarAction(page, 'changeShapeStrokeColor');
  await changeShapeStrokeColor(page, '--affine-palette-line-teal');

  await triggerComponentToolbarAction(page, 'changeShapeStrokeStyles');
  await changeShapeStrokeStyle(page, 'dash');
  await waitNextFrame(page);

  await triggerComponentToolbarAction(page, 'changeShapeStrokeStyles');
  const activeButton = locatorShapeStrokeStyleButton(page, 'dash');
  const className = await activeButton.evaluate(ele => ele.className);
  expect(className.includes(' active')).toBeTruthy();

  const pickedColor = await pickColorAtPoints(page, [[start.x + 20, start.y]]);
  expect(pickedColor[0]).toBe('#000000');
});

test('click to add shape', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);
  await zoomResetByKeyboard(page);

  await setEdgelessTool(page, 'shape');
  await waitNextFrame(page, 500);

  await page.mouse.move(400, 400);
  await page.mouse.move(200, 200);
  await page.mouse.click(200, 200, { button: 'left', delay: 300 });

  await assertEdgelessTool(page, 'default');
  await assertEdgelessSelectedRect(page, [200, 200, 100, 100]);
});

test('dbclick to add text in shape', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);
  await zoomResetByKeyboard(page);

  await setEdgelessTool(page, 'shape');
  await waitNextFrame(page, 500);

  await page.mouse.click(200, 150);
  await waitNextFrame(page);
  await page.mouse.dblclick(250, 200);
  await waitNextFrame(page);

  await type(page, 'hello');
  await assertEdgelessCanvasText(page, 'hello');
  await assertEdgelessTool(page, 'default');

  // test select, copy, paste
  const select = async () => {
    await page.mouse.move(245, 205);
    await page.mouse.down();

    await page.mouse.move(245, 205);
    await page.mouse.down();
    await page.mouse.move(262, 205, {
      steps: 10,
    });
    await page.mouse.up();
  };
  await select();
  // h|ell|o
  await waitNextFrame(page);
  await copyByKeyboard(page);
  await waitNextFrame(page);

  // FIXME(@Flrande): this is a workaround, we should keep selection
  await select();

  await waitNextFrame(page);
  await type(page, 'ddd', 50);
  await waitNextFrame(page);
  await assertEdgelessCanvasText(page, 'hdddo');

  await pasteByKeyboard(page);
  await assertEdgelessCanvasText(page, 'hdddello');
});

test('auto wrap text in shape', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);
  await zoomResetByKeyboard(page);

  await setEdgelessTool(page, 'shape');
  await waitNextFrame(page, 500);

  await page.mouse.click(200, 150);
  await waitNextFrame(page);
  await page.mouse.dblclick(250, 200);
  await waitNextFrame(page);

  await type(page, 'aaaa\nbbbb\n');
  await assertEdgelessCanvasText(page, 'aaaa\nbbbb\n');
  await assertEdgelessTool(page, 'default');

  // blur to finish typing
  await page.mouse.click(150, 150);
  // select shape
  await page.mouse.click(200, 150);
  // the height of shape should be increased because of \n
  let selectedRect = await getEdgelessSelectedRect(page);
  let lastWidth = selectedRect.width;
  let lastHeight = selectedRect.height;

  await page.mouse.dblclick(250, 200);
  await waitNextFrame(page);
  // type long text
  await type(page, '\ncccccccc');
  await assertEdgelessCanvasText(page, 'aaaa\nbbbb\ncccccccc');

  // blur to finish typing
  await page.mouse.click(150, 150);
  // select shape
  await page.mouse.click(200, 150);
  // the height of shape should be increased because of long text
  // cccccccc -- wrap --> cccccc\ncc
  selectedRect = await getEdgelessSelectedRect(page);
  expect(selectedRect.width).toBe(lastWidth);
  expect(selectedRect.height).toBeGreaterThan(lastHeight);
  lastWidth = selectedRect.width;
  lastHeight = selectedRect.height;

  // try to decrease height
  await resizeElementByHandle(page, { x: 0, y: -50 }, 'bottom-right');
  // you can't decrease height because of min height to fit text
  selectedRect = await getEdgelessSelectedRect(page);
  expect(selectedRect.width).toBe(lastWidth);
  expect(selectedRect.height).toBeGreaterThanOrEqual(lastHeight);
  lastWidth = selectedRect.width;
  lastHeight = selectedRect.height;

  // increase width to make text not wrap
  await resizeElementByHandle(page, { x: 50, y: -10 }, 'bottom-right');
  // the height of shape should be decreased because of long text not wrap
  selectedRect = await getEdgelessSelectedRect(page);
  expect(selectedRect.width).toBeGreaterThan(lastWidth);
  expect(selectedRect.height).toBeLessThan(lastHeight);

  // try to decrease width
  await resizeElementByHandle(page, { x: -140, y: 0 }, 'bottom-right');
  // you can't decrease width after text can't wrap (each line just has 1 char)
  await assertEdgelessSelectedRect(page, [200, 150, 52, 404]);
});

test('change shape style', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  const start = { x: 100, y: 150 };
  const end = { x: 200, y: 250 };
  await addBasicRectShapeElement(page, start, end);

  await page.mouse.click(start.x + 5, start.y + 5);
  await triggerComponentToolbarAction(page, 'changeShapeStyle');
  await changeShapeStyle(page, 'general');
  await waitNextFrame(page);

  await page.mouse.click(start.x + 5, start.y + 5);
  await triggerComponentToolbarAction(page, 'changeShapeStrokeColor');
  const color = '--affine-palette-line-teal';
  await changeShapeStrokeColor(page, color);
  await page.waitForTimeout(50);
  const [picked] = await pickColorAtPoints(page, [[start.x + 1, start.y + 1]]);

  await assertEdgelessColorSameWithHexColor(page, color, picked);
});

test('shape adds text by button', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);
  await zoomResetByKeyboard(page);

  await setEdgelessTool(page, 'shape');
  await waitNextFrame(page, 500);

  await page.mouse.click(200, 150);
  await waitNextFrame(page);

  await triggerComponentToolbarAction(page, 'addText');
  await type(page, 'hello');
  await assertEdgelessCanvasText(page, 'hello');
});

test('should reset shape text when text is empty', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);
  await zoomResetByKeyboard(page);

  await setEdgelessTool(page, 'shape');
  await waitNextFrame(page, 500);

  await page.mouse.click(200, 150);
  await waitNextFrame(page);

  await triggerComponentToolbarAction(page, 'addText');
  await type(page, ' a ');
  await assertEdgelessCanvasText(page, ' a ');

  await page.mouse.click(0, 0);
  await waitNextFrame(page);
  await page.mouse.click(200, 150);

  const addTextBtn = locatorComponentToolbar(page).getByRole('button', {
    name: 'Add text',
  });
  await expect(addTextBtn).toBeHidden();

  await page.mouse.dblclick(250, 200);
  await assertEdgelessCanvasText(page, 'a');

  await page.keyboard.press('Backspace');
  await assertEdgelessCanvasText(page, '');

  await page.mouse.click(0, 0);
  await waitNextFrame(page);
  await page.mouse.click(200, 150);

  await expect(addTextBtn).toBeVisible();
});

test.describe('shape hit test', () => {
  async function addTransparentRect(
    page: Page,
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) {
    const rect = {
      start,
      end,
    };
    await addBasicRectShapeElement(page, rect.start, rect.end);

    await page.mouse.click(rect.start.x + 5, rect.start.y + 5);
    await triggerComponentToolbarAction(page, 'changeShapeFillColor');
    const color = '--affine-palette-transparent';
    await changeShapeFillColor(page, color);
    await page.waitForTimeout(50);
  }

  test.beforeEach(async ({ page }) => {
    await enterPlaygroundRoom(page, {
      flags: {
        enable_edgeless_text: false,
      },
    });
    await initEmptyEdgelessState(page);
    await switchEditorMode(page);
  });

  const rect = {
    start: { x: 100, y: 100 },
    end: { x: 200, y: 200 },
  };

  test('can select hollow shape by clicking center area', async ({ page }) => {
    await addTransparentRect(page, rect.start, rect.end);
    await page.mouse.click(rect.start.x - 20, rect.start.y - 20);
    await assertEdgelessNonSelectedRect(page);

    await page.mouse.click(rect.start.x + 50, rect.start.y + 50);
    await assertEdgelessSelectedRect(page, [100, 100, 100, 100]);
  });

  test('double click can add text in shape hollow area', async ({ page }) => {
    await addTransparentRect(page, rect.start, rect.end);
    await page.mouse.click(rect.start.x - 20, rect.start.y - 20);
    await assertEdgelessNonSelectedRect(page);

    await assertEdgelessTool(page, 'default');
    await page.mouse.dblclick(rect.start.x + 20, rect.start.y + 20);
    await waitNextFrame(page);

    await type(page, 'hello');
    await assertEdgelessCanvasText(page, 'hello');
  });

  test('using text tool to add text in shape hollow area', async ({ page }) => {
    await addTransparentRect(page, rect.start, rect.end);
    await page.mouse.click(rect.start.x - 20, rect.start.y - 20);
    await assertEdgelessNonSelectedRect(page);

    await assertEdgelessTool(page, 'default');
    await setEdgelessTool(page, 'text');
    await page.mouse.click(rect.start.x + 20, rect.start.y + 20);
    await waitNextFrame(page);

    await type(page, 'hello');
    await assertEdgelessCanvasText(page, 'hello');
  });
});
