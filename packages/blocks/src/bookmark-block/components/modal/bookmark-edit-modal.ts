import { WithDisposable } from '@blocksuite/lit';
import { html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { CloseIcon } from '../../../_common/icons/index.js';
import type { BookmarkBlockComponent } from '../../bookmark-block.js';
import type { BookmarkBlockModel } from '../../bookmark-model.js';
import { bookmarkModalStyles } from './styles.js';

@customElement('bookmark-edit-modal')
export class BookmarkEditModal extends WithDisposable(LitElement) {
  static override styles = bookmarkModalStyles;

  @property({ attribute: false })
  bookmark!: BookmarkBlockComponent;
  get bookmarkModel(): BookmarkBlockModel {
    return this.bookmark.model;
  }

  @query('.title')
  titleInput!: HTMLInputElement;
  @query('.description')
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
    this.bookmark.page.updateBlock(this.bookmarkModel, {
      title: this.titleInput.value,
      description: this.descInput.value,
    });
    this.remove();
  };

  override render() {
    const title =
      this.bookmarkModel.title ??
      this.bookmarkModel.bookmarkTitle ??
      'Bookmark';

    return html`<div class="bookmark-modal">
      <div class="bookmark-modal-mask" @click=${() => this.remove()}></div>
      <div
        class="bookmark-modal-wrapper"
        style=${styleMap({
          height: '320px',
        })}
      >
        <icon-button
          width="32px"
          height="32px"
          class="bookmark-modal-close-button"
          @click=${() => this.remove()}
          >${CloseIcon}</icon-button
        >

        <div class="bookmark-modal-title">Edit</div>
        <div class="bookmark-modal-input-wrapper">
          <input
            type="text"
            class="bookmark-modal-input title"
            placeholder="Title"
            value=${title}
            tabindex="0"
          />
        </div>
        <div class="bookmark-modal-input-wrapper">
          <textarea
            type="text"
            class="bookmark-modal-input description"
            placeholder="Description"
            .value=${this.bookmarkModel.description ?? ''}
            tabindex="0"
            style=${styleMap({
              height: '104px',
            })}
          ></textarea>
        </div>
        <div class="bookmark-modal-footer">
          <div
            class="bookmark-modal-confirm-button"
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

export function toggleBookmarkEditModal(bookmark: BookmarkBlockComponent) {
  bookmark.root.selection.clear();
  const modal = new BookmarkEditModal();
  modal.bookmark = bookmark;
  document.body.appendChild(modal);
}

declare global {
  interface HTMLElementTagNameMap {
    'bookmark-edit-modal': BookmarkEditModal;
  }
}
