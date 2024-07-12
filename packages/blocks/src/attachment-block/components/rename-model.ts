import type { EditorHost } from '@blocksuite/block-std';

import { html } from 'lit';
import { createRef, ref } from 'lit/directives/ref.js';

import type { AttachmentBlockModel } from '../attachment-model.js';

import { toast } from '../../_common/components/toast.js';
import '../../_common/components/toolbar/icon-button.js';
import { ConfirmIcon } from '../../_common/icons/index.js';
import { renameStyles } from './styles.js';

export const RenameModal = ({
  abortController,
  editorHost,
  model,
}: {
  abortController: AbortController;
  editorHost: EditorHost;
  model: AttachmentBlockModel;
}) => {
  const inputRef = createRef<HTMLInputElement>();
  // Fix auto focus
  setTimeout(() => inputRef.value?.focus());
  const originalName = model.name;
  const nameWithoutExtension = originalName.slice(
    0,
    originalName.lastIndexOf('.')
  );
  const originalExtension = originalName.slice(originalName.lastIndexOf('.'));
  const includeExtension =
    originalExtension.includes('.') &&
    originalExtension.length <= 7 &&
    // including the dot
    originalName.length > originalExtension.length;

  let fileName = includeExtension ? nameWithoutExtension : originalName;
  const extension = includeExtension ? originalExtension : '';

  const onConfirm = () => {
    const newFileName = fileName + extension;
    if (!newFileName) {
      toast(editorHost, 'File name cannot be empty');
      return;
    }
    model.doc.updateBlock(model, {
      name: newFileName,
    });
    abortController.abort();
  };
  const onInput = (e: InputEvent) => {
    fileName = (e.target as HTMLInputElement).value;
  };
  const onKeydown = (e: KeyboardEvent) => {
    e.stopPropagation();

    if (e.key === 'Escape' && !e.isComposing) {
      abortController.abort();
      return;
    }
    if (e.key === 'Enter' && !e.isComposing) {
      onConfirm();
      return;
    }
  };

  return html`
    <style>
      ${renameStyles}
    </style>
    <div
      class="affine-attachment-rename-overlay-mask"
      @click="${() => abortController.abort()}"
    ></div>
    <div class="affine-attachment-rename-container">
      <div class="affine-attachment-rename-input-wrapper">
        <input
          ${ref(inputRef)}
          type="text"
          .value=${fileName}
          @input=${onInput}
          @keydown=${onKeydown}
        />
        <span class="affine-attachment-rename-extension">${extension}</span>
      </div>
      <editor-icon-button
        class="affine-confirm-button"
        .iconSize=${'24px'}
        @click=${onConfirm}
      >
        ${ConfirmIcon}
      </editor-icon-button>
    </div>
  `;
};
