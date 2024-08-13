import type { ListBlockModel } from '@blocksuite/affine-model';

import {
  type AffineTextAttributes,
  InlineManager,
  ReferenceNodeConfig,
  affineInlineMarkdownMatches,
  getAffineInlineSpecsWithReference,
} from '@blocksuite/affine-components/rich-text';
import { ListBlockSchema } from '@blocksuite/affine-model';
import { matchFlavours } from '@blocksuite/affine-shared/utils';
import { BlockService } from '@blocksuite/block-std';

import { AffineDragHandleWidget } from '../root-block/widgets/drag-handle/drag-handle.js';
import { correctNumberedListsOrderToPrev } from './commands/utils.js';
import { listPrefix, toggleStyles } from './styles.js';
import { getListIcon } from './utils/get-list-icon.js';

export class ListBlockService<
  TextAttributes extends AffineTextAttributes = AffineTextAttributes,
> extends BlockService<ListBlockModel> {
  readonly inlineManager = new InlineManager<TextAttributes>();

  readonly referenceNodeConfig = new ReferenceNodeConfig();

  readonly styles = {
    icon: getListIcon,
    prefix: listPrefix,
    toggle: toggleStyles,
  };

  override mounted(): void {
    super.mounted();

    this.referenceNodeConfig.setDoc(this.doc);

    const inlineSpecs = getAffineInlineSpecsWithReference(
      this.referenceNodeConfig
    );
    this.inlineManager.registerSpecs(inlineSpecs);
    this.inlineManager.registerMarkdownMatches(affineInlineMarkdownMatches);

    this.disposables.add(
      AffineDragHandleWidget.registerOption({
        flavour: ListBlockSchema.model.flavour,
        onDragEnd: ({ draggingElements, editorHost }) => {
          draggingElements.forEach(el => {
            const model = el.model;
            const doc = el.doc;
            if (
              matchFlavours(model, ['affine:list']) &&
              model.type === 'numbered'
            ) {
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
      })
    );
  }
}

declare global {
  namespace BlockSuite {
    interface BlockServices {
      'affine:list': ListBlockService;
    }
  }
}
