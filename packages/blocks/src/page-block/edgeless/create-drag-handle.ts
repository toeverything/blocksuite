import {
  type BlockComponentElement,
  doesInSamePath,
  type EditingState,
  getBlockElementsExcludeSubtrees,
  getClosestBlockElementByPoint,
  getClosestFrameBlockElementById,
  getHoveringFrame,
  getModelByBlockElement,
  getRectByBlockElement,
  type Point,
  Rect,
} from '@blocksuite/blocks/std';
import { assertExists } from '@blocksuite/store';

import { DragHandle } from '../../components/index.js';
import type { EdgelessPageBlockComponent } from './edgeless-page-block.js';

export function createDragHandle(pageBlock: EdgelessPageBlockComponent) {
  return new DragHandle({
    // Drag handle should be at the same level with EditorContainer
    container: pageBlock.mouseRoot as HTMLElement,
    onDropCallback(point, blockElements, editingState, type) {
      if (type === 'none') return;

      const blockElementsExcludeSubtrees =
        getBlockElementsExcludeSubtrees(blockElements);
      if (!blockElementsExcludeSubtrees.length) return;

      const models = blockElementsExcludeSubtrees.map(getModelByBlockElement);
      if (!models.length) return;

      const page = pageBlock.page;

      if (editingState) {
        const { rect, model } = editingState;
        if (models.length === 1 && doesInSamePath(page, model, models[0])) {
          return;
        }

        const focusId = models[0].id;
        const targetFrameBlock = getClosestFrameBlockElementById(
          model.id,
          pageBlock
        ) as BlockComponentElement;
        assertExists(targetFrameBlock);
        const frameBlock = getClosestFrameBlockElementById(
          focusId,
          pageBlock
        ) as BlockComponentElement;
        assertExists(frameBlock);

        page.captureSync();

        if (type === 'database') {
          page.moveBlocks(models, model);
        } else {
          const distanceToTop = Math.abs(rect.top - point.y);
          const distanceToBottom = Math.abs(rect.bottom - point.y);
          const parent = page.getParent(model);
          assertExists(parent);
          page.moveBlocks(
            models,
            parent,
            model,
            distanceToTop < distanceToBottom
          );
        }

        if (targetFrameBlock !== frameBlock) {
          pageBlock.setSelection(
            targetFrameBlock.model.id,
            true,
            focusId,
            point
          );
        }
        return;
      }

      // blank area
      page.captureSync();
      pageBlock.moveBlocksToNewFrame(
        models,
        point,
        getRectByBlockElement(blockElementsExcludeSubtrees[0])
      );
    },
    setSelectionType() {
      return;
    },
    setSelectedBlock(_: EditingState) {
      return;
    },
    getSelectedBlocks() {
      return [];
    },
    getClosestBlockElement(point: Point) {
      if (pageBlock.mouseMode.type !== 'default') return null;
      const hoveringFrame = getHoveringFrame(point);
      if (!hoveringFrame) return null;
      return getClosestBlockElementByPoint(
        point,
        { container: hoveringFrame, rect: Rect.fromDOM(hoveringFrame) },
        pageBlock.surface.viewport.zoom
      );
    },
  });
}
