import { expect } from '@playwright/test';

import * as actions from '../utils/actions/edgeless.js';
import {
  Shape,
  getNoteBoundBoxInEdgeless,
  setEdgelessTool,
  switchEditorMode,
  toModelCoord,
} from '../utils/actions/edgeless.js';
import {
  addBasicBrushElement,
  addBasicConnectorElement,
  addBasicRectShapeElement,
  clickInCenter,
  createConnectorElement,
  createShapeElement,
  dragBetweenCoords,
  enterPlaygroundRoom,
  getBoundingRect,
  initEmptyEdgelessState,
  initThreeParagraphs,
  pressEnter,
  waitNextFrame,
} from '../utils/actions/index.js';
import {
  assertBlockCount,
  assertEdgelessDraggingArea,
  assertEdgelessNonSelectedRect,
  assertEdgelessSelectedRect,
  assertSelectionInNote,
} from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

test('should update rect of selection when resizing viewport', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await actions.switchEditorMode(page);
  await actions.zoomResetByKeyboard(page);

  await addBasicRectShapeElement(page, { x: 100, y: 100 }, { x: 200, y: 200 });
  await dragBetweenCoords(page, { x: 120, y: 90 }, { x: 220, y: 130 });

  const selectedRectClass = '.affine-edgeless-selected-rect';

  await actions.zoomResetByKeyboard(page);

  await assertEdgelessSelectedRect(page, [100, 100, 100, 100]);

  await actions.decreaseZoomLevel(page);
  await waitNextFrame(page);
  await actions.decreaseZoomLevel(page);
  await waitNextFrame(page);
  const selectedRectInZoom = await getBoundingRect(page, selectedRectClass);
  await assertEdgelessSelectedRect(page, [
    selectedRectInZoom.x,
    selectedRectInZoom.y,
    50,
    50,
  ]);

  await actions.switchEditorEmbedMode(page);
  await waitNextFrame(page);
  const selectedRectInEmbed = await getBoundingRect(page, selectedRectClass);
  await assertEdgelessSelectedRect(page, [
    selectedRectInEmbed.x,
    selectedRectInEmbed.y,
    50,
    50,
  ]);

  await actions.switchEditorEmbedMode(page);
  await actions.increaseZoomLevel(page);
  await waitNextFrame(page);
  await actions.increaseZoomLevel(page);
  await waitNextFrame(page);
  await assertEdgelessSelectedRect(page, [100, 100, 100, 100]);
});

test.describe('translation should constrain to cur axis when dragged with shift key', () => {
  test('constrain-x', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyEdgelessState(page);

    await switchEditorMode(page);

    await addBasicRectShapeElement(
      page,
      { x: 100, y: 100 },
      { x: 200, y: 200 }
    );

    await page.mouse.move(110, 110);
    await page.mouse.down();

    await assertEdgelessSelectedRect(page, [100, 100, 100, 100]);
    await page.keyboard.down('Shift');
    await page.mouse.move(110, 200); // constrain to y
    await page.mouse.move(300, 200); // constrain to x
    await assertEdgelessSelectedRect(page, [290, 100, 100, 100]); // y should remain same as constrained to x
  });

  test('constrain-y', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyEdgelessState(page);

    await switchEditorMode(page);

    await addBasicRectShapeElement(
      page,
      { x: 100, y: 100 },
      { x: 200, y: 200 }
    );

    await page.mouse.move(110, 110);
    await page.mouse.down();

    await assertEdgelessSelectedRect(page, [100, 100, 100, 100]);
    await page.keyboard.down('Shift');
    await page.mouse.move(200, 110); // constrain to x
    await page.mouse.move(200, 300); // constrain to y
    await assertEdgelessSelectedRect(page, [100, 290, 100, 100]); // x should remain same as constrained to y
  });
});

test('select multiple shapes and translate', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);

  await switchEditorMode(page);
  await actions.zoomResetByKeyboard(page);

  await addBasicBrushElement(page, { x: 100, y: 100 }, { x: 200, y: 200 });
  await page.mouse.click(110, 110);
  await assertEdgelessSelectedRect(page, [98, 98, 104, 104]);

  await addBasicRectShapeElement(page, { x: 210, y: 110 }, { x: 310, y: 210 });
  await page.mouse.click(220, 120);
  await assertEdgelessSelectedRect(page, [210, 110, 100, 100]);

  await dragBetweenCoords(page, { x: 120, y: 90 }, { x: 220, y: 130 });
  await assertEdgelessSelectedRect(page, [98, 98, 212, 112]);

  await dragBetweenCoords(page, { x: 120, y: 120 }, { x: 150, y: 150 });
  await assertEdgelessSelectedRect(page, [128, 128, 212, 112]);

  await page.mouse.click(160, 160);
  await assertEdgelessSelectedRect(page, [128, 128, 104, 104]);

  await page.mouse.click(250, 150);
  await assertEdgelessSelectedRect(page, [240, 140, 100, 100]);
});

test('select multiple shapes and press "Escape" to cancel selection', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);

  await switchEditorMode(page);
  await actions.zoomResetByKeyboard(page);

  await addBasicBrushElement(page, { x: 100, y: 100 }, { x: 200, y: 200 });
  await page.mouse.click(110, 110);
  await assertEdgelessSelectedRect(page, [98, 98, 104, 104]);

  await addBasicRectShapeElement(page, { x: 210, y: 110 }, { x: 310, y: 210 });
  await page.mouse.click(220, 120);
  await assertEdgelessSelectedRect(page, [210, 110, 100, 100]);

  // Select both shapes
  await dragBetweenCoords(page, { x: 90, y: 90 }, { x: 320, y: 220 });

  // assert all shapes are selected
  await assertEdgelessSelectedRect(page, [98, 98, 212, 112]);

  // Press "Escape" to cancel the selection
  await page.keyboard.press('Escape');

  await assertEdgelessNonSelectedRect(page);
});

test('selection box of shape element sync on fast dragging', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);
  await actions.zoomResetByKeyboard(page);

  await setEdgelessTool(page, 'shape');
  await dragBetweenCoords(page, { x: 100, y: 100 }, { x: 200, y: 200 });
  await setEdgelessTool(page, 'default');
  await dragBetweenCoords(
    page,
    { x: 110, y: 110 },
    { x: 660, y: 460 },
    { click: true }
  );

  await assertEdgelessSelectedRect(page, [650, 450, 100, 100]);
});

test('when the selection is always a note, it should remain in an active state', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  const ids = await initEmptyEdgelessState(page);
  await initThreeParagraphs(page);

  await switchEditorMode(page);
  await actions.zoomResetByKeyboard(page);
  const bound = await getNoteBoundBoxInEdgeless(page, ids.noteId);

  await setEdgelessTool(page, 'note');
  const newNoteX = bound.x;
  const newNoteY = bound.y + bound.height + 100;
  // add text
  await page.mouse.click(newNoteX, newNoteY);
  await waitNextFrame(page);
  await page.keyboard.type('hello');
  await pressEnter(page);
  // should wait for inline editor update and resizeObserver callback
  await waitNextFrame(page);
  // assert add text success
  await assertBlockCount(page, 'edgeless-note', 2);

  await clickInCenter(page, bound);
  await clickInCenter(page, bound);
  await waitNextFrame(page);
  await assertSelectionInNote(page, ids.noteId, 'affine-edgeless-note');
});

test('should auto panning when selection rectangle reaches viewport edges', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);

  await switchEditorMode(page);
  await actions.zoomResetByKeyboard(page);

  await addBasicRectShapeElement(page, { x: 200, y: 100 }, { x: 300, y: 200 });
  await page.mouse.click(210, 110);
  await assertEdgelessSelectedRect(page, [200, 100, 100, 100]);

  const selectedRectClass = '.affine-edgeless-selected-rect';

  // Panning to the left
  await setEdgelessTool(page, 'pan');
  await dragBetweenCoords(
    page,
    {
      x: 600,
      y: 200,
    },
    {
      x: 200,
      y: 200,
    }
  );
  await setEdgelessTool(page, 'default');
  await page.mouse.click(210, 110);
  let selectedRect = page.locator(selectedRectClass);
  await page.waitForTimeout(300);
  await expect(selectedRect).toBeHidden();
  // Click to start selection and hold the mouse to trigger auto panning to the left
  await page.mouse.move(210, 110);
  await page.mouse.down();
  await page.mouse.move(0, 210, { steps: 20 });
  await page.waitForTimeout(500);
  await page.mouse.up();

  // Expect to select the shape element
  selectedRect = page.locator(selectedRectClass);
  await page.waitForTimeout(300);
  await expect(selectedRect).toBeVisible();

  // Panning to the top
  await page.mouse.click(400, 600);
  await setEdgelessTool(page, 'pan');
  await dragBetweenCoords(
    page,
    {
      x: 400,
      y: 600,
    },
    {
      x: 400,
      y: 100,
    }
  );
  await setEdgelessTool(page, 'default');
  await page.mouse.click(600, 100);
  selectedRect = page.locator(selectedRectClass);
  await page.waitForTimeout(300);
  await expect(selectedRect).toBeHidden();
  // Click to start selection and hold the mouse to trigger auto panning to the top
  await page.mouse.move(600, 100);
  await page.mouse.down();
  await page.mouse.move(400, 0, { steps: 20 });
  await page.waitForTimeout(500);
  await page.mouse.up();

  // Expect to select the empty note
  selectedRect = page.locator(selectedRectClass);
  await page.waitForTimeout(300);
  await expect(selectedRect).toBeVisible();

  // Panning to the right
  await page.mouse.click(100, 600);
  await setEdgelessTool(page, 'pan');
  await dragBetweenCoords(
    page,
    {
      x: 20,
      y: 600,
    },
    {
      x: 1000,
      y: 600,
    }
  );
  await setEdgelessTool(page, 'default');
  await page.mouse.click(800, 600);
  selectedRect = page.locator(selectedRectClass);
  await page.waitForTimeout(100);
  await expect(selectedRect).toBeHidden();
  // Click to start selection and hold the mouse to trigger auto panning to the right
  await dragBetweenCoords(
    page,
    {
      x: 800,
      y: 600,
    },
    {
      x: 950,
      y: 200,
    },
    {
      beforeMouseUp: async () => {
        await page.waitForTimeout(600);
      },
    }
  );

  // Expect to select the empty note
  selectedRect = page.locator(selectedRectClass);
  await page.waitForTimeout(300);
  await expect(selectedRect).toBeVisible();

  // Panning to the bottom
  await page.mouse.click(400, 100);
  await setEdgelessTool(page, 'pan');
  await dragBetweenCoords(
    page,
    {
      x: 400,
      y: 100,
    },
    {
      x: 400,
      y: 850,
    },
    {
      click: true,
    }
  );
  await setEdgelessTool(page, 'default');
  await page.mouse.click(200, 800);
  selectedRect = page.locator(selectedRectClass);
  await page.waitForTimeout(100);
  await expect(selectedRect).toBeHidden();

  // Click to start selection and hold the mouse to trigger auto panning to the right
  await dragBetweenCoords(
    page,
    {
      x: 800,
      y: 300,
    },
    {
      x: 820,
      y: 1150,
    },
    {
      click: true,
      beforeMouseUp: async () => {
        await page.waitForTimeout(500);
      },
    }
  );

  // Expect to select the empty note
  selectedRect = page.locator(selectedRectClass);
  await page.waitForTimeout(300);
  await expect(selectedRect).toBeVisible();
});

test('should also update dragging area when viewport changes', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);

  await switchEditorMode(page);
  await actions.zoomResetByKeyboard(page);

  // Panning to the top
  await page.mouse.click(400, 600);
  await setEdgelessTool(page, 'pan');
  await dragBetweenCoords(
    page,
    {
      x: 400,
      y: 600,
    },
    {
      x: 400,
      y: 100,
    }
  );
  await setEdgelessTool(page, 'default');
  await page.mouse.click(200, 300);

  const selectedRectClass = '.affine-edgeless-selected-rect';
  let selectedRect = page.locator(selectedRectClass);
  await expect(selectedRect).toBeHidden();
  // set up initial dragging area
  await page.mouse.move(200, 300);
  await page.mouse.down();
  await page.mouse.move(600, 200, { steps: 20 });
  await page.waitForTimeout(300);

  // wheel the viewport to the top
  await page.mouse.wheel(0, -300);
  await page.waitForTimeout(300);
  await page.mouse.up();

  // Expect to select the empty note
  selectedRect = page.locator(selectedRectClass);
  await page.waitForTimeout(300);
  await expect(selectedRect).toBeVisible();
  await page.waitForTimeout(300);
});

test('should move selection drag area when holding spaceBar', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);
  await actions.zoomResetByKeyboard(page);
  await setEdgelessTool(page, 'default');

  // Click to start the initial dragging area
  await page.mouse.click(100, 100);

  const initialX = 100,
    initialY = 100;
  const finalX = 300,
    finalY = 300;

  await dragBetweenCoords(
    page,
    { x: initialX, y: initialY },
    { x: finalX, y: finalY },
    {
      beforeMouseUp: async () => {
        await page.keyboard.down('Space');

        const dx = 100,
          dy = 100;
        await page.mouse.move(finalX + dx, finalY + dy);
        await assertEdgelessDraggingArea(page, [
          initialX + dx,
          initialY + dy,
          // width and height should be same
          finalX - initialX,
          finalY - initialY,
        ]);

        await page.keyboard.up('Space');
      },
    }
  );
});

test('should be able to update selection dragging area after releasing space', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);
  await actions.zoomResetByKeyboard(page);
  await setEdgelessTool(page, 'default');

  // Click to start the initial dragging area
  await page.mouse.click(100, 100);

  const initialX = 100,
    initialY = 100;
  const finalX = 300,
    finalY = 300;

  await dragBetweenCoords(
    page,
    { x: initialX, y: initialY },
    { x: finalX, y: finalY },
    {
      beforeMouseUp: async () => {
        await page.keyboard.down('Space');

        const dx = 100,
          dy = 100;

        // Move the mouse to simulate dragging with spaceBar held
        await page.mouse.move(finalX + dx, finalY + dy);

        await page.keyboard.up('Space');
        // scale after moving
        const dSx = 100;
        const dSy = 100;

        await page.mouse.move(finalX + dx + dSx, finalY + dy + dSy);

        await assertEdgelessDraggingArea(page, [
          initialX + dx,
          initialY + dy,
          // In the second scale it should scale by dS(.)
          finalX - initialX + dSx,
          finalY - initialY + dSy,
        ]);
      },
    }
  );
});

test('should select shapes while moving selection', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);
  await actions.zoomResetByKeyboard(page);

  await addBasicRectShapeElement(page, { x: 100, y: 100 }, { x: 200, y: 200 });

  // Make the selection out side the rect and move the selection to the rect
  await dragBetweenCoords(
    page,
    // Make the selection not selecting the rect
    { x: 70, y: 70 },
    { x: 90, y: 90 },
    {
      beforeMouseUp: async () => {
        await page.keyboard.down('Space');
        // Move the selection over to the rect
        await page.mouse.move(120, 120);
        await page.keyboard.up('Space');
      },
    }
  );

  await assertEdgelessSelectedRect(page, [100, 100, 100, 100]);

  await addBasicBrushElement(page, { x: 210, y: 100 }, { x: 310, y: 300 });
  await page.mouse.click(211, 101);

  // Make a wide selection and move it to select both of the shapes
  await dragBetweenCoords(
    page,
    // Make the selection above the spaces
    { x: 70, y: 70 },
    { x: 400, y: 90 },
    {
      beforeMouseUp: async () => {
        await page.keyboard.down('Space');
        // Move the selection over both of the shapes
        await page.mouse.move(400, 120);
        await page.keyboard.up('Space');
      },
    }
  );

  await assertEdgelessSelectedRect(page, [100, 98, 212, 204]);
});

test('selection drag-area start should be same when space is pressed again', async ({
  page,
}) => {
  //? This test is to check whether there is any flicker or jump when using the space again in the same selection

  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);
  await actions.zoomResetByKeyboard(page);

  // Make the selection out side the rect and move the selection to the rect
  await dragBetweenCoords(
    page,
    // Make the selection not selecting the rect
    { x: 100, y: 100 },
    { x: 200, y: 200 },
    {
      beforeMouseUp: async () => {
        await page.keyboard.down('Space');
        // Move the selection over to the rect
        await page.mouse.move(300, 300);

        let draggingArea = page.locator('.affine-edgeless-dragging-area');
        const firstBound = await draggingArea.boundingBox();

        await page.keyboard.up('Space');

        await page.mouse.move(400, 400);
        await page.keyboard.down('Space');

        await page.mouse.move(410, 410);
        await page.mouse.move(400, 400);

        draggingArea = page.locator('.affine-edgeless-dragging-area');
        const newBound = await draggingArea.boundingBox();

        expect(firstBound).not.toBe(null);
        expect(newBound).not.toBe(null);

        const { x: fx, y: fy } = firstBound!;
        const { x: nx, y: ny } = newBound!;

        expect([fx, fy]).toStrictEqual([nx, ny]);
      },
    }
  );
});

test.describe('select multiple connectors', () => {
  test('should show single selection rect', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyEdgelessState(page);
    await switchEditorMode(page);
    await actions.zoomResetByKeyboard(page);

    await addBasicConnectorElement(
      page,
      { x: 100, y: 200 },
      { x: 300, y: 200 }
    );
    await addBasicConnectorElement(
      page,
      { x: 100, y: 230 },
      { x: 300, y: 230 }
    );
    await addBasicConnectorElement(
      page,
      { x: 100, y: 260 },
      { x: 300, y: 260 }
    );

    await dragBetweenCoords(page, { x: 50, y: 50 }, { x: 400, y: 290 });
    await waitNextFrame(page);

    expect(
      await page
        .locator('.affine-edgeless-selected-rect')
        .locator('.element-handle')
        .count()
    ).toBe(0);
  });

  test('should disable resize when a connector is already connected', async ({
    page,
  }) => {
    await enterPlaygroundRoom(page);
    await initEmptyEdgelessState(page);
    await switchEditorMode(page);
    await actions.zoomResetByKeyboard(page);

    const start = await toModelCoord(page, [100, 0]);
    const end = await toModelCoord(page, [200, 100]);
    await createShapeElement(page, start, end, Shape.Diamond);
    const c1 = await toModelCoord(page, [200, 50]);
    const c2 = await toModelCoord(page, [450, 50]);
    await createConnectorElement(page, c1, c2);

    await addBasicConnectorElement(
      page,
      { x: 250, y: 200 },
      { x: 450, y: 200 }
    );
    await addBasicConnectorElement(
      page,
      { x: 250, y: 230 },
      { x: 450, y: 230 }
    );
    await addBasicConnectorElement(
      page,
      { x: 250, y: 260 },
      { x: 450, y: 260 }
    );

    await dragBetweenCoords(page, { x: 500, y: 20 }, { x: 400, y: 290 });
    await waitNextFrame(page);

    const selectedRectLocalor = page.locator('.affine-edgeless-selected-rect');
    expect(await selectedRectLocalor.locator('.element-handle').count()).toBe(
      0
    );
    expect(
      await selectedRectLocalor.locator('.handle').locator('.resize').count()
    ).toBe(0);
  });
});
