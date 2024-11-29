import type { BlockComponent } from '@blocksuite/block-std';

import { ListBlockSchema } from '@blocksuite/affine-model';
import { DragHandleConfigExtension } from '@blocksuite/affine-shared/services';
import { matchFlavours } from '@blocksuite/affine-shared/utils';
import { BlockService } from '@blocksuite/block-std';

import { correctNumberedListsOrderToPrev } from './commands/utils.js';

export class ListBlockService extends BlockService {
  static override readonly flavour = ListBlockSchema.model.flavour;
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
