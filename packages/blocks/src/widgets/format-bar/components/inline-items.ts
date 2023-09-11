import { html, nothing } from 'lit';

import {
  includeInlineSupportedBlockSelected,
  inlineFormatConfig,
} from '../../../common/inline-format-config.js';
import type { AffineTextAttributes } from '../../../components/rich-text/virgo/types.js';
import {
  getCombinedFormatInBlockSelections,
  getCombinedFormatInTextSelection,
} from '../../../page-block/utils/selection.js';
import type { AffineFormatBarWidget } from '../format-bar.js';
import { BackgroundButton } from './background/background-button.js';

export const InlineItems = (formatBar: AffineFormatBarWidget) => {
  const root = formatBar.root;

  if (!includeInlineSupportedBlockSelected(root)) {
    return nothing;
  }

  let type: 'text' | 'block' = 'text';
  let format: AffineTextAttributes = {};
  const textSelection = root.selection.find('text');
  const blockSelections = root.selection.filter('block');

  if (
    !(
      (textSelection && !textSelection.isCollapsed()) ||
      blockSelections.length > 0
    )
  ) {
    return [];
  }

  if (textSelection) {
    format = getCombinedFormatInTextSelection(root, textSelection);
    type = 'text';
  } else {
    format = getCombinedFormatInBlockSelections(root, blockSelections);
    type = 'block';
  }

  const backgroundButton = BackgroundButton(formatBar);

  return html`${inlineFormatConfig
      .filter(({ showWhen }) => showWhen(root))
      .map(
        ({ id, name, icon, action, activeWhen }) =>
          html`<icon-button
            size="32px"
            class="has-tool-tip"
            data-testid=${id}
            ?active=${activeWhen(format)}
            @click=${() => {
              action({
                root,
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
