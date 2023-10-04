import type { BlockSuiteRoot } from '@blocksuite/lit';
import { html } from 'lit';

import { actionConfig } from '../../../common/actions/action-config.js';

export const ActionItems = (root: BlockSuiteRoot) =>
  actionConfig
    .filter(({ showWhen }) => showWhen(root))
    .map(({ id, name, icon, action, enabledWhen, disabledToolTip }) => {
      const enabled = enabledWhen(root);
      const toolTip = enabled
        ? html`<blocksuite-tooltip>${name}</blocksuite-tooltip>`
        : html`<blocksuite-tooltip>${disabledToolTip}</blocksuite-tooltip>`;
      return html`<icon-button
        size="32px"
        data-testid=${id}
        ?disabled=${!enabled}
        @click=${() => enabled && action(root)}
      >
        ${icon}${toolTip}
      </icon-button>`;
    });
