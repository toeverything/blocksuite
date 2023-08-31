import { createDelayHoverSignal } from '@blocksuite/global/utils';
import { html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

import { stopPropagation } from '../../__internal__/utils/event.js';
import { turnImageIntoCardView } from '../../attachment-block/utils.js';
import { tooltipStyle } from '../../components/tooltip/tooltip.js';
import {
  BookmarkIcon,
  CaptionIcon,
  CopyIcon,
  DeleteIcon,
  DownloadIcon,
} from '../../icons/index.js';
import type { ImageBlockModel } from '../image-model.js';
import { createAddonPortal } from './image-addon.js';
import { copyImage, downloadImage, focusCaption } from './utils.js';

export function ImageOptionsTemplate({
  anchor,
  model,
  blob,
  abortController,
}: {
  anchor: HTMLElement;
  model: ImageBlockModel;
  blob: Blob;
  abortController: AbortController;
}) {
  const { onHover, onHoverLeave } = createDelayHoverSignal(abortController);
  anchor.addEventListener('mouseover', onHover);
  anchor.addEventListener('mouseleave', onHoverLeave);
  abortController.signal.addEventListener('abort', () => {
    anchor.removeEventListener('mouseover', onHover);
    anchor.removeEventListener('mouseleave', onHoverLeave);
  });
  const supportAttachment =
    model.page.schema.flavourSchemaMap.has('affine:attachment');
  const readonly = model.page.readonly;
  const addons = model.page.workspace.addons.getAddonByType('image-addon');

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
      class="affine-embed-editing-state-container"
      @pointerdown=${stopPropagation}
      @mouseover=${onHover}
      @mouseout=${onHoverLeave}
    >
      <div class="embed-editing-state">
        ${supportAttachment
          ? html`<icon-button
              class="has-tool-tip"
              size="32px"
              ?disabled=${readonly}
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
          ?disabled=${readonly}
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
          ?disabled=${readonly}
          @click="${() => {
            abortController.abort();
            model.page.deleteBlock(model);
          }}"
        >
          ${DeleteIcon}
          <tool-tip inert tip-position="right" role="tooltip">Delete</tool-tip>
        </icon-button>
        ${repeat(
          addons,
          addon => addon.name,
          addon => html`
            <icon-button
              class="has-tool-tip"
              size="32px"
              ?disabled=${readonly}
              @click="${async () => {
                abortController.abort();

                const blobManager = model.page.blobs;
                const imageBlob = await model.page.blobs.get(model.sourceId);
                if (!imageBlob) return;

                createAddonPortal(addon, imageBlob, blob => {
                  if (blob === imageBlob) return;

                  console.log(blob);

                  blobManager.set(blob).then(sourceId => {
                    console.log(sourceId);

                    model.page.updateBlock(model, {
                      sourceId,
                    });
                  });
                });
              }}"
            >
              ${unsafeHTML(addon.icon)}
              <tool-tip inert tip-position="right" role="tooltip"
                >${addon.title}</tool-tip
              >
            </icon-button>
          `
        )}
      </div>
    </div>
  `;
}
