import type { MenuOptions } from '@blocksuite/affine-components/context-menu';

import {
  type MicrosheetBlockModel,
  MicrosheetBlockSchema,
} from '@blocksuite/affine-model';
import { DragHandleConfigExtension } from '@blocksuite/affine-shared/services';
import { captureEventTarget } from '@blocksuite/affine-shared/utils';

export interface MicrosheetOptionsConfig {
  configure: (model: MicrosheetBlockModel, options: MenuOptions) => MenuOptions;
}

let canDrop = false;
export const MicrosheetDragHandleOption = DragHandleConfigExtension({
  flavour: MicrosheetBlockSchema.model.flavour,
  onDragMove: ({ state }) => {
    const target = captureEventTarget(state.raw.target);
    const microsheet = target?.closest('affine-microsheet');
    if (!microsheet) return false;
    const view = microsheet.view;
    if (view && target instanceof HTMLElement && microsheet.contains(target)) {
      canDrop = view.showIndicator?.(state.raw) ?? false;
      return false;
    }
    if (canDrop) {
      view?.hideIndicator?.();
      canDrop = false;
    }
    return false;
  },
  onDragEnd: ({ state, draggingElements, editorHost }) => {
    const target = state.raw.target;
    const targetEl = captureEventTarget(state.raw.target);
    const microsheet = targetEl?.closest('affine-microsheet');
    if (!microsheet) {
      return false;
    }
    const view = microsheet.view;
    if (
      canDrop &&
      view &&
      view.moveTo &&
      target instanceof HTMLElement &&
      microsheet.parentElement?.contains(target)
    ) {
      const blocks = draggingElements.map(v => v.model);
      editorHost.doc.moveBlocks(blocks, microsheet.model);
      blocks.forEach(model => {
        view.moveTo?.(model.id, state.raw);
      });
      view.hideIndicator?.();
      return false;
    }
    if (canDrop) {
      view?.hideIndicator?.();
      canDrop = false;
    }
    return false;
  },
});
