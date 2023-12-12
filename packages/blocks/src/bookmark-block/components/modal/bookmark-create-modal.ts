import type { EditorHost } from '@blocksuite/lit';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import { toast } from '../../../_common/components/toast.js';
import { CloseIcon } from '../../../_common/icons/index.js';
import { bookmarkModalStyles } from './styles.js';

@customElement('bookmark-create-modal')
export class BookmarkCreateModal extends WithDisposable(ShadowlessElement) {
  static override styles = bookmarkModalStyles;

  @property({ attribute: false })
  onCancel?: () => void;

  @property({ attribute: false })
  onConfirm?: (url: string) => void;

  @query('input')
  input!: HTMLInputElement;

  override connectedCallback() {
    super.connectedCallback();

    this.updateComplete.then(() => {
      requestAnimationFrame(() => {
        this.input.focus();
      });
    });
    this.disposables.addFromEvent(this, 'keydown', this._onDocumentKeydown);
  }

  private _onDocumentKeydown = (e: KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter' && !e.isComposing) {
      this._onConfirm();
    }
    if (e.key === 'Escape') {
      this.remove();
    }
  };

  private _onConfirm = () => {
    const url = this.input.value;

    if (url.length === 0) {
      toast('Bookmark url can not be empty');
      return;
    }

    this.onConfirm?.(url);
    this.remove();
  };

  private _onCancel = () => {
    this.onCancel?.();
    this.remove();
  };

  override render() {
    return html`<div class="bookmark-modal">
      <div class="bookmark-modal-mask" @click=${this._onCancel}></div>
      <div class="bookmark-modal-wrapper" style="width:480px">
        <icon-button
          width="32px"
          height="32px"
          class="bookmark-modal-close-button"
          @click=${this._onCancel}
          >${CloseIcon}</icon-button
        >

        <div class="bookmark-modal-title">Bookmark</div>
        <div class="bookmark-modal-desc">
          Create a Bookmark that previews a link in card view.
        </div>
        <input
          tabindex="1"
          type="text"
          class="bookmark-modal-input link"
          placeholder="Input in https://..."
        />

        <div class="bookmark-modal-footer">
          <div
            tabindex="2"
            class="bookmark-modal-confirm-button"
            @click=${this._onConfirm}
          >
            Confirm
          </div>
        </div>
      </div>
    </div>`;
  }
}

export async function toggleBookmarkCreateModal(
  root: EditorHost
): Promise<null | string> {
  root.selection.clear();
  const bookmarkCreateModal = new BookmarkCreateModal();
  return new Promise(resolve => {
    bookmarkCreateModal.onConfirm = url => {
      resolve(url);
    };
    bookmarkCreateModal.onCancel = () => {
      resolve(null);
    };
    document.body.appendChild(bookmarkCreateModal);
  });
}

declare global {
  interface HTMLElementTagNameMap {
    'bookmark-create-modal': BookmarkCreateModal;
  }
}
