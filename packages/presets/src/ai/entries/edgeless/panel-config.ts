import type {
  AffineAIPanelWidget,
  AffineAIPanelWidgetConfig,
} from '../../widgets/ai-panel/ai-panel.js';
import { createTextRenderer } from '../../widgets/messages/text.js';

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
      upgrade: () => {},
      responses: [],
    },
  };
}

export function buildDefaultResponse(_: AffineAIPanelWidget) {
  return [];
}
