import './ai-action-list.js';

import { assertExists } from '@blocksuite/global/utils';
import { computePosition, flip, offset, shift } from '@floating-ui/dom';
import { html, type TemplateResult } from 'lit';
import { ref, type RefOrCallback } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { AffineFormatBarWidget } from '../../../root-block/widgets/format-bar/format-bar.js';
import { AIStarIcon } from '../../icons/ai.js';
import { whenHover } from '../hover/when-hover.js';

const AskAIPanel = (
  formatBar: AffineFormatBarWidget,
  containerRef?: RefOrCallback
) => {
  return html` <style>
      .ask-ai-panel {
        display: none;
        box-sizing: border-box;
        position: absolute;
        padding: 8px;
        min-width: 294px;
        max-height: 374px;
        overflow-y: auto;
        background: var(--affine-background-overlay-panel-color);
        box-shadow: var(--affine-shadow-2);
        border-radius: 8px;
        z-index: var(--affine-z-index-popover);
      }
      .ask-ai-icon-button svg {
        color: var(--affine-brand-color);
      }
      .ask-ai-panel::-webkit-scrollbar {
        width: 5px;
        max-height: 100px;
      }
      .ask-ai-panel::-webkit-scrollbar-thumb {
        border-radius: 20px;
      }
      .ask-ai-panel:hover::-webkit-scrollbar-thumb {
        background-color: var(--affine-black-30);
      }
      .ask-ai-panel::-webkit-scrollbar-corner {
        display: none;
      }
    </style>
    <div ${ref(containerRef)} class="ask-ai-panel">
      <ai-action-list .host=${formatBar.host}></ai-action-list>
    </div>`;
};

export const AskAIButton = (formatBar: AffineFormatBarWidget) => {
  // const editorHost = formatBar.host;

  const { setFloating, setReference } = whenHover(isHover => {
    if (!isHover) {
      const panel =
        formatBar.shadowRoot?.querySelector<HTMLElement>('.ask-ai-panel');
      if (!panel) return;
      panel.style.display = 'none';
      return;
    }
    const button =
      formatBar.shadowRoot?.querySelector<HTMLElement>('.ask-ai-button');
    const panel =
      formatBar.shadowRoot?.querySelector<HTMLElement>('.ask-ai-panel');
    assertExists(button);
    assertExists(panel);
    panel.style.display = 'flex';
    computePosition(button, panel, {
      placement: 'bottom-start',
      middleware: [
        flip(),
        offset(10),
        shift({
          padding: 16,
        }),
      ],
    })
      .then(({ x, y }) => {
        panel.style.left = `${x}px`;
        panel.style.top = `${y}px`;
      })
      .catch(console.error);
  });

  const askAIPanel = AskAIPanel(formatBar, setFloating);

  const buttonStyle = styleMap({
    color: 'var(--affine-brand-color)',
    fontWeight: '500',
    fontSize: 'var(--affine-font-sm)',
  });

  const labelStyle = styleMap({
    lineHeight: '22px',
    paddingLeft: '4px',
  });

  return html`<div ${ref(setReference)} class="ask-ai-button">
    <icon-button
      class="ask-ai-icon-button"
      width="75px"
      height="32px"
      style=${buttonStyle}
    >
      ${AIStarIcon} <span style=${labelStyle}>Ask AI</span></icon-button
    >
    ${askAIPanel}
  </div>`;
};

export const affineFormatBarAskAIButton = {
  type: 'custom' as const,
  render(formatBar: AffineFormatBarWidget): TemplateResult | null {
    return AskAIButton(formatBar);
  },
};
