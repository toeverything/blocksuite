import { PathFinder } from '@blocksuite/block-std';
import type { BlockElement } from '@blocksuite/lit';
import type { VirgoRootElement } from '@blocksuite/virgo';

import { inlineFormatConfig } from '../../../page-block/const/inline-format-config.js';
import type { PageBlockComponent } from '../../../page-block/types.js';
import { getCurrentCombinedFormat } from '../../../page-block/utils/operations/inline.js';
import { getTextSelection } from '../../../page-block/utils/selection.js';

export const bindContainerHotkey = (blockElement: BlockElement) => {
  const selection = blockElement.root.selectionManager;
  const _selectBlock = () => {
    selection.update(selList => {
      return selList.map(sel => {
        if (PathFinder.equals(sel.path, blockElement.path)) {
          return selection.getInstance('block', { path: blockElement.path });
        }
        return sel;
      });
    });
    blockElement.querySelector<VirgoRootElement>('[data-virgo-root]')?.blur();
    return true;
  };

  const _selectText = (start: boolean) => {
    selection.update(selList => {
      return selList.map(sel => {
        if (PathFinder.equals(sel.path, blockElement.path)) {
          return selection.getInstance('text', {
            from: {
              path: blockElement.path,
              index: start ? 0 : blockElement.model.text?.length ?? 0,
              length: 0,
            },
            to: null,
          });
        }
        return sel;
      });
    });
    return true;
  };

  blockElement.bindHotKey({
    ArrowRight: () => {
      if (blockElement.selected?.is('block')) {
        return _selectText(false);
      }
      return;
    },
    ArrowLeft: () => {
      if (blockElement.selected?.is('block')) {
        return _selectText(true);
      }
      return;
    },
    Escape: () => {
      if (blockElement.selected?.is('text')) {
        return _selectBlock();
      }
      return;
    },
    Enter: () => {
      if (blockElement.selected?.is('block')) {
        return _selectText(false);
      }
      return;
    },
  });

  inlineFormatConfig.forEach(config => {
    if (!config.hotkey) return;

    blockElement.bindHotKey({
      [config.hotkey]: () => {
        const pageElement = blockElement.closest<PageBlockComponent>(
          'affine-doc-page,affine-edgeless-page'
        );
        if (!pageElement) return;
        const textSelection = getTextSelection(pageElement);
        if (!textSelection) return;

        const format = getCurrentCombinedFormat(pageElement, textSelection);
        config.action({ pageElement, format });
      },
    });
  });
};
