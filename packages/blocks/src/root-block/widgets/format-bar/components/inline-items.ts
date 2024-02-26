import { html } from 'lit';

import { textFormatConfigs } from '../../../../_common/configs/text-format/config.js';
import { isFormatSupported } from '../../../../_common/configs/text-format/utils.js';
import type { AffineFormatBarWidget } from '../format-bar.js';
import { HighlightButton } from './highlight/highlight-button.js';

export const InlineItems = (formatBar: AffineFormatBarWidget) => {
  const editorHost = formatBar.host;

  if (!isFormatSupported(editorHost)) {
    return null;
  }

  const highlightButton = HighlightButton(formatBar);

  return html`${textFormatConfigs.map(
      ({ id, name, icon, action, activeWhen }) =>
        html`<icon-button
          size="32px"
          data-testid=${id}
          ?active=${activeWhen(editorHost)}
          @click=${() => {
            action(editorHost);
            formatBar.requestUpdate();
          }}
        >
          ${icon}
          <affine-tooltip>${name}</affine-tooltip>
        </icon-button>`
    )}
    <div class="divider"></div>
    ${highlightButton}`;
};
