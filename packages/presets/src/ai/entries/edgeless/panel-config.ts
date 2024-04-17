import type { AffineAIPanelWidgetConfig } from '@blocksuite/blocks';
import type { AffineAIPanelWidget } from '@blocksuite/blocks';

import { createTextRenderer } from '../../messages/text.js';
import { AIProvider } from '../../provider.js';

export function buildEdgelessPanelConfig(
  panel: AffineAIPanelWidget
): AffineAIPanelWidgetConfig {
  return {
    answerRenderer: createTextRenderer(panel.host),
    finishStateConfig: {
      responses: buildDefaultResponse(panel),
      actions: [],
    },
    errorStateConfig: {
      upgrade: () => {
        AIProvider.slots.requestUpgradePlan.emit({ host: panel.host });
      },
      responses: [],
    },
  };
}

export function buildDefaultResponse(_: AffineAIPanelWidget) {
  return [];
}
