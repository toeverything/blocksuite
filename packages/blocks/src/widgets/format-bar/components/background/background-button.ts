import { assertExists } from '@blocksuite/global/utils';
import type { BlockSuiteRoot } from '@blocksuite/lit';
import { computePosition, flip, shift } from '@floating-ui/dom';
import { html } from 'lit';

import type { AffineTextAttributes } from '../../../../components/rich-text/virgo/types.js';
import {
  ArrowDownIcon,
  HighLightDuotoneIcon,
  TextBackgroundDuotoneIcon,
} from '../../../../icons/index.js';
import type { AffineFormatBarWidget } from '../../format-bar.js';
import { backgroundConfig } from './const.js';

let lastUsedColor: string | null = null;

const updateBackground = (
  root: BlockSuiteRoot,
  color: string | null = null
) => {
  lastUsedColor = color;

  const payload: {
    root: BlockSuiteRoot;
    styles: AffineTextAttributes;
  } = {
    root,
    styles: {
      background: color,
    },
  };
  root.std.command
    .pipe()
    .try(chain => [
      chain.formatText(payload),
      chain.formatBlock(payload),
      chain.formatNative(payload),
    ])
    .run();
};

const BackgroundPanel = (formatBar: AffineFormatBarWidget) => {
  return html`<div class="background-highlight-panel">
    ${backgroundConfig.map(
      ({ name, color }) =>
        html`<icon-button
          width="100%"
          height="32px"
          style="padding-left: 4px; justify-content: flex-start; gap: 8px;"
          text="${name}"
          data-testid="${color ?? 'unset'}"
          @click="${() => {
            updateBackground(formatBar.root, color);
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
  const root = formatBar.pageElement.root;

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
      @click="${() => updateBackground(root, lastUsedColor)}"
    >
      ${HighLightDuotoneIcon} ${ArrowDownIcon}</icon-button
    >
    ${backgroundHighlightPanel}
  </div>`;
};
