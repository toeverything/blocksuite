import type { GfxModel } from '@blocksuite/block-std/gfx';

import {
  ConnectorElementModel,
  EdgelessTextBlockModel,
  EmbedSyncedDocModel,
  MindmapElementModel,
  NoteBlockModel,
} from '@blocksuite/affine-model';
import { Bound } from '@blocksuite/global/utils';
import chunk from 'lodash.chunk';

const ALIGN_HEIGHT = 200;
const ALIGN_PADDING = 20;

import type { Command } from '@blocksuite/block-std';
import type { BlockModel, BlockProps } from '@blocksuite/store';

import { updateXYWH } from '../utils/update-xywh.js';

/**
 * Automatically arrange elements according to fixed row and column rules
 */
export const autoArrangeElementsCommand: Command<never, never, {}> = (
  ctx,
  next
) => {
  const { updateBlock } = ctx.std.doc;
  const rootService = ctx.std.getService('affine:page');
  // @ts-ignore TODO: fix after edgeless refactor
  const elements = rootService?.selection.selectedElements;
  // @ts-ignore TODO: fix after edgeless refactor
  const updateElement = rootService?.updateElement;
  if (elements && updateElement) {
    autoArrangeElements(elements, updateElement, updateBlock);
  }
  next();
};

/**
 * Adjust the height of the selected element to a fixed value and arrange the elements
 */
export const autoResizeElementsCommand: Command<never, never, {}> = (
  ctx,
  next
) => {
  const { updateBlock } = ctx.std.doc;
  const rootService = ctx.std.getService('affine:page');
  // @ts-ignore TODO: fix after edgeless refactor
  const elements = rootService?.selection.selectedElements;
  // @ts-ignore TODO: fix after edgeless refactor
  const updateElement = rootService?.updateElement;
  if (elements && updateElement) {
    autoResizeElements(elements, updateElement, updateBlock);
  }
  next();
};

function splitElementsToChunks(models: GfxModel[]) {
  const sortByCenterX = (a: GfxModel, b: GfxModel) =>
    a.elementBound.center[0] - b.elementBound.center[0];
  const sortByCenterY = (a: GfxModel, b: GfxModel) =>
    a.elementBound.center[1] - b.elementBound.center[1];
  const elements = models.filter(ele => {
    if (
      ele instanceof ConnectorElementModel &&
      (ele.target.id || ele.source.id)
    ) {
      return false;
    }
    return true;
  });
  elements.sort(sortByCenterY);
  const chunks = chunk(elements, 4);
  chunks.forEach(items => items.sort(sortByCenterX));
  return chunks;
}

function autoArrangeElements(
  elements: GfxModel[],
  updateElement: (id: string, props: Record<string, unknown>) => void,
  updateBlock: (
    model: BlockModel,
    callBackOrProps: (() => void) | Partial<BlockProps>
  ) => void
) {
  const chunks = splitElementsToChunks(elements);
  // update element XY
  const startX: number = chunks[0][0].elementBound.x;
  let startY: number = chunks[0][0].elementBound.y;
  chunks.forEach(items => {
    let posX = startX;
    let maxHeight = 0;
    items.forEach(ele => {
      const { x: eleX, y: eleY } = ele.elementBound;
      const bound = Bound.deserialize(ele.xywh);
      const xOffset = bound.x - eleX;
      const yOffset = bound.y - eleY;
      bound.x = posX + xOffset;
      bound.y = startY + yOffset;
      updateXYWH(ele, bound, updateElement, updateBlock);
      if (ele.elementBound.h > maxHeight) {
        maxHeight = ele.elementBound.h;
      }
      posX += ele.elementBound.w + ALIGN_PADDING;
    });
    startY += maxHeight + ALIGN_PADDING;
  });
}

function autoResizeElements(
  elements: GfxModel[],
  updateElement: (id: string, props: Record<string, unknown>) => void,
  updateBlock: (
    model: BlockModel,
    callBackOrProps: (() => void) | Partial<BlockProps>
  ) => void
) {
  // resize or scale to fixed height
  elements.forEach(ele => {
    if (
      ele instanceof ConnectorElementModel ||
      ele instanceof MindmapElementModel
    ) {
      return;
    }

    if (ele instanceof NoteBlockModel) {
      const curScale = ele.edgeless.scale ?? 1;
      const nextScale = curScale * (ALIGN_HEIGHT / ele.elementBound.h);
      const bound = Bound.deserialize(ele.xywh);
      bound.h = bound.h * (nextScale / curScale);
      bound.w = bound.w * (nextScale / curScale);
      updateElement(ele.id, {
        edgeless: {
          ...ele.edgeless,
          scale: nextScale,
        },
        xywh: bound.serialize(),
      });
    } else if (
      ele instanceof EdgelessTextBlockModel ||
      ele instanceof EmbedSyncedDocModel
    ) {
      const curScale = ele.scale ?? 1;
      const nextScale = curScale * (ALIGN_HEIGHT / ele.elementBound.h);
      const bound = Bound.deserialize(ele.xywh);
      bound.h = bound.h * (nextScale / curScale);
      bound.w = bound.w * (nextScale / curScale);
      updateElement(ele.id, {
        scale: nextScale,
        xywh: bound.serialize(),
      });
    } else {
      const bound = Bound.deserialize(ele.xywh);
      const scale = ALIGN_HEIGHT / ele.elementBound.h;
      bound.h = scale * bound.h;
      bound.w = scale * bound.w;
      updateXYWH(ele, bound, updateElement, updateBlock);
    }
  });

  // arrange
  autoArrangeElements(elements, updateElement, updateBlock);
}
