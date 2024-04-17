import type {
  AIItemGroupConfig,
  EdgelessElementToolbarWidget,
  EdgelessRootBlockComponent,
} from '@blocksuite/blocks';
import {
  EdgelessCopilotToolbarEntry,
  type EdgelessCopilotWidget,
} from '@blocksuite/blocks';
import { noop } from '@blocksuite/global/utils';
import { html } from 'lit';

import {
  createGroup,
  docGroup,
  draftGroup,
  editGroup,
  mindmapGroup,
  othersGroup,
  presentationGroup,
} from './actions-config.js';

noop(EdgelessCopilotToolbarEntry);

const groups = [
  docGroup,
  editGroup,
  draftGroup,
  mindmapGroup,
  presentationGroup,
  createGroup,
  othersGroup,
];

export function setupEdgelessCopilot(widget: EdgelessCopilotWidget) {
  widget.groups = groups;
}

export function setupEdgelessElementToolbarEntry(
  widget: EdgelessElementToolbarWidget
) {
  widget.registerEntry({
    when: () => {
      return true;
    },
    render: (edgeless: EdgelessRootBlockComponent) => {
      const chain = edgeless.service.std.command.chain();
      const filteredGroups = groups.reduce((pre, group) => {
        const filtered = group.items.filter(item =>
          item.showWhen?.(chain, 'edgeless', edgeless.host)
        );

        if (filtered.length > 0) pre.push({ ...group, items: filtered });

        return pre;
      }, [] as AIItemGroupConfig[]);

      if (filteredGroups.every(group => group.items.length === 0)) return null;

      return html`<edgeless-copilot-toolbar-entry
        .edgeless=${edgeless}
        .host=${edgeless.host}
        .groups=${groups}
      ></edgeless-copilot-toolbar-entry>`;
    },
  });
}
