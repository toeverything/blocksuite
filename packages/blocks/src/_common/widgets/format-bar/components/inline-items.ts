import { html } from 'lit';

import { formatConfigs } from '../../../configs/format/format.js';
import { isFormatSupported } from '../../../configs/format/utils.js';
import type { AffineFormatBarWidget } from '../format-bar.js';
import { BackgroundButton } from './background/background-button.js';

export const InlineItems = (formatBar: AffineFormatBarWidget) => {
  const root = formatBar.root;

  if (!isFormatSupported(root)) {
    return null;
  }

  const backgroundButton = BackgroundButton(formatBar);

  return html`${formatConfigs.map(
      ({ id, name, icon, action, activeWhen }) =>
        html`<icon-button
          size="32px"
          data-testid=${id}
          ?active=${activeWhen(root)}
          @click=${() => {
            action(root);
            formatBar.requestUpdate();
          }}
        >
          ${icon}
          <affine-tooltip>${name}</affine-tooltip>
        </icon-button>`
    )}
    <div class="divider"></div>
    ${backgroundButton}`;
};
