import { assertExists } from '@blocksuite/store';

import type {
  BlockComponentElement,
  EditingState,
  Point,
} from '../../../__internal__/index.js';
import {
  getBlockElementsExcludeSubtrees,
  getClosestBlockElementByPoint,
  getClosestNoteBlockElementById,
  getHoveringNote,
  getModelByBlockElement,
  isInSamePath,
  Rect,
} from '../../../__internal__/index.js';
import { DragHandle } from '../../../components/index.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';
import {
  DefaultModeDragType,
  type DefaultToolController,
} from '../tool-controllers/default-tool.js';

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
        const targetNoteBlock = getClosestNoteBlockElementById(
          model.id,
          pageBlock
        ) as BlockComponentElement;
        assertExists(targetNoteBlock);
        const noteBlock = getClosestNoteBlockElementById(
          focusId,
          pageBlock
        ) as BlockComponentElement;
        assertExists(noteBlock);

        page.captureSync();

        if (type === 'database') {
          page.moveBlocks(models, model);
        } else {
          const parent = page.getParent(model);
          assertExists(parent);
          page.moveBlocks(models, parent, model, type === 'before');
        }

        pageBlock.setSelection(targetNoteBlock.model.id, true, focusId, point);
        return;
      }
      // blank area
      page.captureSync();
    },
    setDragType(dragging: boolean) {
      const { selection } = pageBlock;
      if (selection.edgelessTool.type === 'default') {
        const currentController =
          selection.currentController as DefaultToolController;
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
      if (pageBlock.edgelessTool.type !== 'default') return null;
      const hoveringNote = getHoveringNote(point);
      if (!hoveringNote) return null;
      return getClosestBlockElementByPoint(
        point,
        { container: hoveringNote, rect: Rect.fromDOM(hoveringNote) },
        pageBlock.surface.viewport.zoom
      );
    },
  });
}
