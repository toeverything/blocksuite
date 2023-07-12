import {
  CaptionIcon,
  CopyIcon,
  DeleteIcon,
  DownloadIcon,
} from '@blocksuite/global/config';
import type { Slot } from '@blocksuite/store';
import { html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

import { stopPropagation } from '../../__internal__/utils/event.js';
import type { IPoint } from '../../__internal__/utils/types.js';
import { tooltipStyle } from '../../components/tooltip/tooltip.js';
import type { ImageBlockModel } from '../image-model.js';
import { copyImage, downloadImage, focusCaption } from './utils.js';

export function ImageOptionsTemplate({
  model,
  position,
  hoverState,
}: {
  model: ImageBlockModel;
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
        z-index: var(--affine-z-index-popover);
      }

      .embed-editing-state {
        box-shadow: var(--affine-shadow-2);
        border-radius: 8px;
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
        <icon-button
          class="has-tool-tip"
          width="100%"
          height="32px"
          @click=${() => focusCaption(model)}
        >
          ${CaptionIcon}
          <tool-tip inert tip-position="right" role="tooltip">Caption</tool-tip>
        </icon-button>
        <icon-button
          class="has-tool-tip"
          width="100%"
          height="32px"
          @click=${() => downloadImage(model)}
        >
          ${DownloadIcon}
          <tool-tip inert tip-position="right" role="tooltip"
            >Download</tool-tip
          >
        </icon-button>
        <icon-button
          class="has-tool-tip"
          width="100%"
          height="32px"
          @click=${() => copyImage(model)}
        >
          ${CopyIcon}
          <tool-tip inert tip-position="right" role="tooltip"
            >Copy to clipboard</tool-tip
          >
        </icon-button>
        <icon-button
          class="has-tool-tip"
          width="100%"
          height="32px"
          @click="${() => model.page.deleteBlock(model)}"
        >
          ${DeleteIcon}
          <tool-tip inert tip-position="right" role="tooltip">Delete</tool-tip>
        </icon-button>
      </div>
    </div>
  `;
}
