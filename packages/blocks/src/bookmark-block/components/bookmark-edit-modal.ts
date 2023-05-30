import '../../components/button.js';
import '../../components/portal.js';
import '../../components/button.js';

import { WithDisposable } from '@blocksuite/lit';
import { type BaseBlockModel } from '@blocksuite/store';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { BookmarkBlockModel } from '../bookmark-model.js';
import { CloseIcon } from '../images/icons.js';

export const bookmarkModalStyles = html`
  <style>
    .bookmark-modal-container {
      position: fixed;
      width: 100vw;
      height: 100vh;
      display: flex;
    }
    .bookmark-modal-mask {
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
      margin: auto;
    }
    .bookmark-modal-wrapper {
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
      margin: auto;

      width: 360px;
      height: 260px;
      background: var(--affine-background-primary-color);
      box-shadow: var(--affine-menu-shadow);
      border-radius: var(--affine-popover-radius);
      padding: 36px 40px 24px;
    }
    .bookmark-modal-close-button {
      position: absolute;
      right: 20px;
      top: 12px;
    }
    .bookmark-modal-title {
      font-size: var(--affine-font-h-6);
      font-weight: 600;
    }
    .bookmark-modal-desc {
      font-size: var(--affine-font-base);
      margin-top: 20px;
      caret-color: var(--affine-primary-color);
    }
    .bookmark-input {
      width: 100%;
      height: 32px;
      font-size: var(--affine-font-base);
      margin-top: 20px;
      caret-color: var(--affine-primary-color);
      transition: border-color 0.15s;

      line-height: 22px;
      padding: 8px 12px;
      color: var(--affine-text-primary-color);
      border: 1px solid;
      border-color: var(--affine-border-color);
      background-color: var(--affine-white);
      border-radius: 10px;
      outline: medium;
    }
    .bookmark-input:focus {
      border-color: var(--affine-primary-color);
    }

    .bookmark-input::placeholder {
      color: var(--affine-placeholder-color);
      font-size: var(--affine-font-base);
    }

    .bookmark-modal-footer {
      display: flex;
      justify-content: flex-end;
      margin-top: 40px;
    }
    .bookmark-confirm-button {
      padding: 4px 20px;
      height: 32px;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: var(--affine-font-base);
      background: var(--affine-primary-color);
      color: var(--affine-white);
      border-color: var(--affine-primary-color);
      border-radius: 8px;
      cursor: pointer;
    }
  </style>
`;
@customElement('bookmark-edit-modal')
export class BookmarkEditModal extends WithDisposable(LitElement) {
  @property()
  model!: BaseBlockModel<BookmarkBlockModel>;
  @property()
  onCancel?: () => void;
  @property()
  onConfirm?: () => void;

  override get id() {
    return `bookmark-modal-${this.model.id.split(':')[0]}`;
  }

  override connectedCallback() {
    super.connectedCallback();

    document.addEventListener('keydown', this._modalKeyboardListener);
    requestAnimationFrame(() => {
      const titleInput = document.querySelector(
        `#${this.id} input.title`
      ) as HTMLInputElement;
      titleInput.focus();
      titleInput.setSelectionRange(0, titleInput.value.length);
    });
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
    const titleInput = document.querySelector(
      `#${this.id} input.title`
    ) as HTMLInputElement;
    const descInput = document.querySelector(
      `#${this.id} input.description`
    ) as HTMLInputElement;

    this.model.page.updateBlock(this.model, {
      title: titleInput.value,
      description: descInput.value,
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
          }}
        ></div>
        <div class="bookmark-modal-wrapper">
          <icon-button
            width="32px"
            height="32px"
            class="bookmark-modal-close-button"
            @click=${() => {
              this.onCancel?.();
            }}
            >${CloseIcon}</icon-button
          >

          <div class="bookmark-modal-title">Edit</div>
          <input
            type="text"
            class="bookmark-input title"
            placeholder="Title"
            value=${this.model.title || 'Bookmark'}
            tabindex="1"
          />
          <input
            type="text"
            class="bookmark-input description"
            placeholder="Description"
            value=${this.model.description || this.model.url}
            tabindex="2"
          />
          <div class="bookmark-modal-footer">
            <div
              class="bookmark-confirm-button"
              tabindex="3"
              @click=${() => {
                this._onConfirm();
              }}
            >
              Save
            </div>
          </div>
        </div>
      </div>`;
    return html`<affine-portal .template=${modal}></affine-portal>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bookmark-edit-modal': BookmarkEditModal;
  }
}
