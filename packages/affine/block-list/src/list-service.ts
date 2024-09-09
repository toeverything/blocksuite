import type { BlockComponent } from '@blocksuite/block-std';

import { textKeymap } from '@blocksuite/affine-components/rich-text';
import { ListBlockSchema } from '@blocksuite/affine-model';
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

  override mounted(): void {
    super.mounted();

    this.bindHotKey(textKeymap(this.std));
    const rootId = this.std.doc.root?.id;
    if (!rootId) return;

    requestAnimationFrame(() => {
      const widget = this.host.view.getWidget(
        'affine-drag-handle-widget',
        rootId
      );
      if (!widget) return;
      this.disposables.add(
        // @ts-expect-error TODO: fix after migrate drag handle widget to a standalone package
        widget.constructor.registerOption({
          flavour: ListBlockSchema.model.flavour,
          onDragEnd: ({
            draggingElements,
          }: {
            draggingElements: BlockComponent[];
          }) => {
            draggingElements.forEach((el: BlockComponent) => {
              const model = el.model;
              const doc = el.doc;
              if (
                matchFlavours(model, ['affine:list']) &&
                model.type === 'numbered'
              ) {
                const next = el.doc.getNext(model);
                this.host.updateComplete
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
        })
      );
    });
  }
}
