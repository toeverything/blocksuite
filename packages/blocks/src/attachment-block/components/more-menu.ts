import { html } from 'lit';
import { type Ref, ref } from 'lit/directives/ref.js';

import { DeleteIcon, DownloadIcon, DuplicateIcon } from '../../icons/index.js';
import type { AttachmentBlockModel } from '../attachment-model.js';
import { cloneAttachmentProperties, downloadAttachment } from '../utils.js';
import { moreMenuStyles } from './styles.js';

export const MoreMenu = ({
  ref: moreMenuRef,
  model,
  abortController,
}: {
  ref?: Ref<HTMLDivElement>;
  model: AttachmentBlockModel;
  abortController: AbortController;
}) => {
  const readonly = model.page.readonly;
  return html`<style>
      ${moreMenuStyles}
    </style>
    <div ${ref(moreMenuRef)} class="affine-attachment-options-more">
      <icon-button
        width="126px"
        height="32px"
        text="Download"
        @click="${() => downloadAttachment(model)}"
      >
        ${DownloadIcon}
      </icon-button>
      <icon-button
        width="126px"
        height="32px"
        text="Duplicate"
        ?hidden=${readonly}
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
        width="126px"
        height="32px"
        text="Delete"
        class="danger"
        ?hidden=${readonly}
        @click="${() => {
          model.page.deleteBlock(model);
          abortController.abort();
        }}"
      >
        ${DeleteIcon}
      </icon-button>
    </div>`;
};
