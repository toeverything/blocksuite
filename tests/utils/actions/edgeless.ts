/* eslint-disable @typescript-eslint/no-restricted-imports */
import '../declare-test-window.js';

import { expect, Page } from '@playwright/test';

import type { FrameBlockModel } from '../../../packages/blocks/src/index.js';
import { dragBetweenCoords } from './drag.js';

export async function getFrameSize(
  page: Page,
  ids: { pageId: string; frameId: string; paragraphId: string }
) {
  const result: string | null = await page.evaluate(
    ([id]) => {
      const page = window.workspace.getPage('page0');
      const block = page?.getBlockById(id.frameId);
      if (block?.flavour === 'affine:frame') {
        return (block as FrameBlockModel).xywh;
      } else {
        return null;
      }
    },
    [ids] as const
  );
  expect(result).not.toBeNull();
  return result as string;
}

export async function switchEditorMode(page: Page) {
  await page.click('sl-button[content="Switch Editor Mode"]');
}

export function locatorPanButton(page: Page, innerContainer = true) {
  const panButton = page.locator('edgeless-tool-icon-button').filter({
    hasText: 'Hand',
  });

  return innerContainer ? panButton.locator('.icon-container') : panButton;
}

export async function setMouseMode(
  page: Page,
  mode: 'default' | 'shape' | 'brush' | 'pan'
) {
  if (mode === 'default') {
    const defaultModeButton = page.locator('edgeless-tool-icon-button').filter({
      hasText: 'Select',
    });
    await defaultModeButton.click();
  } else if (mode === 'shape') {
    const shapeToolButton = page.locator('edgeless-shape-tool-button');
    await shapeToolButton.click();

    const squareShapeButton = page
      .locator('edgeless-tool-icon-button')
      .filter({ hasText: 'Square' });
    await squareShapeButton.click();
  } else if (mode === 'brush') {
    const brushButton = page.locator('edgeless-tool-icon-button').filter({
      hasText: 'Pen',
    });
    await brushButton.click();
  } else if (mode === 'pan') {
    const panButton = locatorPanButton(page, false);
    await panButton.click();
  }
}

export async function switchShapeType(page: Page, shapeType: string) {
  // TODO
}

export async function getEdgelessHoverRect(page: Page) {
  const hoverRect = page.locator('.affine-edgeless-hover-rect');
  const box = await hoverRect.boundingBox();
  if (!box) throw new Error('Missing edgeless hover rect');
  return box;
}

export async function decreaseZoomLevel(page: Page) {
  const btn = page
    .locator('edgeless-view-control-bar edgeless-tool-icon-button')
    .first();
  await btn.click();
}

export async function increaseZoomLevel(page: Page) {
  const btn = page
    .locator('edgeless-view-control-bar edgeless-tool-icon-button')
    .nth(1);
  await btn.click();
}

export async function addBasicBrushElement(
  page: Page,
  start: { x: number; y: number },
  end: { x: number; y: number }
) {
  await setMouseMode(page, 'brush');
  await dragBetweenCoords(page, start, end, { steps: 100 });
  await setMouseMode(page, 'default');
}

export async function addBasicRectShapeElement(
  page: Page,
  start: { x: number; y: number },
  end: { x: number; y: number }
) {
  await setMouseMode(page, 'shape');
  await dragBetweenCoords(page, start, end, { steps: 10 });
  await setMouseMode(page, 'default');
}

export async function resizeElementByLeftTopHandle(
  page: Page,
  delta: { x: number; y: number },
  steps = 1
) {
  const leftTopHandler = page.locator('[aria-label="handle-left-top"]');
  const box = await leftTopHandler.boundingBox();
  if (box === null) throw new Error();
  await dragBetweenCoords(
    page,
    { x: box.x + 5, y: box.y + 5 },
    { x: box.x + delta.x + 5, y: box.y + delta.y + 5 },
    {
      steps,
    }
  );
}
