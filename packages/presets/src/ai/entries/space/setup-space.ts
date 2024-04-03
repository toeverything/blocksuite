import { type AffineAIPanelWidget } from '@blocksuite/blocks';

import { CopilotClient } from '../../copilot-client.js';
import { createDefaultPanelConfig } from '../entry-utils.js';

export function setupSpaceEntry(panel: AffineAIPanelWidget) {
  const host = panel.host;
  const copilotClient = new CopilotClient('http://localhost:3010');

  panel.handleEvent('keyDown', ctx => {
    const keyboardState = ctx.get('keyboardState');
    if (keyboardState.raw.key === ' ') {
      const selection = host.selection.find('text');
      if (selection && selection.isCollapsed() && selection.from.index === 0) {
        const block = host.view.viewFromPath('block', selection.path);
        if (!block?.model?.text || block.model.text?.length > 0) return;

        keyboardState.raw.preventDefault();

        panel.config = createDefaultPanelConfig(panel, copilotClient);
        panel.toggle(block);
      }
    }
  });
}
