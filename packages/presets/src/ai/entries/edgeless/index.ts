import type { EdgelessCopilotWidget } from '../../widgets/edgeless-copilot/index.js';
import {
  createGroup,
  docGroup,
  draftGroup,
  editGroup,
  mindmapGroup,
  othersGroup,
  presentationGroup,
} from './actions-config.js';

export function setupEdgelessCopilot(widget: EdgelessCopilotWidget) {
  widget.groups = [
    docGroup,
    editGroup,
    draftGroup,
    mindmapGroup,
    presentationGroup,
    createGroup,
    othersGroup,
  ];
}
