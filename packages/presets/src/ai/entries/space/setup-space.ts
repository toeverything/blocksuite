import { type AffineAIPanelWidget } from '@blocksuite/blocks';

import { handleAskAIAction } from '../../actions/handler.js';
import { AIProvider } from '../../provider.js';

export function setupSpaceEntry(panel: AffineAIPanelWidget) {
  panel.handleEvent('keyDown', ctx => {
    const host = panel.host;
    const keyboardState = ctx.get('keyboardState');
    if (AIProvider.actions.chat && keyboardState.raw.key === ' ') {
      const selection = host.selection.find('text');
      if (selection && selection.isCollapsed() && selection.from.index === 0) {
        const block = host.view.viewFromPath('block', selection.path);
        if (!block?.model?.text || block.model.text?.length > 0) return;

        keyboardState.raw.preventDefault();
        handleAskAIAction(panel);
      }
    }
  });
}
