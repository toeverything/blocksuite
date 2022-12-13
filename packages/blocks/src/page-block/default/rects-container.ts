import { html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { CaptionIcon, CopyIcon, DeleteIcon, DownloadIcon } from '../icons';
import { downloadImage, focusCaption, copyImgToClip } from './utils';
import { toolTipStyle } from '../../components/tooltip';
import type {
  DefaultPageSignals,
  EmbedEditingState,
} from './default-page-block';
import { assertExists } from '../../__internal__/utils';
export function FrameSelectionRect(rect: DOMRect | null) {
  if (rect === null) return html``;

  const style = {
    left: rect.left + 'px',
    top: rect.top + 'px',
    width: rect.width + 'px',
    height: rect.height + 'px',
  };
  return html`
    <style>
      .affine-page-frame-selection-rect {
        position: absolute;
        background: var(--affine-selected-color);
        z-index: 1;
        pointer-events: none;
      }
    </style>
    <div
      class="affine-page-frame-selection-rect"
      style=${styleMap(style)}
    ></div>
  `;
}

export function EmbedSelectedRectsContainer(
  rects: { left: number; top: number; width: number; height: number }[]
) {
  return html`
    <style>
      .affine-page-selected-embed-rects-container > div {
        position: fixed;
        border: 3px solid var(--affine-primary-color);
      }
    </style>
    <div class="affine-page-selected-embed-rects-container resizable">
      ${rects.map(rect => {
        const style = {
          display: 'block',
          left: rect.left + 'px',
          top: rect.top + 'px',
          width: rect.width + 'px',
          height: rect.height + 'px',
        };
        return html`<div class="resizes" style=${styleMap(style)}>
          <div class="resize top-left"></div>
          <div class="resize top-right"></div>
          <div class="resize bottom-left"></div>
          <div class="resize bottom-right"></div>
        </div>`;
      })}
    </div>
  `;
}

export function SelectedRectsContainer(rects: DOMRect[]) {
  return html`
    <style>
      .affine-page-selected-rects-container > div {
        position: fixed;
        background: var(--affine-selected-color);
        z-index: 1;
        pointer-events: none;
        border-radius: 5px;
      }
    </style>
    <div class="affine-page-selected-rects-container">
      ${rects.map(rect => {
        const style = {
          display: 'block',
          left: rect.left + 'px',
          top: rect.top + 'px',
          width: rect.width + 'px',
          height: rect.height + 'px',
        };
        return html`<div style=${styleMap(style)}></div>`;
      })}
    </div>
  `;
}

export function EmbedEditingContainer(
  embedEditingState: EmbedEditingState | null,
  signals: DefaultPageSignals
) {
  if (embedEditingState) {
    const style = {
      left: embedEditingState.position.x + 'px',
      top: embedEditingState.position.y + 'px',
    };
    return html`
      <style>
        .affine-image-option-container > div {
          position: fixed;
          z-index: 1;
        }
        ${toolTipStyle}
      </style>

      <div class="affine-image-option-container">
        <div style=${styleMap(style)} class="image-option">
          <format-bar-button
            class="has-tool-tip"
            width="100%"
            @click=${() => focusCaption(embedEditingState.model)}
          >
            ${CaptionIcon}
            <tool-tip inert tip-position="right" role="tooltip"
              >Caption</tool-tip
            >
          </format-bar-button>
          <format-bar-button
            class="has-tool-tip"
            width="100%"
            @click=${() => {
              assertExists(embedEditingState.model.sourceId);
              downloadImage(embedEditingState.model.sourceId);
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
              assertExists(embedEditingState.model.sourceId);
              copyImgToClip(embedEditingState.model.sourceId);
            }}
          >
            ${CopyIcon}
            <tool-tip inert tip-position="right" role="tooltip">Copy</tool-tip>
          </format-bar-button>
          <format-bar-button
            class="has-tool-tip"
            width="100%"
            @click="${() => {
              embedEditingState.model.page.deleteBlock(embedEditingState.model);
              signals.updateEmbedRects.emit([]);
            }}"
          >
            ${DeleteIcon}
            <tool-tip inert tip-position="right" role="tooltip"
              >Delete</tool-tip
            >
          </format-bar-button>
        </div>
      </div>
    `;
  } else {
    return html``;
  }
}
