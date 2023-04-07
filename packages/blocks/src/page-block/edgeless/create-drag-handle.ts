import type {
  BlockComponentElement,
  EditingState,
  Point,
} from '@blocksuite/blocks/std';
import {
  doesInSamePath,
  getBlockElementsExcludeSubtrees,
  getClosestBlockElementByPoint,
  getHoveringFrame,
  getModelByBlockElement,
  isInEmptyDatabaseByPoint,
  Rect,
} from '@blocksuite/blocks/std';
import { assertExists } from '@blocksuite/store';

import { DragHandle } from '../../components/index.js';
import type { EdgelessPageBlockComponent } from './edgeless-page-block.js';

export function createDragHandle(pageBlock: EdgelessPageBlockComponent) {
  return new DragHandle({
    // Drag handle should be at the same level with EditorContainer
    container: pageBlock.mouseRoot as HTMLElement,
    onDropCallback(point, blockElements, editingState) {
      const page = pageBlock.page;
      const models = getBlockElementsExcludeSubtrees(blockElements).map(
        getModelByBlockElement
      );
      if (editingState) {
        const { rect, model, element } = editingState;
        if (models.length === 1 && doesInSamePath(page, model, models[0])) {
          return;
        }

        let parentId;

        page.captureSync();

        if (isInEmptyDatabaseByPoint(point, model, element, models)) {
          page.moveBlocks(models, model);
          parentId = model.id;
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
          parentId = parent.id;
        }

        pageBlock.setSelectionByBlockId(parentId, true);
        return;
      }

      // blank area
      page.captureSync();
      pageBlock.moveBlocksToNewFrame(models, point);
    },
    setSelectedBlocks(
      selectedBlocks: EditingState | BlockComponentElement[] | null
    ) {
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
