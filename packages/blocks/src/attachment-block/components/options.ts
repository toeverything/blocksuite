import {
  CaptionIcon,
  ConfirmIcon,
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
import { html } from 'lit';
import { createRef, type Ref, ref } from 'lit/directives/ref.js';

import { stopPropagation } from '../../__internal__/utils/event.js';
import { getViewportElement } from '../../__internal__/utils/query.js';
import type { ImageProps } from '../../image-block/image-model.js';
import type { AttachmentBlockModel } from '../attachment-model.js';
import { cloneAttachmentProperties, downloadAttachment } from '../utils.js';
import { styles } from './styles.js';

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
  const renameRef = createRef<HTMLDivElement>();

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
        @click="${() => {
          containerRef.value?.toggleAttribute('hidden');
          renameRef.value?.toggleAttribute('hidden');
        }}"
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
      ${RenameModal({ model, abortController, ref: renameRef })}
    </div>`;
}

const RenameModal = ({
  ref: renamePopoverRef,
  model,
  abortController,
}: {
  ref: Ref<HTMLDivElement>;
  model: AttachmentBlockModel;
  abortController: AbortController;
}) => {
  let name = model.name;
  // TODO suffix

  const onConfirm = () => {
    model.page.updateBlock(model, {
      name,
    });
    abortController.abort();
  };
  const onInput = (e: InputEvent) => {
    name = (e.target as HTMLInputElement).value;
  };
  const onKeydown = (e: KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter' && !e.isComposing) {
      e.preventDefault();
      onConfirm();
    }
    return;
  };

  return html`<div
    ${ref(renamePopoverRef)}
    class="attachment-rename-container"
    hidden
  >
    <div class="attachment-rename-input-wrapper">
      <input
        .value=${name}
        type="text"
        @input=${onInput}
        @keydown=${onKeydown}
      />
    </div>
    <icon-button class="affine-confirm-button" @click=${onConfirm}
      >${ConfirmIcon}</icon-button
    >
  </div>`;
};

const MoreMenu = ({
  ref: moreMenuRef,
  model,
  abortController,
}: {
  ref: Ref<HTMLDivElement>;
  model: AttachmentBlockModel;
  abortController: AbortController;
}) => {
  return html`<div ${ref(moreMenuRef)} class="attachment-options-more" hidden>
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
