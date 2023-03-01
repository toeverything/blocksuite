/* eslint-disable @typescript-eslint/no-restricted-imports */
import '../declare-test-window.js';

import { expect, Page } from '@playwright/test';

import type { FrameBlockModel } from '../../../packages/blocks/src/index.js';

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

export async function setMouseMode(page: Page, mode: 'default' | 'shape') {
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
