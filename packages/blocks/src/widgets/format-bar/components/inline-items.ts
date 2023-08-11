import { html } from 'lit';

import type { AffineTextAttributes } from '../../../__internal__/rich-text/virgo/types.js';
import { inlineFormatConfig } from '../../../page-block/const/inline-format-config.js';
import type { PageBlockComponent } from '../../../page-block/types.js';
import {
  getBlockSelections,
  getCombinedFormatInBlockSelections,
  getCombinedFormatInTextSelection,
  getTextSelection,
} from '../../../page-block/utils/selection.js';
import type { AffineFormatBarWidget } from '../format-bar.js';

interface InlineItemsProps {
  pageElement: PageBlockComponent;
  formatBar: AffineFormatBarWidget;
}

export const InlineItems = ({ pageElement, formatBar }: InlineItemsProps) => {
  let type: 'text' | 'block' = 'text';
  let format: AffineTextAttributes = {};
  const textSelection = getTextSelection(pageElement);
  const blockSelections = getBlockSelections(pageElement);

  if (
    !(
      (textSelection && !textSelection.isCollapsed()) ||
      blockSelections.length > 0
    )
  ) {
    return [];
  }

  if (textSelection) {
    format = getCombinedFormatInTextSelection(pageElement, textSelection);
    type = 'text';
  } else {
    format = getCombinedFormatInBlockSelections(pageElement, blockSelections);
    type = 'block';
  }

  return inlineFormatConfig
    .filter(({ showWhen }) => showWhen(pageElement))
    .map(
      ({ id, name, icon, action, activeWhen }) => html`<icon-button
        size="32px"
        class="has-tool-tip"
        data-testid=${id}
        ?active=${activeWhen(format)}
        @click=${() => {
          action({
            pageElement,
            type,
            format,
          });
          formatBar.requestUpdate();
        }}
      >
        ${icon}
        <tool-tip inert role="tooltip">${name}</tool-tip>
      </icon-button>`
    );
};
