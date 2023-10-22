import { html } from 'lit';

import { textFormatConfigs } from '../../../configs/text-format/config.js';
import { isFormatSupported } from '../../../configs/text-format/utils.js';
import type { AffineFormatBarWidget } from '../format-bar.js';
import { BackgroundButton } from './background/background-button.js';

export const InlineItems = (formatBar: AffineFormatBarWidget) => {
  const root = formatBar.root;

  if (!isFormatSupported(root)) {
    return null;
  }

  const backgroundButton = BackgroundButton(formatBar);

  return html`${textFormatConfigs.map(
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
