import { assertExists } from '@blocksuite/store';

import type {
  BlockComponentElement,
  EditingState,
} from '../../__internal__/index.js';
import {
  getBlockElementByModel,
  getBlockElementsExcludeSubtrees,
  getClosestBlockElementByPoint,
  getClosestFrameBlockElementById,
  getHoveringFrame,
  getModelByBlockElement,
  getRectByBlockElement,
  isInSamePath,
  Point,
  Rect,
} from '../../__internal__/index.js';
import { DragHandle } from '../../components/index.js';
import type { EdgelessPageBlockComponent } from './edgeless-page-block.js';
import {
  type DefaultModeController,
  DefaultModeDragType,
} from './mode-controllers/default-mode.js';

export function createDragHandle(pageBlock: EdgelessPageBlockComponent) {
  return new DragHandle({
    // Drag handle should be at the same level with EditorContainer
    container: pageBlock.mouseRoot as HTMLElement,
    onDropCallback(point, blockElements, editingState, type) {
      const blockElementsExcludeSubtrees =
        getBlockElementsExcludeSubtrees(blockElements);
      if (!blockElementsExcludeSubtrees.length) return;

      const models = blockElementsExcludeSubtrees.map(getModelByBlockElement);
      if (!models.length) return;

      const page = pageBlock.page;

      if (editingState && type !== 'none') {
        const { model } = editingState;
        if (models.length === 1 && isInSamePath(page, model, models[0])) return;

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
          const parent = page.getParent(model);
          assertExists(parent);
          page.moveBlocks(models, parent, model, type === 'before');
        }

        pageBlock.setSelection(targetFrameBlock.model.id, true, focusId, point);
        return;
      }
      // blank area
      page.captureSync();

      const parent = page.getParent(models[0]);
      assertExists(parent);

      const firstModelIndex = parent.children.findIndex(
        m => m.id === models[0].id
      );
      const lastModelIndex = parent.children.findIndex(
        m => m.id === models[models.length - 1].id
      );

      pageBlock.moveBlocksWithNewFrame(models, point, {
        rect: getRectByBlockElement(blockElementsExcludeSubtrees[0]),
        focus: true,
        frameIndex: firstModelIndex === 0 ? 0 : undefined,
      });

      if (
        firstModelIndex !== 0 &&
        lastModelIndex !== parent.children.length - 1
      ) {
        const nextFirstBlockElement = getBlockElementByModel(
          parent?.children[lastModelIndex]
        );

        assertExists(nextFirstBlockElement);
        const nextFirstBlockRect = getRectByBlockElement(nextFirstBlockElement);
        pageBlock.moveBlocksWithNewFrame(
          parent?.children.slice(lastModelIndex),
          new Point(nextFirstBlockRect.x, nextFirstBlockRect.y),
          { rect: nextFirstBlockRect }
        );
      }
    },
    setDragType(dragging: boolean) {
      const { selection } = pageBlock;
      if (selection.mouseMode.type === 'default') {
        const currentController =
          selection.currentController as DefaultModeController;
        currentController.dragType = dragging
          ? DefaultModeDragType.PreviewDragging
          : DefaultModeDragType.None;
      }
    },
    setSelectedBlock(modelState: EditingState | null) {
      const selectedBlocks = [];
      if (modelState) {
        selectedBlocks.push(modelState.element);
      }
      pageBlock.slots.selectedBlocksUpdated.emit(selectedBlocks);
    },
    getSelectedBlocks() {
      return pageBlock.selection.selectedBlocks;
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
