import { BlockService } from '@blocksuite/block-std';
import { Point } from '@blocksuite/global/utils';
import { Bound } from '@blocksuite/global/utils';
import { render } from 'lit';

import type { EdgelessRootService } from '../root-block/edgeless/edgeless-root-service.js';
import type { DragHandleOption } from '../root-block/widgets/drag-handle/config.js';
import type { EdgelessNoteBlockComponent } from './note-edgeless-block.js';

import { matchFlavours } from '../_common/utils/model.js';
import {
  AFFINE_DRAG_HANDLE_WIDGET,
  AffineDragHandleWidget,
} from '../root-block/widgets/drag-handle/drag-handle.js';
import {
  captureEventTarget,
  getDuplicateBlocks,
} from '../root-block/widgets/drag-handle/utils.js';
import { focusBlockEnd } from './commands/focus-block-end.js';
import { focusBlockStart } from './commands/focus-block-start.js';
import {
  registerTextStyleCommands,
  selectBlock,
  selectBlocksBetween,
  updateBlockType,
} from './commands/index.js';
import { type NoteBlockModel, NoteBlockSchema } from './note-model.js';

export class NoteBlockService extends BlockService<NoteBlockModel> {
  private _dragHandleOption: DragHandleOption = {
    flavour: NoteBlockSchema.model.flavour,
    edgeless: true,
    onDragStart: ({ state, startDragging, anchorBlockPath, editorHost }) => {
      if (!anchorBlockPath) {
        return false;
      }

      const element = captureEventTarget(state.raw.target);
      const insideDragHandle = !!element?.closest(AFFINE_DRAG_HANDLE_WIDGET);
      if (!insideDragHandle) {
        return false;
      }

      const anchorComponent = editorHost.std.view.getBlock(anchorBlockPath);
      if (
        !anchorComponent ||
        !matchFlavours(anchorComponent.model, [NoteBlockSchema.model.flavour])
      ) {
        return false;
      }
      const edgelessService = editorHost.std.spec.getService(
        'affine:page'
      ) as EdgelessRootService;
      const zoom = edgelessService?.viewport.zoom ?? 1;
      const noteComponent = anchorComponent as EdgelessNoteBlockComponent;
      const dragPreviewEl = document.createElement('div');
      const bound = Bound.deserialize(noteComponent.model.xywh);
      const offset = new Point(bound.x * zoom, bound.y * zoom);

      render(
        noteComponent.host.renderModel(noteComponent.model),
        dragPreviewEl
      );

      startDragging([noteComponent], state, dragPreviewEl, offset);
      return true;
    },
    onDragEnd: ({
      draggingElements,
      dropBlockId,
      dropType,
      state,
      editorHost,
    }) => {
      if (
        draggingElements.length !== 1 ||
        !matchFlavours(draggingElements[0].model, [
          NoteBlockSchema.model.flavour,
        ])
      ) {
        return false;
      }

      if (dropType === 'in') {
        return true;
      }

      const noteBlock = draggingElements[0].model as NoteBlockModel;
      const targetBlock = editorHost.doc.getBlockById(dropBlockId);
      const parentBlock = editorHost.doc.getParent(dropBlockId);
      if (!targetBlock || !parentBlock) {
        return true;
      }

      const altKey = state.raw.altKey;
      if (altKey) {
        const duplicateBlocks = getDuplicateBlocks(noteBlock.children);

        const parentIndex =
          parentBlock.children.indexOf(targetBlock) +
          (dropType === 'after' ? 1 : 0);

        editorHost.doc.addBlocks(duplicateBlocks, parentBlock, parentIndex);
      } else {
        editorHost.doc.moveBlocks(
          noteBlock.children,
          parentBlock,
          targetBlock,
          dropType === 'before'
        );

        editorHost.doc.deleteBlock(noteBlock);
        editorHost.selection.setGroup('gfx', []);
      }

      return true;
    },
  };

  override mounted() {
    super.mounted();

    this.std.command
      .add('selectBlocksBetween', selectBlocksBetween)
      .add('selectBlock', selectBlock)
      .add('focusBlockStart', focusBlockStart)
      .add('focusBlockEnd', focusBlockEnd)
      .add('updateBlockType', updateBlockType);

    registerTextStyleCommands(this.std);

    this.disposables.add(
      AffineDragHandleWidget.registerOption(this._dragHandleOption)
    );
  }
}
