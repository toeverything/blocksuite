import type { BlockComponent } from '@blocksuite/block-std';

import { ListBlockSchema } from '@blocksuite/affine-model';
import { DragHandleConfigExtension } from '@blocksuite/affine-shared/services';
import { matchFlavours } from '@blocksuite/affine-shared/utils';
import { BlockService } from '@blocksuite/block-std';

import { correctNumberedListsOrderToPrev } from './commands/utils.js';
import { listPrefix, toggleStyles } from './styles.js';
import { getListIcon } from './utils/get-list-icon.js';

export class ListBlockService extends BlockService {
  static override readonly flavour = ListBlockSchema.model.flavour;

  readonly styles = {
    icon: getListIcon,
    prefix: listPrefix,
    toggle: toggleStyles,
  };
}

export const ListDragHandleOption = DragHandleConfigExtension({
  flavour: ListBlockSchema.model.flavour,
  onDragEnd: ({ draggingElements, editorHost }) => {
    draggingElements.forEach((el: BlockComponent) => {
      const model = el.model;
      const doc = el.doc;
      if (matchFlavours(model, ['affine:list']) && model.type === 'numbered') {
        const next = el.doc.getNext(model);
        editorHost.updateComplete
          .then(() => {
            correctNumberedListsOrderToPrev(doc, model);
            if (next) {
              correctNumberedListsOrderToPrev(doc, next);
            }
          })
          .catch(console.error);
      }
    });
    return false;
  },
});
