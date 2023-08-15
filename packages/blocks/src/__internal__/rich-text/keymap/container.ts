import { PathFinder } from '@blocksuite/block-std';
import type { BlockElement } from '@blocksuite/lit';
import type { VirgoRootElement } from '@blocksuite/virgo';

import { inlineFormatConfig } from '../../../page-block/const/inline-format-config.js';
import type { PageBlockComponent } from '../../../page-block/types.js';
import {
  getCombinedFormatInTextSelection,
  getSelectedContentModels,
} from '../../../page-block/utils/selection.js';
import {
  handleMultiBlockIndent,
  handleMultiBlockUnindent,
} from '../rich-text-operations.js';

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
    'Mod-a': () => {
      if (blockElement.selected?.is('text')) {
        return _selectBlock();
      }
      return;
    },
    Tab: () => {
      if (
        blockElement.selected?.is('block') ||
        blockElement.selected?.is('text')
      ) {
        const page = blockElement.closest<PageBlockComponent>(
          'affine-doc-page,affine-edgeless-page'
        );
        if (!page) {
          return;
        }
        const models = getSelectedContentModels(page, ['text', 'block']);
        handleMultiBlockIndent(blockElement.page, models);
        return true;
      }
      return;
    },
    'Shift-Tab': () => {
      if (
        blockElement.selected?.is('block') ||
        blockElement.selected?.is('text')
      ) {
        const page = blockElement.closest<PageBlockComponent>(
          'affine-doc-page,affine-edgeless-page'
        );
        if (!page) {
          return;
        }
        const models = getSelectedContentModels(page, ['text', 'block']);
        handleMultiBlockUnindent(blockElement.page, models);
        return true;
      }
      return;
    },
  });

  inlineFormatConfig.forEach(config => {
    if (!config.hotkey) return;

    blockElement.bindHotKey({
      [config.hotkey]: ctx => {
        if (blockElement.page.readonly) return;

        const textSelection = blockElement.selection.find('text');
        if (!textSelection) return;

        ctx.get('defaultState').event.preventDefault();

        const format = getCombinedFormatInTextSelection(
          blockElement,
          textSelection
        );
        config.action({ blockElement, type: 'text', format });
        return true;
      },
    });
  });
};
