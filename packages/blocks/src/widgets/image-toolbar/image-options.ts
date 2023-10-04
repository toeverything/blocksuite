import type { BlockSuiteRoot } from '@blocksuite/lit';
import { html, nothing } from 'lit';
import { ref, type RefOrCallback } from 'lit/directives/ref.js';

import { stopPropagation } from '../../__internal__/utils/event.js';
import { turnImageIntoCardView } from '../../attachment-block/utils.js';
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
  ref?: RefOrCallback;
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
              ?hidden=${readonly}
              @click=${() => {
                abortController.abort();
                turnImageIntoCardView(model, blob);
              }}
            >
              ${BookmarkIcon}
              <blocksuite-tooltip>Turn into Card view</blocksuite-tooltip>
            </icon-button>`
          : nothing}
        <icon-button
          size="32px"
          ?hidden=${readonly}
          @click=${() => focusCaption(model)}
        >
          ${CaptionIcon}
          <blocksuite-tooltip tip-position="right">Caption</blocksuite-tooltip>
        </icon-button>
        <icon-button size="32px" @click=${() => downloadImage(model)}>
          ${DownloadIcon}
          <blocksuite-tooltip tip-position="right">Download</blocksuite-tooltip>
        </icon-button>
        <icon-button size="32px" @click=${() => copyImage(model)}>
          ${CopyIcon}
          <blocksuite-tooltip tip-position="right"
            >Copy to clipboard</blocksuite-tooltip
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
          <blocksuite-tooltip tip-position="right">Delete</blocksuite-tooltip>
        </icon-button>
        <icon-button
          size="32px"
          ?hidden=${readonly ||
          !model.page.awarenessStore.getFlag('enable_bultin_ledits')}
          @click="${() => {
            abortController.abort();
            openLeditsEditor(model, blob, root);
          }}"
        >
          ${HighLightDuotoneIcon}
          <blocksuite-tooltip tip-position="right"
            >Edit with LEDITS</blocksuite-tooltip
          >
        </icon-button>
      </div>
    </div>
  `;
}
