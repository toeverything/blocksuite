import type { BlockSuiteRoot } from '@blocksuite/lit';
import { html, nothing } from 'lit';
import { ref, type RefOrCallback } from 'lit/directives/ref.js';

import { stopPropagation } from '../../__internal__/utils/event.js';
import { turnImageIntoCardView } from '../../attachment-block/utils.js';
import { tooltipStyle } from '../../components/tooltip/tooltip.js';
import {
  BookmarkIcon,
  CaptionIcon,
  CopyIcon,
  DeleteIcon,
  DownloadIcon,
  HighLightDuotoneIcon,
} from '../../icons/index.js';
import {
  copyImage,
  downloadImage,
  focusCaption,
} from '../../image-block/image/utils.js';
import { type ImageBlockModel } from '../../image-block/index.js';
import { openLeditsEditor } from '../../image-block/ledits/main.js';

export function ImageOptionsTemplate({
  ref: containerRef,
  model,
  blob,
  abortController,
  root,
}: {
  ref: RefOrCallback;
  model: ImageBlockModel;
  blob: Blob;
  abortController: AbortController;
  /**
   * @deprecated
   */
  root: BlockSuiteRoot;
}) {
  const supportAttachment =
    model.page.schema.flavourSchemaMap.has('affine:attachment');
  const readonly = model.page.readonly;

  return html`
    <style>
      .affine-embed-editing-state-container > div {
        display: block;
        z-index: var(--affine-z-index-popover);
      }

      .embed-editing-state {
        box-sizing: border-box;
        box-shadow: var(--affine-shadow-2);
        border-radius: 8px;
        list-style: none;
        padding: 4px;
        background-color: var(--affine-background-overlay-panel-color);
        margin: 0;
      }
      .has-tool-tip.delete-image-button:hover {
        background: var(--affine-background-error-color);
        color: var(--affine-error-color);
      }
      .has-tool-tip.delete-image-button:hover > svg {
        color: var(--affine-error-color);
      }

      ${tooltipStyle}
    </style>

    <div
      ${ref(containerRef)}
      class="affine-embed-editing-state-container"
      @pointerdown=${stopPropagation}
    >
      <div class="embed-editing-state">
        ${supportAttachment
          ? html`<icon-button
              class="has-tool-tip"
              size="32px"
              ?hidden=${readonly}
              @click=${() => {
                abortController.abort();
                turnImageIntoCardView(model, blob);
              }}
            >
              ${BookmarkIcon}
              <tool-tip inert role="tooltip">Turn into Card view</tool-tip>
            </icon-button>`
          : nothing}
        <icon-button
          class="has-tool-tip"
          size="32px"
          ?hidden=${readonly}
          @click=${() => focusCaption(model)}
        >
          ${CaptionIcon}
          <tool-tip inert tip-position="right" role="tooltip">Caption</tool-tip>
        </icon-button>
        <icon-button
          class="has-tool-tip"
          size="32px"
          @click=${() => downloadImage(model)}
        >
          ${DownloadIcon}
          <tool-tip inert tip-position="right" role="tooltip"
            >Download</tool-tip
          >
        </icon-button>
        <icon-button
          class="has-tool-tip"
          size="32px"
          @click=${() => copyImage(model)}
        >
          ${CopyIcon}
          <tool-tip inert tip-position="right" role="tooltip"
            >Copy to clipboard</tool-tip
          >
        </icon-button>
        <icon-button
          class="has-tool-tip delete-image-button"
          size="32px"
          ?hidden=${readonly}
          @click="${() => {
            abortController.abort();
            model.page.deleteBlock(model);
          }}"
        >
          ${DeleteIcon}
          <tool-tip inert tip-position="right" role="tooltip">Delete</tool-tip>
        </icon-button>
        <icon-button
          class="has-tool-tip"
          size="32px"
          ?hidden=${readonly ||
          !model.page.awarenessStore.getFlag('enable_bultin_ledits')}
          @click="${() => {
            abortController.abort();
            openLeditsEditor(model, blob, root);
          }}"
        >
          ${HighLightDuotoneIcon}
          <tool-tip inert tip-position="right" role="tooltip"
            >Edit with LEDITS</tool-tip
          >
        </icon-button>
      </div>
    </div>
  `;
}
