import { html } from 'lit';

import type { AffineTextAttributes } from '../../../__internal__/rich-text/virgo/types.js';
import { inlineFormatConfig } from '../../../page-block/const/inline-format-config.js';
import type { PageBlockComponent } from '../../../page-block/types.js';

interface InlineItemsProps {
  host: PageBlockComponent;
  abortController: AbortController;
  format: AffineTextAttributes;
}

export const InlineItems = ({
  host,
  format,
  abortController,
}: InlineItemsProps) =>
  inlineFormatConfig.map(
    ({ id, name, icon, action, activeWhen }) => html`<icon-button
      size="32px"
      class="has-tool-tip"
      data-testid=${id}
      ?active=${activeWhen(format)}
      @click=${() => {
        action({
          host,
          abortController,
          format,
        });
      }}
    >
      ${icon}
      <tool-tip inert role="tooltip">${name}</tool-tip>
    </icon-button>`
  );
