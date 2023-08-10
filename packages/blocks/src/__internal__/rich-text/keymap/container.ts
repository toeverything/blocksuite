import { PathFinder } from '@blocksuite/block-std';
import type { BlockElement } from '@blocksuite/lit';
import type { VirgoRootElement } from '@blocksuite/virgo';

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
};
