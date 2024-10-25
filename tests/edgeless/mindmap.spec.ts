import type { MindmapElementModel } from '@blocksuite/affine-model';

import { expect } from '@playwright/test';
import { clickView } from 'utils/actions/click.js';
import { dragBetweenCoords } from 'utils/actions/drag.js';
import {
  addBasicRectShapeElement,
  autoFit,
  edgelessCommonSetup,
  getSelectedBound,
  getSelectedBoundCount,
  zoomResetByKeyboard,
} from 'utils/actions/edgeless.js';
import {
  pressBackspace,
  selectAllByKeyboard,
  undoByKeyboard,
} from 'utils/actions/keyboard.js';
import { waitNextFrame } from 'utils/actions/misc.js';
import {
  assertEdgelessSelectedRect,
  assertSelectedBound,
} from 'utils/asserts.js';

import { test } from '../utils/playwright.js';

test('elements should be selectable after open mindmap menu', async ({
  page,
}) => {
  await edgelessCommonSetup(page);

  const start = { x: 100, y: 100 };
  const end = { x: 200, y: 200 };
  await addBasicRectShapeElement(page, start, end);

  await page.locator('.basket-wrapper').click({ position: { x: 0, y: 0 } });
  await expect(page.locator('edgeless-mindmap-menu')).toBeVisible();

  await page.mouse.click(start.x + 5, start.y + 5);
  await assertEdgelessSelectedRect(page, [100, 100, 100, 100]);
});

test('undo deletion of mindmap should restore the deleted element', async ({
  page,
}) => {
  await edgelessCommonSetup(page);
  await zoomResetByKeyboard(page);

  await page.keyboard.press('m');
  await clickView(page, [0, 0]);
  await autoFit(page);

  await selectAllByKeyboard(page);
  const mindmapBound = await getSelectedBound(page);

  await pressBackspace(page);

  await selectAllByKeyboard(page);
  expect(await getSelectedBoundCount(page)).toBe(0);

  await undoByKeyboard(page);

  await selectAllByKeyboard(page);
  await assertSelectedBound(page, mindmapBound);
});

test('drag mind map node to reorder the node', async ({ page }) => {
  await edgelessCommonSetup(page);
  await zoomResetByKeyboard(page);

  await page.keyboard.press('m');
  await clickView(page, [0, 0]);
  await autoFit(page);

  const { mindmapId, nodeId, nodeRect } = await page.evaluate(() => {
    const edgelessBlock = document.querySelector('affine-edgeless-root');
    if (!edgelessBlock) {
      throw new Error('edgeless block not found');
    }
    const mindmap = edgelessBlock.gfx.gfxElements.filter(
      el => 'type' in el && el.type === 'mindmap'
    )[0] as MindmapElementModel;
    const node = mindmap.tree.children[0].element;
    const rect = edgelessBlock.gfx.viewport.toViewBound(node.elementBound);

    edgelessBlock.gfx.selection.set({ elements: [node.id] });

    return {
      mindmapId: mindmap.id,
      nodeId: node.id,
      nodeRect: {
        x: rect.x,
        y: rect.y,
        w: rect.w,
        h: rect.h,
      },
    };
  });

  await waitNextFrame(page, 100);

  await dragBetweenCoords(
    page,
    { x: nodeRect.x + nodeRect.w / 2, y: nodeRect.y + nodeRect.h / 2 },
    { x: nodeRect.x + nodeRect.w / 2, y: nodeRect.y + nodeRect.h / 2 + 120 },
    {
      steps: 50,
    }
  );

  const secondNodeId = await page.evaluate(
    ({ mindmapId }) => {
      const edgelessBlock = document.querySelector('affine-edgeless-root');
      if (!edgelessBlock) {
        throw new Error('edgeless block not found');
      }
      const mindmap = edgelessBlock.gfx.getElementById(
        mindmapId
      ) as MindmapElementModel;

      return mindmap.tree.children[1].id;
    },
    { mindmapId, nodeId }
  );

  expect(secondNodeId).toEqual(nodeId);
});
