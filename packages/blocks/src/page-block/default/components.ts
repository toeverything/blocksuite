import {
  CaptionIcon,
  CopyIcon,
  DeleteIcon,
  DownloadIcon,
} from '@blocksuite/global/config';
import { html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

import type { EditingState, IPoint } from '../../__internal__/index.js';
import { tooltipStyle } from '../../components/tooltip/tooltip.js';
import type { EmbedBlockModel } from '../../embed-block/embed-model.js';
import { stopPropagation } from '../edgeless/utils.js';
import type { DefaultSelectionSlots } from './default-page-block.js';
import { copyImage, downloadImage, focusCaption } from './utils.js';

export function DraggingArea(rect: DOMRect | null) {
  if (rect === null) return null;

  const style = {
    left: rect.left + 'px',
    top: rect.top + 'px',
    width: rect.width + 'px',
    height: rect.height + 'px',
  };
  return html`
    <style>
      .affine-page-dragging-area {
        position: absolute;
        background: var(--affine-hover-color);
        z-index: 1;
        pointer-events: none;
      }
    </style>
    <div class="affine-page-dragging-area" style=${styleMap(style)}></div>
  `;
}

export function EmbedSelectedRectsContainer(
  rects: DOMRect[],
  viewportOffset: IPoint
) {
  return html`
    <style>
      .affine-page-selected-embed-rects-container > div {
        position: absolute;
        display: block;
        border: 2px solid var(--affine-primary-color);
        user-select: none;
      }
    </style>
    <div class="affine-page-selected-embed-rects-container resizable">
      ${rects.map(rect => {
        const style = {
          left: rect.left + viewportOffset.x + 'px',
          top: rect.top + viewportOffset.y + 'px',
          width: rect.width + 'px',
          height: rect.height + 'px',
        };
        return html`
          <div class="resizes" style=${styleMap(style)}>
            <div class="resize top-left"></div>
            <div class="resize top-right"></div>
            <div class="resize bottom-left"></div>
            <div class="resize bottom-right"></div>
          </div>
        `;
      })}
    </div>
  `;
}

export function EmbedEditingContainer(
  embedEditingState: EditingState | null,
  slots: DefaultSelectionSlots,
  viewportOffset: IPoint
) {
  if (!embedEditingState) return null;

  const {
    rect: { x, y },
    model,
  } = embedEditingState;
  const style = {
    left: x + viewportOffset.x + 'px',
    top: y + viewportOffset.y + 'px',
  };

  return html`
    <style>
      .affine-embed-editing-state-container > div {
        position: absolute;
        display: block;
        z-index: 1;
      }
      ${tooltipStyle}
    </style>

    <div
      class="affine-embed-editing-state-container"
      @pointerdown=${stopPropagation}
    >
      <div style=${styleMap(style)} class="embed-editing-state">
        <format-bar-button
          class="has-tool-tip"
          width="100%"
          @click=${() => {
            focusCaption(model);
            slots.embedRectsUpdated.emit([]);
          }}
        >
          ${CaptionIcon}
          <tool-tip inert tip-position="right-start" role="tooltip"
            >Caption</tool-tip
          >
        </format-bar-button>
        <format-bar-button
          class="has-tool-tip"
          width="100%"
          @click=${() => {
            downloadImage(model);
          }}
        >
          ${DownloadIcon}
          <tool-tip inert tip-position="right-start" role="tooltip"
            >Download
          </tool-tip>
        </format-bar-button>
        <format-bar-button
          class="has-tool-tip"
          width="100%"
          @click=${() => {
            copyImage(model as EmbedBlockModel);
          }}
        >
          ${CopyIcon}
          <tool-tip inert tip-position="right-start" role="tooltip"
            >Copy to clipboard
          </tool-tip>
        </format-bar-button>
        <format-bar-button
          class="has-tool-tip"
          width="100%"
          @click="${() => {
            model.page.deleteBlock(model);
            slots.embedRectsUpdated.emit([]);
          }}"
        >
          ${DeleteIcon}
          <tool-tip inert tip-position="right-start" role="tooltip"
            >Delete</tool-tip
          >
        </format-bar-button>
      </div>
    </div>
  `;
}
