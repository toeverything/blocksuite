import { BlockService } from '@blocksuite/block-std';

import type { ListBlockModel } from './list-model.js';

import { InlineManager } from '../_common/inline/inline-manager.js';
import {
  type AffineTextAttributes,
  getAffineInlineSpecsWithReference,
} from '../_common/inline/presets/affine-inline-specs.js';
import { affineInlineMarkdownMatches } from '../_common/inline/presets/markdown.js';
import { ReferenceNodeConfig } from '../_common/inline/presets/nodes/reference-node/reference-config.js';
import { matchFlavours } from '../_common/utils/model.js';
import { AffineDragHandleWidget } from '../root-block/widgets/drag-handle/drag-handle.js';
import { convertToNumberedListCommand } from './commands/convert-to-numbered-list.js';
import { indentListCommand } from './commands/indent-list.js';
import { splitListCommand } from './commands/split-list.js';
import { unindentListCommand } from './commands/unindent-list.js';
import { correctNumberedListsOrderToPrev } from './commands/utils.js';
import { ListBlockSchema } from './list-model.js';
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

    this.std.command.add('convertToNumberedList', convertToNumberedListCommand);
    this.std.command.add('splitList', splitListCommand);
    this.std.command.add('unindentList', unindentListCommand);
    this.std.command.add('indentList', indentListCommand);

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
