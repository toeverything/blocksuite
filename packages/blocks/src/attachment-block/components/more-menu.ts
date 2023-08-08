import {
  DeleteIcon,
  DownloadIcon,
  DuplicateIcon,
} from '@blocksuite/global/config';
import { html } from 'lit';
import { type Ref, ref } from 'lit/directives/ref.js';

import type { AttachmentBlockModel } from '../attachment-model.js';
import { cloneAttachmentProperties, downloadAttachment } from '../utils.js';

export const MoreMenu = ({
  ref: moreMenuRef,
  model,
  abortController,
}: {
  ref: Ref<HTMLDivElement>;
  model: AttachmentBlockModel;
  abortController: AbortController;
}) => {
  const readonly = model.page.readonly;
  return html`<div
    ${ref(moreMenuRef)}
    class="affine-attachment-options-more"
    hidden
  >
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
      ?disabled=${readonly}
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
      ?disabled=${readonly}
      @click="${() => {
        model.page.deleteBlock(model);
        abortController.abort();
      }}"
    >
      ${DeleteIcon}
    </icon-button>
  </div>`;
};
