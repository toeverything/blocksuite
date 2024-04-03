import {
  type AffineAIPanelWidget,
  type AffineAIPanelWidgetConfig,
} from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';

import { bindEventSource } from '../../config/builder.js';
import type { AIConfig } from '../../types.js';

export function setupSpaceEntry(
  panel: AffineAIPanelWidget,
  getAskAIStream: NonNullable<AIConfig['getAskAIStream']>
) {
  const host = panel.host;

  panel.handleEvent('keyDown', ctx => {
    const keyboardState = ctx.get('keyboardState');
    if (keyboardState.raw.key === ' ') {
      const selection = host.selection.find('text');
      if (selection && selection.isCollapsed() && selection.from.index === 0) {
        const block = host.view.viewFromPath('block', selection.path);
        if (!block?.model?.text || block.model.text?.length > 0) return;

        keyboardState.raw.preventDefault();
        const generateAnswer: AffineAIPanelWidgetConfig['generateAnswer'] = ({
          finish,
          input,
          signal,
          update,
        }) => {
          getAskAIStream(host.doc, input)
            .then(stream => {
              bindEventSource(stream, { update, finish, signal });
            })
            .catch(console.error);
        };
        assertExists(panel.config);
        panel.config.generateAnswer = generateAnswer;
        panel.toggle(block);
      }
    }
  });
}
