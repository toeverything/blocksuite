import {
  ParagraphBlockModel,
  ParagraphBlockSchema,
} from '@blocksuite/affine-model';
import { DragHandleConfigExtension } from '@blocksuite/affine-shared/services';
import {
  calculateCollapsedSiblings,
  captureEventTarget,
  matchFlavours,
} from '@blocksuite/affine-shared/utils';

export const ParagraphDragHandleOption = DragHandleConfigExtension({
  flavour: ParagraphBlockSchema.model.flavour,
  onDragStart: ({ state, startDragging, anchorBlockId, editorHost }) => {
    if (!anchorBlockId) return false;

    const element = captureEventTarget(state.raw.target);
    const dragByHandle = !!element?.closest('affine-drag-handle-widget');
    if (!dragByHandle) return false;

    const block = editorHost.doc.getBlock(anchorBlockId);
    if (!block) return false;
    const model = block.model;
    if (
      matchFlavours(model, ['affine:paragraph']) &&
      model.type.startsWith('h') &&
      model.collapsed
    ) {
      const collapsedSiblings = calculateCollapsedSiblings(model).flatMap(
        sibling => editorHost.view.getBlock(sibling.id) ?? []
      );
      const modelElement = editorHost.view.getBlock(anchorBlockId);
      if (!modelElement) return false;
      startDragging([modelElement, ...collapsedSiblings], state);
      return true;
    }

    return false;
  },
  onDragEnd: ({ draggingElements }) => {
    draggingElements
      .filter(el => matchFlavours(el.model, ['affine:paragraph']))
      .forEach(el => {
        const model = el.model;
        if (!(model instanceof ParagraphBlockModel)) return;
        model.collapsed = false;
      });

    return false;
  },
});
