import type { EditorHost } from '@blocksuite/lit';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { toast } from '../../../_common/components/toast.js';
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

  @state()
  private _linkInputValue = '';

  override connectedCallback() {
    super.connectedCallback();

    this.updateComplete
      .then(() => {
        requestAnimationFrame(() => {
          this.input.focus();
        });
      })
      .catch(console.error);
    this.disposables.addFromEvent(this, 'keydown', this._onDocumentKeydown);
  }

  private _handleInput(e: InputEvent) {
    const target = e.target as HTMLInputElement;
    this._linkInputValue = target.value;
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
    return html`<div class="bookmark-modal blocksuite-overlay">
      <div class="bookmark-modal-mask" @click=${this._onCancel}></div>
      <div class="bookmark-modal-wrapper">
        <div class="bookmark-modal-title">Bookmark</div>

        <div class="bookmark-modal-content">
          <div class="bookmark-modal-content-text">
            Create a Bookmark that previews a link in card view.
          </div>

          <input
            class="bookmark-modal-input link"
            tabindex="0"
            type="text"
            placeholder="Input in https://..."
            value=${this._linkInputValue}
            @input=${this._handleInput}
          />
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
              confirm: true,
              disabled: this._linkInputValue.length === 0,
            })}
            tabindex="0"
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
  host: EditorHost
): Promise<null | string> {
  host.selection.clear();
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
