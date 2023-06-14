import {
  CaptionIcon,
  CopyIcon,
  DeleteIcon,
  DownloadIcon,
} from '@blocksuite/global/config';
import type { Slot } from '@blocksuite/store';
import { html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

import type { IPoint } from '../../__internal__/utils/types.js';
import { tooltipStyle } from '../../components/tooltip/tooltip.js';
import {
  copyImage,
  downloadImage,
  focusCaption,
} from '../../page-block/default/utils.js';
import { stopPropagation } from '../../page-block/edgeless/utils.js';
import type { EmbedBlockModel } from '../embed-model.js';

export function ImageOptionsTemplate({
  model,
  position,
  hoverState,
}: {
  model: EmbedBlockModel;
  position: IPoint;
  hoverState: Slot<boolean>;
}) {
  const style = {
    left: position.x + 'px',
    top: position.y + 'px',
  };

  return html`
    <style>
      .affine-embed-editing-state-container > div {
        position: fixed;
        display: block;
        z-index: 1;
      }

      .embed-editing-state {
        box-shadow: var(--affine-shadow-2);
        border-radius: 10px;
        list-style: none;
        padding: 4px;
        width: 40px;
        background-color: var(--affine-background-overlay-panel-color);
        margin: 0;
      }
      ${tooltipStyle}
    </style>

    <div
      class="affine-embed-editing-state-container"
      @pointerdown=${stopPropagation}
      @mouseover=${() => hoverState.emit(true)}
      @mouseout=${() => hoverState.emit(false)}
    >
      <div style=${styleMap(style)} class="embed-editing-state">
        <format-bar-button
          class="has-tool-tip"
          width="100%"
          @click=${() => {
            focusCaption(model);
          }}
        >
          ${CaptionIcon}
          <tool-tip inert tip-position="right" role="tooltip">Caption</tool-tip>
        </format-bar-button>
        <format-bar-button
          class="has-tool-tip"
          width="100%"
          @click=${() => {
            downloadImage(model);
          }}
        >
          ${DownloadIcon}
          <tool-tip inert tip-position="right" role="tooltip"
            >Download</tool-tip
          >
        </format-bar-button>
        <format-bar-button
          class="has-tool-tip"
          width="100%"
          @click=${() => {
            copyImage(model);
          }}
        >
          ${CopyIcon}
          <tool-tip inert tip-position="right" role="tooltip"
            >Copy to clipboard</tool-tip
          >
        </format-bar-button>
        <format-bar-button
          class="has-tool-tip"
          width="100%"
          @click="${() => {
            model.page.deleteBlock(model);
          }}"
        >
          ${DeleteIcon}
          <tool-tip inert tip-position="right" role="tooltip">Delete</tool-tip>
        </format-bar-button>
      </div>
    </div>
  `;
}
