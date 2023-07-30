import type { Page } from '@blocksuite/store';
import { html } from 'lit';

import { actionConfig } from '../../../page-block/utils/const.js';

interface ActionItemProps {
  page: Page;
}

export const ActionItems = ({ page }: ActionItemProps) =>
  actionConfig.map(
    ({ id, name, icon, action, enabledWhen, disabledToolTip }) => {
      const enabled = enabledWhen(page);
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
        @click=${() => enabled && action({ page })}
      >
        ${icon}${toolTip}
      </icon-button>`;
    }
  );
