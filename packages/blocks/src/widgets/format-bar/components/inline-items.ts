import { html, nothing } from 'lit';

import { formatConfig } from '../../../common/format/config.js';
import { isFormatSupported } from '../../../common/format/utils.js';
import type { AffineFormatBarWidget } from '../format-bar.js';
import { BackgroundButton } from './background/background-button.js';

export const InlineItems = (formatBar: AffineFormatBarWidget) => {
  const root = formatBar.root;

  if (!isFormatSupported(root)) {
    return nothing;
  }

  const backgroundButton = BackgroundButton(formatBar);

  return html`${formatConfig.map(
      ({ id, name, icon, action, activeWhen }) =>
        html`<icon-button
          size="32px"
          class="has-tool-tip"
          data-testid=${id}
          ?active=${activeWhen(root)}
          @click=${() => {
            action(root);
            formatBar.requestUpdate();
          }}
        >
          ${icon}
          <tool-tip inert role="tooltip">${name}</tool-tip>
        </icon-button>`
    )}
    <div class="divider"></div>
    ${backgroundButton}
    <div class="divider"></div>`;
};
