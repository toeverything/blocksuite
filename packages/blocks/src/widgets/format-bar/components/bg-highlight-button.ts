import {
  ArrowDownIcon,
  HighLightDuotoneIcon,
  TextBackgroundDuotoneIcon,
} from '@blocksuite/global/config';
import { assertExists } from '@blocksuite/store';
import { computePosition, flip, shift } from '@floating-ui/dom';
import { html } from 'lit';

import { backgroundHighlightConfig } from '../../../page-block/const/bg-highlight-config.js';
import type { PageBlockComponent } from '../../../page-block/types.js';
import { isPageComponent } from '../../../page-block/utils/guard.js';
import { handleFormat } from '../../../page-block/utils/operations/inline.js';
import { getTextSelection } from '../../../page-block/utils/selection.js';
import type { AffineFormatBarWidget } from '../format-bar.js';

interface BackgroundHighlightPanelProps {
  pageElement: PageBlockComponent;
}

interface BackgroundHighlightButtonProps {
  formatBar: AffineFormatBarWidget;
}

let lastUsedColor: string | undefined;

const updateBackgroundHighlight = (
  pageElement: PageBlockComponent,
  color?: string
) => {
  const textSelection = getTextSelection(pageElement);
  assertExists(textSelection);
  if (color) {
    lastUsedColor = color;
  }
  handleFormat(pageElement, textSelection, 'bghighlight', lastUsedColor);
};

const BackgroundHighlightPanel = ({
  pageElement,
}: BackgroundHighlightPanelProps) => {
  return html`<div class="background-highlight-panel">
    ${backgroundHighlightConfig.map(
      ({ name, color }) => html`<icon-button
        width="100%"
        height="32px"
        style="padding-left: 12px; justify-content: flex-start; gap: 8px;"
        text="${name}"
        data-testid="${color}"
        @click="${() => updateBackgroundHighlight(pageElement, color)}"
      >
        <span style="color: ${color}; display: flex; align-items: center;">
          ${TextBackgroundDuotoneIcon}
        </span>
      </icon-button>`
    )}
  </div>`;
};

export const BackgroundHighlightButton = ({
  formatBar,
}: BackgroundHighlightButtonProps) => {
  const pageElement = formatBar.pageElement;
  if (!isPageComponent(pageElement)) {
    throw new Error('Background highlight button host is not a page component');
  }

  const backgroundHighlightPanel = BackgroundHighlightPanel({
    pageElement,
  });

  const onHover = () => {
    const button = formatBar.shadowRoot?.querySelector(
      '.background-highlight-button'
    ) as HTMLElement | null;
    const panel = formatBar.shadowRoot?.querySelector(
      '.background-highlight-panel'
    ) as HTMLElement | null;
    assertExists(button);
    assertExists(panel);
    panel.style.display = 'block';
    computePosition(button, panel, {
      placement: 'top',
      middleware: [
        flip(),
        shift({
          padding: 6,
        }),
      ],
    }).then(({ x, y }) => {
      panel.style.left = `${x}px`;
      panel.style.top = `${y}px`;
    });
  };
  const onHoverEnd = () => {
    const panel = formatBar.shadowRoot?.querySelector(
      '.background-highlight-panel'
    ) as HTMLElement | null;
    assertExists(panel);
    panel.style.display = 'none';
  };

  return html`<div
    @mouseleave=${onHoverEnd}
    @mouseenter=${onHover}
    class="background-highlight-button"
  >
    <icon-button
      class="background-highlight-icon"
      style="color: ${lastUsedColor}"
      width="52px"
      height="32px"
      @click="${() => updateBackgroundHighlight(pageElement)}"
    >
      ${HighLightDuotoneIcon} ${ArrowDownIcon}</icon-button
    >
    ${backgroundHighlightPanel}
  </div>`;
};
