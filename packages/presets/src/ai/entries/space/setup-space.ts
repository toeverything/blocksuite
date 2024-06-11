import type { AffineAIPanelWidget } from '@blocksuite/blocks';

import { handleInlineAskAIAction } from '../../actions/doc-handler.js';
import { AIProvider } from '../../provider.js';

export function setupSpaceEntry(panel: AffineAIPanelWidget) {
  panel.handleEvent('keyDown', ctx => {
    const host = panel.host;
    const keyboardState = ctx.get('keyboardState');
    if (
      AIProvider.actions.chat &&
      keyboardState.raw.key === ' ' &&
      !keyboardState.raw.isComposing
    ) {
      const selection = host.selection.find('text');
      if (selection && selection.isCollapsed() && selection.from.index === 0) {
        const block = host.view.getBlock(selection.blockId);
        if (!block?.model?.text || block.model.text?.length > 0) return;

        keyboardState.raw.preventDefault();
        handleInlineAskAIAction(host);
      }
    }
  });
}
