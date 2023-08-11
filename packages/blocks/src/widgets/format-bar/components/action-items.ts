import { html } from 'lit';

import { actionConfig } from '../../../page-block/const/action-config.js';
import type { PageBlockComponent } from '../../../page-block/types.js';

export const ActionItems = (pageElement: PageBlockComponent) =>
  actionConfig.map(
    ({ id, name, icon, action, enabledWhen, disabledToolTip }) => {
      const enabled = enabledWhen(pageElement);
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
        @click=${() => enabled && action(pageElement)}
      >
        ${icon}${toolTip}
      </icon-button>`;
    }
  );
