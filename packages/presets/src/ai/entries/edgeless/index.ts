import type { EdgelessCopilotWidget } from '@blocksuite/blocks';

import { actionWithAI, draftWithAI } from '../../config/edgeless-copilot.js';

export function setupEdgelessCopilot(widget: EdgelessCopilotWidget) {
  widget.groups = [actionWithAI, draftWithAI];
}
