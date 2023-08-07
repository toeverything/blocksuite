import { ConfirmIcon } from '@blocksuite/global/config';
import { html } from 'lit';
import { createRef, ref } from 'lit/directives/ref.js';

import { toast } from '../../components/toast.js';
import type { AttachmentBlockModel } from '../attachment-model.js';
import { renameStyles } from './styles.js';

export const RenameModal = ({
  anchor,
  model,
  abortController,
}: {
  anchor: HTMLElement;
  model: AttachmentBlockModel;
  abortController: AbortController;
}) => {
  const containerRef = createRef<HTMLDivElement>();
  const updatePosition = () => {
    const container = containerRef.value;
    if (!container) return;
    const { top, left, width } = anchor.getBoundingClientRect();
    container.style.transform = `translate(calc(${
      left + width
    }px - 100%), calc(${top}px - 100% - 4px))`;
  };
  setTimeout(() => {
    // Wait for the portal to be attached to the DOM
    updatePosition();
  });

  const originalName = model.name;
  const nameWithoutExtension = originalName.slice(
    0,
    originalName.lastIndexOf('.')
  );
  const originalExtension = originalName.slice(originalName.lastIndexOf('.'));
  const fixedExtension =
    originalExtension.length <= 7 && // including the dot
    originalName.length > originalExtension.length;

  let fileName = fixedExtension ? nameWithoutExtension : originalName;
  const extension = fixedExtension ? originalExtension : '';

  const onConfirm = () => {
    const newFileName = fileName + extension;
    if (!newFileName) {
      toast('File name cannot be empty');
      return;
    }
    model.page.updateBlock(model, {
      name: newFileName,
    });
    abortController.abort();
  };
  const onInput = (e: InputEvent) => {
    fileName = (e.target as HTMLInputElement).value;
  };
  const onKeydown = (e: KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter' && !e.isComposing) {
      e.preventDefault();
      onConfirm();
    }
    return;
  };

  return html`
    <style>
      ${renameStyles}
    </style>
    <div ${ref(containerRef)} class="attachment-rename-container">
      <div class="attachment-rename-input-wrapper">
        <input
          type="text"
          .value=${fileName}
          @input=${onInput}
          @keydown=${onKeydown}
        />
        <span class="attachment-rename-extension">${extension}</span>
      </div>
      <icon-button class="affine-confirm-button" @click=${onConfirm}
        >${ConfirmIcon}</icon-button
      >
    </div>
  `;
};
