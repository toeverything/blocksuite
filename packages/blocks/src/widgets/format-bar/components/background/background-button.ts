import { assertExists } from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';
import { computePosition, flip, shift } from '@floating-ui/dom';
import { html, nothing } from 'lit';

import {
  ArrowDownIcon,
  HighLightDuotoneIcon,
  TextBackgroundDuotoneIcon,
} from '../../../../icons/index.js';
import { noneInlineUnsupportedBlockSelected } from '../../../../page-block/const/inline-format-config.js';
import { isPageComponent } from '../../../../page-block/utils/guard.js';
import { formatByTextSelection } from '../../../../page-block/utils/operations/element/inline-level.js';
import type { AffineFormatBarWidget } from '../../format-bar.js';
import { backgroundConfig } from './const.js';

let lastUsedColor: string | null = null;

const updateBackground = (
  blockElement: BlockElement,
  color: string | null = null
) => {
  lastUsedColor = color;

  const textSelection = blockElement.selection.find('text');

  if (!textSelection) {
    const blockSelections = blockElement.selection.filter('block');
    for (const blockSelection of blockSelections) {
      const el = blockElement.root.viewStore.viewFromPath(
        'block',
        blockSelection.path
      );
      if (el && el.model.text) {
        el.model.text.format(0, el.model.text.length, {
          background: color,
        });
      }
    }
    return;
  }

  formatByTextSelection(blockElement, textSelection, 'background', color);
};

const BackgroundPanel = (formatBar: AffineFormatBarWidget) => {
  return html`<div class="background-highlight-panel">
    ${backgroundConfig.map(
      ({ name, color }) => html`<icon-button
        width="100%"
        height="32px"
        style="padding-left: 4px; justify-content: flex-start; gap: 8px;"
        text="${name}"
        data-testid="${color ?? 'unset'}"
        @click="${() => {
          updateBackground(formatBar.pageElement, color);
          formatBar.requestUpdate();
        }}"
      >
        <span
          style="color: ${color ??
          'rgba(0,0,0,0)'}; display: flex; align-items: center;"
        >
          ${TextBackgroundDuotoneIcon}
        </span>
      </icon-button>`
    )}
  </div>`;
};

export const BackgroundButton = (formatBar: AffineFormatBarWidget) => {
  const pageElement = formatBar.pageElement;
  if (!isPageComponent(pageElement)) {
    throw new Error('Background highlight button host is not a page component');
  }

  if (!noneInlineUnsupportedBlockSelected(pageElement)) {
    return nothing;
  }

  const backgroundHighlightPanel = BackgroundPanel(formatBar);

  const onHover = () => {
    const button = formatBar.shadowRoot?.querySelector(
      '.background-button'
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
    class="background-button"
  >
    <icon-button
      class="background-highlight-icon"
      style="color: ${lastUsedColor ?? 'rgba(0,0,0,0)'}"
      data-last-used="${lastUsedColor ?? 'unset'}"
      width="52px"
      height="32px"
      @click="${() => updateBackground(pageElement, lastUsedColor)}"
    >
      ${HighLightDuotoneIcon} ${ArrowDownIcon}</icon-button
    >
    ${backgroundHighlightPanel}
  </div>`;
};
