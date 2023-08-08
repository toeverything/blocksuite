import {
  CaptionIcon,
  EditIcon,
  EmbedWebIcon,
  LinkIcon,
  MoreIcon,
  ViewIcon,
} from '@blocksuite/global/config';
import { createLitPortal } from '@blocksuite/lit';
import { assertExists } from '@blocksuite/store';
import { html } from 'lit';
import { createRef, ref } from 'lit/directives/ref.js';

import { stopPropagation } from '../../__internal__/utils/event.js';
import { getViewportElement } from '../../__internal__/utils/query.js';
import type { ImageProps } from '../../image-block/image-model.js';
import type { AttachmentBlockModel } from '../attachment-model.js';
import { MoreMenu } from './moreMenu.js';
import { RenameModal } from './renameModel.js';
import { styles } from './styles.js';

export function AttachmentOptionsTemplate({
  anchor,
  model,
  showCaption,
  abortController,
}: {
  anchor: HTMLElement;
  model: AttachmentBlockModel;
  showCaption: () => void;
  abortController: AbortController;
}) {
  let hoverTimeout = 0;
  const onHover = () => clearTimeout(hoverTimeout);
  const onHoverLeave = () => {
    const HOVER_TIMEOUT = 300;
    clearTimeout(hoverTimeout);
    hoverTimeout = window.setTimeout(() => {
      abortController.abort();
    }, HOVER_TIMEOUT);
  };
  anchor.addEventListener('mouseover', onHover);
  anchor.addEventListener('mouseleave', onHoverLeave);
  abortController.signal.addEventListener('abort', () => {
    anchor.removeEventListener('mouseover', onHover);
    anchor.removeEventListener('mouseleave', onHoverLeave);
  });

  const containerRef = createRef<HTMLDivElement>();
  const updatePosition = () => {
    const container = containerRef.value;
    if (!container) return;
    const { top, left, width } = anchor.getBoundingClientRect();
    container.style.transform = `translate(calc(${
      left + width
    }px - 100%), calc(${top}px - 100% - 4px))`;
  };

  const viewportElement = getViewportElement(model.page);
  if (viewportElement) {
    viewportElement.addEventListener('scroll', updatePosition);
  }

  setTimeout(() => {
    // Wait for the portal to be attached to the DOM
    updatePosition();
  });

  const moreMenuRef = createRef<HTMLDivElement>();
  const disableEmbed = !model.type?.startsWith('image/');
  const readonly = model.page.readonly;
  return html`<style>
      ${styles}
    </style>

    <div
      ${ref(containerRef)}
      class="affine-attachment-options"
      @pointerdown=${stopPropagation}
      @mouseover=${onHover}
      @mouseleave=${onHoverLeave}
    >
      <icon-button
        class="has-tool-tip"
        size="24px"
        disabled
        @click=${() => console.log('Coming soon...', model)}
      >
        ${ViewIcon}
        <tool-tip inert tip-position="top" role="tooltip"
          >Preview(Coming soon)</tool-tip
        >
      </icon-button>
      <div class="divider"></div>

      <icon-button
        class="has-tool-tip"
        size="24px"
        ?disabled=${readonly || true}
        @click=${() => console.log('Turn into Link view coming soon', model)}
      >
        ${LinkIcon}
        <tool-tip inert tip-position="top" role="tooltip"
          >Turn into Link view(Coming soon)</tool-tip
        >
      </icon-button>
      <icon-button
        class="has-tool-tip"
        size="24px"
        ?disabled=${readonly || disableEmbed}
        @click="${() => {
          const sourceId = model.sourceId;
          assertExists(sourceId);
          const imageProp: ImageProps & { flavour: 'affine:image' } = {
            flavour: 'affine:image',
            sourceId,
          };
          model.page.addSiblingBlocks(model, [imageProp]);
          model.page.deleteBlock(model);
          abortController.abort();
        }}"
      >
        ${EmbedWebIcon}
        <tool-tip inert tip-position="top" role="tooltip"
          >Turn into Embed view${disableEmbed ? '(Images only)' : ''}</tool-tip
        >
      </icon-button>
      <div class="divider"></div>

      <icon-button
        class="has-tool-tip"
        size="24px"
        ?disabled=${readonly}
        @click="${() => {
          abortController.abort();
          const renameAbortController = new AbortController();
          createLitPortal({
            template: RenameModal({
              model,
              abortController: renameAbortController,
              anchor,
            }),
            abortController: renameAbortController,
          });
        }}"
      >
        ${EditIcon}
        <tool-tip inert tip-position="top" role="tooltip">Rename</tool-tip>
      </icon-button>
      <icon-button
        class="has-tool-tip"
        size="24px"
        ?disabled=${readonly}
        @click=${() => {
          showCaption();
        }}
      >
        ${CaptionIcon}
        <tool-tip inert tip-position="top" role="tooltip">Caption</tool-tip>
      </icon-button>
      <div class="divider"></div>
      <icon-button
        size="24px"
        class="has-tool-tip more-button"
        @click=${() => {
          moreMenuRef.value?.toggleAttribute('hidden');
        }}
      >
        ${MoreIcon}
        <tool-tip inert role="tooltip">More</tool-tip>
      </icon-button>
      ${MoreMenu({ model, abortController, ref: moreMenuRef })}
    </div>`;
}
