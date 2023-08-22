import { assertExists } from '@blocksuite/global/utils';
import { flip, offset } from '@floating-ui/dom';
import { html } from 'lit';
import { createRef, ref } from 'lit/directives/ref.js';

import { stopPropagation } from '../../__internal__/utils/event.js';
import { createLitPortal } from '../../components/portal.js';
import {
  CaptionIcon,
  EditIcon,
  EmbedWebIcon,
  LinkIcon,
  MoreIcon,
  ViewIcon,
} from '../../icons/index.js';
import type { AttachmentBlockModel } from '../attachment-model.js';
import { turnIntoEmbedView } from '../utils.js';
import { MoreMenu } from './more-menu.js';
import { RenameModal } from './rename-model.js';
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
  const disableEmbed = !model.type?.startsWith('image/');
  const readonly = model.page.readonly;
  let moreMenuAbortController: AbortController | null = null;
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
      <icon-button class="has-tool-tip" size="24px" disabled ?hidden=${true}>
        ${ViewIcon}
        <tool-tip inert tip-position="top" role="tooltip">Preview</tool-tip>
      </icon-button>
      <div class="divider" ?hidden=${true}></div>

      <icon-button
        class="has-tool-tip"
        size="24px"
        ?disabled=${readonly}
        ?hidden=${true}
      >
        ${LinkIcon}
        <tool-tip inert tip-position="top" role="tooltip"
          >Turn into Link view</tool-tip
        >
      </icon-button>
      <icon-button
        class="has-tool-tip"
        size="24px"
        ?disabled=${readonly}
        ?hidden=${disableEmbed}
        @click="${() => {
          turnIntoEmbedView(model);
          abortController.abort();
        }}"
      >
        ${EmbedWebIcon}
        <tool-tip inert tip-position="top" role="tooltip"
          >Turn into Embed view</tool-tip
        >
      </icon-button>
      <div class="divider" ?hidden=${disableEmbed}></div>

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
            }),
            computePosition: {
              referenceElement: anchor,
              placement: 'top-end',
              middleware: [flip(), offset(4)],
              // It has a overlay mask, so we don't need to update the position.
              // autoUpdate: true,
            },
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
          if (moreMenuAbortController) {
            moreMenuAbortController.abort();
            moreMenuAbortController = null;
            return;
          }
          moreMenuAbortController = new AbortController();
          const container = containerRef.value;
          assertExists(container);
          createLitPortal({
            container,
            template: MoreMenu({ model, abortController }),
            abortController: moreMenuAbortController,
            computePosition: {
              referenceElement: container,
              placement: 'top-end',
              middleware: [flip(), offset(4)],
              autoUpdate: true,
            },
          });
        }}
      >
        ${MoreIcon}
        <tool-tip inert role="tooltip">More</tool-tip>
      </icon-button>
    </div>`;
}
