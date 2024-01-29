import type { EditorHost } from '@blocksuite/lit';
import { html, nothing } from 'lit';
import { ref, type RefOrCallback } from 'lit/directives/ref.js';

import {
  BookmarkIcon,
  CaptionIcon,
  CopyIcon,
  DeleteIcon,
  DownloadIcon,
  HighLightDuotoneIcon,
} from '../../../_common/icons/index.js';
import { stopPropagation } from '../../../_common/utils/event.js';
import { turnImageIntoCardView } from '../../../attachment-block/utils.js';
import type { ImageBlockModel } from '../../../image-block/index.js';
import { openLeditsEditor } from '../../../image-block/ledits/main.js';
import {
  copyImage,
  downloadImage,
  focusCaption,
} from '../../../image-block/utils.js';

export function ImageOptionsTemplate({
  editorHost,
  ref: containerRef,
  model,
  blob,
  abortController,
  host,
}: {
  editorHost: EditorHost;
  ref?: RefOrCallback;
  model: ImageBlockModel;
  blob?: Blob;
  abortController: AbortController;
  /**
   * @deprecated
   */
  host: EditorHost;
}) {
  const supportAttachment =
    model.page.schema.flavourSchemaMap.has('affine:attachment');
  const readonly = model.page.readonly;

  return html`
    <style>
      :host {
        z-index: 1;
      }
      .affine-embed-editing-state-container > div {
        display: block;
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
      .delete-image-button:hover {
        background: var(--affine-background-error-color);
        color: var(--affine-error-color);
      }
      .delete-image-button:hover > svg {
        color: var(--affine-error-color);
      }
    </style>

    <div
      ${ref(containerRef)}
      class="affine-embed-editing-state-container"
      @pointerdown=${stopPropagation}
    >
      <div class="embed-editing-state">
        ${supportAttachment
          ? html`<icon-button
              size="32px"
              ?hidden=${readonly || !blob}
              @click=${() => {
                if (!blob) return;
                abortController.abort();
                turnImageIntoCardView(model, blob);
              }}
            >
              ${BookmarkIcon}
              <affine-tooltip>Turn into Card view</affine-tooltip>
            </icon-button>`
          : nothing}
        <icon-button
          size="32px"
          ?hidden=${readonly}
          @click=${() => focusCaption(editorHost, model)}
        >
          ${CaptionIcon}
          <affine-tooltip tip-position="right">Caption</affine-tooltip>
        </icon-button>
        <icon-button size="32px" @click=${() => downloadImage(model)}>
          ${DownloadIcon}
          <affine-tooltip tip-position="right">Download</affine-tooltip>
        </icon-button>
        <icon-button size="32px" @click=${() => copyImage(editorHost, model)}>
          ${CopyIcon}
          <affine-tooltip tip-position="right"
            >Copy to clipboard</affine-tooltip
          >
        </icon-button>
        <icon-button
          class="delete-image-button"
          size="32px"
          ?hidden=${readonly}
          @click="${() => {
            abortController.abort();
            model.page.deleteBlock(model);
          }}"
        >
          ${DeleteIcon}
          <affine-tooltip tip-position="right">Delete</affine-tooltip>
        </icon-button>
        <icon-button
          size="32px"
          ?hidden=${readonly ||
          !blob ||
          !model.page.awarenessStore.getFlag('enable_bultin_ledits')}
          @click="${() => {
            if (!blob) return;
            abortController.abort();
            openLeditsEditor(model, blob, host);
          }}"
        >
          ${HighLightDuotoneIcon}
          <affine-tooltip tip-position="right">Edit with LEDITS</affine-tooltip>
        </icon-button>
      </div>
    </div>
  `;
}
