import { html } from 'lit';

import { actionConfig } from '../../../common/actions/action-config.js';
import type { AffineFormatBarWidget } from '../format-bar.js';

export const ActionItems = (formatBar: AffineFormatBarWidget) => {
  if (formatBar.displayType !== 'text' && formatBar.displayType !== 'block') {
    return null;
  }

  const root = formatBar.root;
  return actionConfig
    .filter(({ showWhen }) => showWhen(root))
    .map(({ id, name, icon, action, enabledWhen, disabledToolTip }) => {
      const enabled = enabledWhen(root);
      const toolTip = enabled
        ? html`<tool-tip inert role="tooltip">${name}</tool-tip>`
        : html`<tool-tip tip-position="top" inert role="tooltip"
            >${disabledToolTip}</tool-tip
          >`;
      return html`<icon-button
        size="32px"
        class="has-tool-tip"
        data-testid=${id}
        ?disabled=${!enabled}
        @click=${() => enabled && action(root)}
      >
        ${icon}${toolTip}
      </icon-button>`;
    });
};
