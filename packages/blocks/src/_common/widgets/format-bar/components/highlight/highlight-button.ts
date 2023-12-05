import { assertExists } from '@blocksuite/global/utils';
import type { BlockSuiteRoot } from '@blocksuite/lit';
import { computePosition, flip, shift } from '@floating-ui/dom';
import { html } from 'lit';

import type { AffineTextAttributes } from '../../../../components/rich-text/virgo/types.js';
import {
  ArrowDownIcon,
  HighLightDuotoneIcon,
  TextBackgroundDuotoneIcon,
  TextForegroundDuotoneIcon,
} from '../../../../icons/index.js';
import type { AffineFormatBarWidget } from '../../format-bar.js';
import { backgroundConfig, foregroundConfig } from './consts.js';

enum HighlightType {
  Foreground,
  Background,
}

let lastUsedColor: string | null = null;
let lastUsedHighlightType: HighlightType = HighlightType.Background;

const updateHighlight = (
  root: BlockSuiteRoot,
  color: string | null,
  highlightType: HighlightType
) => {
  lastUsedColor = color;
  lastUsedHighlightType = highlightType;

  const payload: {
    styles: AffineTextAttributes;
  } = {
    styles: {
      color: highlightType === HighlightType.Foreground ? color : null,
      background: highlightType === HighlightType.Background ? color : null,
    },
  };
  root.std.command
    .pipe()
    .withRoot()
    .try(chain => [
      chain.getTextSelection().formatText(payload),
      chain.getBlockSelections().formatBlock(payload),
      chain.formatNative(payload),
    ])
    .run();
};

const HighlightPanel = (formatBar: AffineFormatBarWidget) => {
  return html`<div class="highlight-panel">
    <!-- Text Color Highlight -->
    <div class="highligh-panel-heading">Color</div>
    ${foregroundConfig.map(
      ({ name, color }) =>
        html`<icon-button
          width="100%"
          height="32px"
          style="padding-left: 4px; justify-content: flex-start; gap: 8px;"
          text="${name}"
          data-testid="${color ?? 'unset'}"
          @click="${() => {
            updateHighlight(formatBar.root, color, HighlightType.Foreground);
            formatBar.requestUpdate();
          }}"
        >
          <span style="color: ${color}; display: flex; align-items: center;">
            ${TextForegroundDuotoneIcon}
          </span>
        </icon-button>`
    )}

    <!-- Text Background Highlight -->
    <div class="highligh-panel-heading">Background</div>
    ${backgroundConfig.map(
      ({ name, color }) =>
        html`<icon-button
          width="100%"
          height="32px"
          style="padding-left: 4px; justify-content: flex-start; gap: 8px;"
          text="${name}"
          @click="${() => {
            updateHighlight(formatBar.root, color, HighlightType.Background);
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

export const HighlightButton = (formatBar: AffineFormatBarWidget) => {
  const root = formatBar.blockElement.root;

  const highlightPanel = HighlightPanel(formatBar);

  const onHover = () => {
    const button = formatBar.shadowRoot?.querySelector(
      '.highlight-button'
    ) as HTMLElement | null;
    const panel = formatBar.shadowRoot?.querySelector(
      '.highlight-panel'
    ) as HTMLElement | null;
    assertExists(button);
    assertExists(panel);
    panel.style.display = 'block';
    computePosition(button, panel, {
      placement: 'bottom',
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
      '.highlight-panel'
    ) as HTMLElement | null;
    assertExists(panel);
    panel.style.display = 'none';
  };

  return html`<div
    @mouseleave=${onHoverEnd}
    @mouseenter=${onHover}
    class="highlight-button"
  >
    <icon-button
      class="highlight-icon"
      data-last-used="${lastUsedColor ?? 'unset'}"
      width="52px"
      height="32px"
      @click="${() =>
        updateHighlight(root, lastUsedColor, lastUsedHighlightType)}"
    >
      <span
        style="color: ${lastUsedColor}; display: flex; align-items: center; "
        >${HighLightDuotoneIcon}</span
      >
      ${ArrowDownIcon}</icon-button
    >
    ${highlightPanel}
  </div>`;
};
