import '../../components/button.js';
import '../../components/portal.js';
import '../../components/button.js';

import { WithDisposable } from '@blocksuite/lit';
import { type BaseBlockModel } from '@blocksuite/store';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { toast } from '../..//components/toast.js';
import type { BookmarkBlockModel } from '../bookmark-model.js';
import { CloseIcon } from '../images/icons.js';
import { bookmarkModalStyles } from './bookmark-edit-modal.js';

@customElement('bookmark-create-modal')
export class BookmarkCreateModal extends WithDisposable(LitElement) {
  @property()
  model!: BaseBlockModel<BookmarkBlockModel>;

  @property()
  onCancel?: () => void;

  @property()
  onConfirm?: () => void;

  override get id() {
    return `bookmark-create-modal-${this.model.id.split(':')[0]}`;
  }

  override connectedCallback() {
    super.connectedCallback();

    requestAnimationFrame(() => {
      const linkInput = document.querySelector(
        `#${this.id} input.link`
      ) as HTMLInputElement;
      linkInput.focus();
    });

    document.addEventListener('keydown', this._modalKeyboardListener);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._modalKeyboardListener);
  }

  private _modalKeyboardListener = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      this._onConfirm();
    }
    if (e.key === 'Escape') {
      this.onCancel?.();
    }
  };

  private _onConfirm() {
    const linkInput = document.querySelector(
      `#${this.id} input.link`
    ) as HTMLInputElement;

    if (!linkInput.value) {
      toast('Bookmark url can not be empty');
      return;
    }

    this.model.page.updateBlock(this.model, {
      url: linkInput.value,
    });
    this.onConfirm?.();
  }

  override render() {
    const modal = html`${bookmarkModalStyles}
      <div class="bookmark-modal" id="${this.id}">
        <div
          class="bookmark-modal-mask"
          @click=${() => {
            this.onCancel?.();
            this.model.page.deleteBlock(this.model);
          }}
        ></div>
        <div class="bookmark-modal-wrapper" style="width:480px">
          <icon-button
            width="32px"
            height="32px"
            class="bookmark-modal-close-button"
            @click=${() => {
              this.onCancel?.();
              this.model.page.deleteBlock(this.model);
            }}
            >${CloseIcon}</icon-button
          >

          <div class="bookmark-modal-title">Bookmark</div>
          <div class="bookmark-modal-desc">
            Create a Bookmark that previews a link in card view.
          </div>
          <input
            tabindex="1"
            type="text"
            class="bookmark-input link"
            placeholder="Input in https://..."
          />

          <div class="bookmark-modal-footer">
            <div
              tabindex="2"
              class="bookmark-confirm-button"
              @click=${() => this._onConfirm()}
            >
              Confirm
            </div>
          </div>
        </div>
      </div>`;
    return html`<affine-portal .template=${modal}></affine-portal>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bookmark-create-modal': BookmarkCreateModal;
  }
}
