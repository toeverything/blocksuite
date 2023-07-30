import type { Page } from '@blocksuite/store';
import { html } from 'lit';

import type { AffineTextAttributes } from '../../../__internal__/rich-text/virgo/types.js';
import { formatConfig } from '../../../page-block/utils/format-config.js';

interface InlineItemsProps {
  page: Page;
  format: AffineTextAttributes;
  abortController: AbortController;
}

export const InlineItems = ({
  page,
  format,
  abortController,
}: InlineItemsProps) =>
  formatConfig.map(
    ({ id, name, icon, action, activeWhen }) => html`<icon-button
      size="32px"
      class="has-tool-tip"
      data-testid=${id}
      ?active=${activeWhen(format)}
      @click=${() => {
        action({
          page,
          abortController,
          format,
        });
      }}
    >
      ${icon}
      <tool-tip inert role="tooltip">${name}</tool-tip>
    </icon-button>`
  );
