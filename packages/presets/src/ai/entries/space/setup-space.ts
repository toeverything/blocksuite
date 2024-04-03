import { type AffineAIPanelWidget } from '@blocksuite/blocks';

import { handleAskAIAction } from '../../config/builder.js';
import type { AIConfig } from '../../types.js';

export function setupSpaceEntry(
  panel: AffineAIPanelWidget,
  { getAskAIStream }: AIConfig
) {
  if (!getAskAIStream) return;
  panel.handleEvent('keyDown', ctx => {
    const host = panel.host;
    const keyboardState = ctx.get('keyboardState');
    if (keyboardState.raw.key === ' ') {
      const selection = host.selection.find('text');
      if (selection && selection.isCollapsed() && selection.from.index === 0) {
        const block = host.view.viewFromPath('block', selection.path);
        if (!block?.model?.text || block.model.text?.length > 0) return;

        keyboardState.raw.preventDefault();
        handleAskAIAction(panel, getAskAIStream);
      }
    }
  });
}
