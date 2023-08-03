import {
  CaptionIcon,
  DeleteIcon,
  DownloadIcon,
  DuplicateIcon,
  EditIcon,
  EmbedWebIcon,
  LinkIcon,
  MoreIcon,
  ViewIcon,
} from '@blocksuite/global/config';
import { assertExists } from '@blocksuite/store';
import { css, html } from 'lit';
import { createRef, type Ref, ref } from 'lit/directives/ref.js';

import { stopPropagation } from '../../__internal__/utils/event.js';
import { getViewportElement } from '../../__internal__/utils/query.js';
import { tooltipStyle } from '../../components/tooltip/tooltip.js';
import type { ImageProps } from '../../image-block/image-model.js';
import type { AttachmentBlockModel } from '../attachment-model.js';
import { cloneAttachmentProperties, downloadAttachment } from '../utils.js';

const styles = css`
  .affine-attachment-options {
    position: fixed;
    left: 0;
    top: 0;

    display: flex;
    align-items: center;
    padding: 8px;
    gap: 8px;
    border-radius: 8px;
    background: var(--affine-background-overlay-panel-color);
    box-shadow: var(--affine-shadow-2);
  }

  .affine-attachment-options .divider {
    width: 1px;
    height: 24px;
    background-color: var(--affine-border-color);
  }

  ${tooltipStyle}
`;

export function AttachmentOptionsTemplate({
  anchor,
  model,
  abortController,
}: {
  anchor: HTMLElement;
  model: AttachmentBlockModel;
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
  anchor.addEventListener('mouseleave', onHoverLeave);
  abortController.signal.addEventListener('abort', () => {
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

  return html`<style>
      ${styles}
    </style>

    <div
      ${ref(containerRef)}
      class="affine-attachment-options"
      @pointerdown=${stopPropagation}
      @mouseover=${onHover}
      @mouseout=${onHoverLeave}
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
        disabled
        @click=${() => console.log(model)}
      >
        ${LinkIcon}
        <tool-tip inert tip-position="top" role="tooltip"
          >Convert to inline(Coming soon)</tool-tip
        >
      </icon-button>
      <icon-button
        class="has-tool-tip"
        size="24px"
        ?disabled=${!model.type?.startsWith('image/')}
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
        <tool-tip inert tip-position="top" role="tooltip">Embed</tool-tip>
      </icon-button>
      <div class="divider"></div>

      <icon-button
        class="has-tool-tip"
        size="24px"
        @click="${() => console.log('TODO rename', model)}"
      >
        ${EditIcon}
        <tool-tip inert tip-position="top" role="tooltip">Rename</tool-tip>
      </icon-button>
      <icon-button
        class="has-tool-tip"
        size="24px"
        @click=${() => console.log('TODO caption', model)}
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

const MoreMenu = ({
  ref: moreMenuRef,
  model,
  abortController,
}: {
  ref: Ref<HTMLDivElement>;
  model: AttachmentBlockModel;
  abortController: AbortController;
}) => {
  const styles = css`
    .attachment-options-more {
      position: absolute;
      right: 0;
      top: 0;
      transform: translateY(calc(-100% - 4px));

      display: flex;
      flex-direction: column;
      align-items: center;
      color: var(--affine-text-primary-color);

      border-radius: 8px;
      padding: 8px;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
    }

    .attachment-options-more[hidden] {
      display: none;
    }

    .attachment-options-more icon-button {
      display: flex;
      align-items: center;
      padding: 8px;
      gap: 8px;
    }

    .attachment-options-more icon-button:hover.danger {
      background: var(--affine-background-error-color);
      fill: var(--affine-error-color);
      color: var(--affine-error-color);
    }
  `;
  return html`<style>
      ${styles}
    </style>
    <div ${ref(moreMenuRef)} class="attachment-options-more" hidden>
      <icon-button
        width="120px"
        height="32px"
        text="Download"
        @click="${() => downloadAttachment(model)}"
      >
        ${DownloadIcon}
      </icon-button>
      <icon-button
        width="120px"
        height="32px"
        text="Duplicate"
        @click="${() => {
          const prop = {
            flavour: 'affine:attachment',
            ...cloneAttachmentProperties(model),
          };
          model.page.addSiblingBlocks(model, [prop]);
        }}"
      >
        ${DuplicateIcon}
      </icon-button>
      <icon-button
        width="120px"
        height="32px"
        text="Delete"
        class="danger"
        @click="${() => {
          model.page.deleteBlock(model);
          abortController.abort();
        }}"
      >
        ${DeleteIcon}
      </icon-button>
    </div>`;
};
