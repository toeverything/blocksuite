import { WithDisposable } from '@blocksuite/lit';
import { html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import { CloseIcon } from '../../../_common/icons/index.js';
import type { BookmarkBlockModel } from '../../bookmark-model.js';
import { bookmarkModalStyles } from './styles.js';

@customElement('bookmark-edit-modal')
export class BookmarkEditModal extends WithDisposable(LitElement) {
  static override styles = bookmarkModalStyles;

  @property({ attribute: false })
  model!: BookmarkBlockModel;

  @query('input.title')
  titleInput!: HTMLInputElement;
  @query('input.description')
  descInput!: HTMLInputElement;

  override connectedCallback() {
    super.connectedCallback();

    this.updateComplete.then(() => {
      this.titleInput.focus();
      this.titleInput.setSelectionRange(0, this.titleInput.value.length);
    });

    this.disposables.addFromEvent(document, 'keydown', this._onDocumentKeydown);
  }

  private _onDocumentKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.isComposing) {
      this._onConfirm();
    }
    if (e.key === 'Escape') {
      this.remove();
    }
  };

  private _onConfirm = () => {
    this.model.page.updateBlock(this.model, {
      title: this.titleInput.value,
      description: this.descInput.value,
    });
    this.remove();
  };

  override render() {
    const title = this.model.title ?? this.model.bookmarkTitle ?? 'Bookmark';

    return html`<div class="bookmark-modal">
      <div class="bookmark-modal-mask" @click=${() => this.remove()}></div>
      <div class="bookmark-modal-wrapper">
        <icon-button
          width="32px"
          height="32px"
          class="bookmark-modal-close-button"
          @click=${() => this.remove()}
          >${CloseIcon}</icon-button
        >

        <div class="bookmark-modal-title">Edit</div>
        <div class="bookmark-input-wrapper">
          <label>Title</label>
          <input
            type="text"
            class="bookmark-input title"
            placeholder="Title"
            value=${title}
            tabindex="0"
          />
        </div>
        <div class="bookmark-input-wrapper">
          <label>URL</label>
          <input
            type="text"
            class="bookmark-input description"
            placeholder="Description"
            value=${this.model.description ?? this.model.url}
            tabindex="0"
          />
        </div>
        <div class="bookmark-modal-footer">
          <div
            class="bookmark-confirm-button"
            tabindex="0"
            @click=${this._onConfirm}
          >
            Save
          </div>
        </div>
      </div>
    </div>`;
  }
}

export function toggleBookmarkEditModal(model: BookmarkBlockModel) {
  const modal = new BookmarkEditModal();
  modal.model = model;
  document.body.appendChild(modal);
}

declare global {
  interface HTMLElementTagNameMap {
    'bookmark-edit-modal': BookmarkEditModal;
  }
}
