import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { toast } from '../../../_common/components/toast.js';
import type { BookmarkBlockComponent } from '../../bookmark-block.js';
import type { BookmarkBlockModel } from '../../bookmark-model.js';
import { bookmarkModalStyles } from './styles.js';

@customElement('bookmark-edit-modal')
export class BookmarkEditModal extends WithDisposable(ShadowlessElement) {
  static override styles = bookmarkModalStyles;

  @property({ attribute: false })
  bookmark!: BookmarkBlockComponent;

  @query('.title')
  titleInput!: HTMLInputElement;

  @query('.description')
  descInput!: HTMLInputElement;

  @state()
  private _titleInputValue = '';

  get bookmarkModel(): BookmarkBlockModel {
    return this.bookmark.model;
  }

  override connectedCallback() {
    super.connectedCallback();

    this.updateComplete
      .then(() => {
        this.titleInput.focus();
        this.titleInput.setSelectionRange(0, this.titleInput.value.length);
      })
      .catch(console.error);

    this.disposables.addFromEvent(this, 'keydown', this._onDocumentKeydown);

    this._titleInputValue = this.bookmarkModel.title ?? '';
  }

  private _handleInput(e: InputEvent) {
    const target = e.target as HTMLInputElement;
    this._titleInputValue = target.value;
  }

  private _onDocumentKeydown(e: KeyboardEvent) {
    e.stopPropagation();
    if (e.key === 'Enter' && !e.isComposing) {
      this._onSave();
    }
    if (e.key === 'Escape') {
      this.remove();
    }
  }

  private _onSave() {
    const title = this.titleInput.value;
    if (title.length === 0) {
      toast('Link title can not be empty');
      return;
    }

    this.bookmark.page.updateBlock(this.bookmarkModel, {
      title,
      description: this.descInput.value,
    });
    this.remove();
  }

  override render() {
    return html`
      <div class="bookmark-modal blocksuite-overlay">
        <div class="bookmark-modal-mask" @click=${() => this.remove()}></div>
        <div class="bookmark-modal-wrapper">
          <div class="bookmark-modal-title">Edit Link</div>

          <div class="bookmark-modal-content">
            <input
              class="bookmark-modal-input title"
              type="text"
              placeholder="Title"
              value=${this._titleInputValue}
              @input=${this._handleInput}
              tabindex="0"
            />

            <textarea
              class="bookmark-modal-input description"
              placeholder="Description"
              .value=${this.bookmarkModel.description ?? ''}
              tabindex="0"
            ></textarea>
          </div>

          <div class="bookmark-modal-action">
            <div
              class="bookmark-modal-button cancel"
              tabindex="0"
              @click=${() => this.remove()}
            >
              Cancel
            </div>

            <div
              class=${classMap({
                'bookmark-modal-button': true,
                save: true,
                disabled: this._titleInputValue.length === 0,
              })}
              tabindex="0"
              @click=${() => this._onSave()}
            >
              Save
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

export function toggleBookmarkEditModal(bookmark: BookmarkBlockComponent) {
  bookmark.host.selection.clear();
  const bookmarkEditModal = new BookmarkEditModal();
  bookmarkEditModal.bookmark = bookmark;
  document.body.appendChild(bookmarkEditModal);
}

declare global {
  interface HTMLElementTagNameMap {
    'bookmark-edit-modal': BookmarkEditModal;
  }
}
