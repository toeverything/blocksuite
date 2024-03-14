import '../../../_common/components/button.js';
import '../../../_common/components/tooltip/tooltip.js';

import { html, nothing } from 'lit';
import { ref, type RefOrCallback } from 'lit/directives/ref.js';

import {
  BookmarkIcon,
  CaptionIcon,
  CopyIcon,
  DeleteIcon,
  DownloadIcon,
} from '../../../_common/icons/index.js';
import { stopPropagation } from '../../../_common/utils/event.js';
import type { ImageBlockComponent } from '../../../image-block/image-block.js';

export function ImageOptionsTemplate({
  blockElement,
  abortController,
  ref: containerRef,
}: {
  blockElement: ImageBlockComponent;
  abortController: AbortController;
  ref?: RefOrCallback;
}) {
  const doc = blockElement.doc;
  const supportAttachment =
    doc.schema.flavourSchemaMap.has('affine:attachment');
  const readonly = doc.readonly;

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
              ?hidden=${readonly || !blockElement.blob}
              @click=${() => {
                abortController.abort();
                blockElement.convertToCardView();
              }}
            >
              ${BookmarkIcon}

              <affine-tooltip>Turn into Card view</affine-tooltip>
            </icon-button>`
          : nothing}

        <icon-button
          size="32px"
          ?hidden=${readonly}
          @click=${() => {
            abortController.abort();
            blockElement.captionElement.show();
          }}
        >
          ${CaptionIcon}

          <affine-tooltip tip-position="right">Caption</affine-tooltip>
        </icon-button>

        <icon-button
          size="32px"
          @click=${() => {
            abortController.abort();
            blockElement.download();
          }}
        >
          ${DownloadIcon}

          <affine-tooltip tip-position="right">Download</affine-tooltip>
        </icon-button>

        <icon-button
          size="32px"
          @click=${() => {
            abortController.abort();
            blockElement.copy();
          }}
        >
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
            doc.deleteBlock(blockElement.model);
          }}"
        >
          ${DeleteIcon}

          <affine-tooltip tip-position="right">Delete</affine-tooltip>
        </icon-button>
      </div>
    </div>
  `;
}
