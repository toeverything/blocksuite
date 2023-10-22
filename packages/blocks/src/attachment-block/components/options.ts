import { assertExists } from '@blocksuite/global/utils';
import { flip, offset } from '@floating-ui/dom';
import { html } from 'lit';
import { createRef, ref, type RefOrCallback } from 'lit/directives/ref.js';

import { stopPropagation } from '../../_legacy/utils/event.js';
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
  ref: refOrCallback = createRef<HTMLDivElement>(),
}: {
  anchor: HTMLElement;
  model: AttachmentBlockModel;
  showCaption: () => void;
  abortController: AbortController;
  ref?: RefOrCallback;
}) {
  let containerEl: Element | undefined;
  const refCallback = (el: Element | undefined) => {
    containerEl = el;

    if (!refCallback) return;
    // See also https://github.com/lit/lit/blob/c134604f178e36444261d83eabe9e578c1ed90c4/packages/lit-html/src/directives/ref.ts
    typeof refOrCallback === 'function'
      ? refOrCallback(el)
      : ((
          refOrCallback as {
            // RefInternal
            value: Element | undefined;
          }
        ).value = el);
  };

  const disableEmbed = !model.type?.startsWith('image/');
  const readonly = model.page.readonly;
  let moreMenuAbortController: AbortController | null = null;
  return html`<style>
      ${styles}
    </style>

    <div
      ${ref(refCallback)}
      class="affine-attachment-options"
      @pointerdown=${stopPropagation}
    >
      <icon-button size="24px" ?hidden=${true}>
        ${ViewIcon}
        <affine-tooltip .offset=${12}>Preview</affine-tooltip>
      </icon-button>
      <div class="divider" ?hidden=${true}></div>

      <icon-button size="24px" ?hidden=${true || readonly}>
        ${LinkIcon}
        <affine-tooltip .offset=${12}>Turn into Link view</affine-tooltip>
      </icon-button>
      <icon-button
        size="24px"
        ?disabled=${readonly || disableEmbed}
        @click="${() => {
          turnIntoEmbedView(model);
          abortController.abort();
        }}"
      >
        ${EmbedWebIcon}
        <affine-tooltip .offset=${12}>Turn into Embed view</affine-tooltip>
      </icon-button>
      <div class="divider"></div>

      <icon-button
        size="24px"
        ?hidden=${readonly}
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
        <affine-tooltip .offset=${12}>Rename</affine-tooltip>
      </icon-button>
      <icon-button
        size="24px"
        ?hidden=${readonly}
        @click=${() => {
          showCaption();
        }}
      >
        ${CaptionIcon}
        <affine-tooltip .offset=${12}>Caption</affine-tooltip>
      </icon-button>
      <div class="divider" ?hidden=${readonly}></div>
      <icon-button
        size="24px"
        class="more-button"
        @click=${() => {
          if (moreMenuAbortController) {
            moreMenuAbortController.abort();
            moreMenuAbortController = null;
            return;
          }
          moreMenuAbortController = new AbortController();

          assertExists(containerEl);
          createLitPortal({
            container: containerEl,
            template: MoreMenu({ model, abortController }),
            abortController: moreMenuAbortController,
            computePosition: {
              referenceElement: containerEl,
              placement: 'top-end',
              middleware: [flip(), offset(4)],
            },
          });
        }}
      >
        ${MoreIcon}
        <affine-tooltip .offset=${12}>More</affine-tooltip>
      </icon-button>
    </div>`;
}
