import type { MenuOptions } from '@blocksuite/affine-components/context-menu';

import {
  type DatabaseBlockModel,
  DatabaseBlockSchema,
} from '@blocksuite/affine-model';
import { DragHandleConfigExtension } from '@blocksuite/affine-shared/services';
import { captureEventTarget } from '@blocksuite/affine-shared/utils';

export interface DatabaseOptionsConfig {
  configure: (model: DatabaseBlockModel, options: MenuOptions) => MenuOptions;
}

let canDrop = false;
export const DatabaseDragHandleOption = DragHandleConfigExtension({
  flavour: DatabaseBlockSchema.model.flavour,
  onDragMove: ({ state }) => {
    const target = captureEventTarget(state.raw.target);
    const database = target?.closest('affine-database');
    if (!database) return false;
    const view = database.view;
    if (view && target instanceof HTMLElement && database.contains(target)) {
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
    const database = targetEl?.closest('affine-database');
    if (!database) {
      return false;
    }
    const view = database.view;
    if (
      canDrop &&
      view &&
      view.moveTo &&
      target instanceof HTMLElement &&
      database.parentElement?.contains(target)
    ) {
      const blocks = draggingElements.map(v => v.model);
      editorHost.doc.moveBlocks(blocks, database.model);
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
