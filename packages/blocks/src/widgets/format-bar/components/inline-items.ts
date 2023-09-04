import { html, nothing } from 'lit';

import type { AffineTextAttributes } from '../../../__internal__/rich-text/virgo/types.js';
import {
  includeInlineSupportedBlockSelected,
  inlineFormatConfig,
} from '../../../page-block/const/inline-format-config.js';
import { isPageComponent } from '../../../page-block/utils/guard.js';
import {
  getCombinedFormatInBlockSelections,
  getCombinedFormatInTextSelection,
} from '../../../page-block/utils/selection.js';
import type { AffineFormatBarWidget } from '../format-bar.js';
import { BackgroundButton } from './background/background-button.js';

export const InlineItems = (formatBar: AffineFormatBarWidget) => {
  const pageElement = formatBar.pageElement;
  if (!isPageComponent(pageElement)) {
    throw new Error('the pageElement of formatBar is not a PageComponent');
  }

  if (!includeInlineSupportedBlockSelected(pageElement)) {
    return nothing;
  }

  let type: 'text' | 'block' = 'text';
  let format: AffineTextAttributes = {};
  const textSelection = pageElement.selection.find('text');
  const blockSelections = pageElement.selection.filter('block');

  if (
    !(
      (textSelection && !textSelection.isCollapsed()) ||
      blockSelections.length > 0
    )
  ) {
    return [];
  }

  if (textSelection) {
    format = getCombinedFormatInTextSelection(pageElement.root, textSelection);
    type = 'text';
  } else {
    format = getCombinedFormatInBlockSelections(
      pageElement.root,
      blockSelections
    );
    type = 'block';
  }

  const backgroundButton = BackgroundButton(formatBar);

  return html`${inlineFormatConfig
      .filter(({ showWhen }) => showWhen(pageElement))
      .map(
        ({ id, name, icon, action, activeWhen }) =>
          html`<icon-button
            size="32px"
            class="has-tool-tip"
            data-testid=${id}
            ?active=${activeWhen(format)}
            @click=${() => {
              action({
                blockElement: pageElement,
                type,
                format,
              });
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
