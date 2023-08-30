import type { Command } from '@blocksuite/block-std';
import type { BlockElement } from '@blocksuite/lit';

export const currentTextBlock: Command = ctx => {
  const blockStore = ctx.blockStore;
  const selection = blockStore.selectionManager;
  const view = blockStore.viewStore;
  const text = selection.find('text');
  if (!text) {
    return false;
  }

  const nodeView = view.viewFromPath('block', text.path);

  if (!nodeView) {
    return false;
  }

  ctx.data.selectedText = nodeView;

  return true;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace BlockSuite {
    interface CommandData {
      selectedText: BlockElement;
    }

    interface Commands {
      currentTextBlock: typeof currentTextBlock;
    }
  }
}
