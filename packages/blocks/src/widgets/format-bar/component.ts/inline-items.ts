import { html } from 'lit';

import { inlineFormatConfig } from '../../../page-block/const/inline-format-config.js';
import type { PageBlockComponent } from '../../../page-block/types.js';
import { getCurrentCombinedFormat } from '../../../page-block/utils/container-operations.js';
import { getTextSelection } from '../../../page-block/utils/selection.js';

interface InlineItemsProps {
  pageElement: PageBlockComponent;
  abortController: AbortController;
}

export const InlineItems = ({
  pageElement,
  abortController,
}: InlineItemsProps) => {
  const textSelection = getTextSelection(pageElement);
  if (!textSelection || textSelection.isCollapsed()) {
    return [];
  }
  const format = getCurrentCombinedFormat(pageElement, textSelection);

  return inlineFormatConfig.map(
    ({ id, name, icon, action, activeWhen }) => html`<icon-button
      size="32px"
      class="has-tool-tip"
      data-testid=${id}
      ?active=${activeWhen(format)}
      @click=${() => {
        action({
          pageElement,
          abortController,
          format,
        });
      }}
    >
      ${icon}
      <tool-tip inert role="tooltip">${name}</tool-tip>
    </icon-button>`
  );
};
