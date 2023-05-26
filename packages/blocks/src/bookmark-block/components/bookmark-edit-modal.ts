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
    .bookmark-ensure-button {
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

  override get id() {
    return `bookmark-modal-${this.model.id.split(':')[0]}`;
  }

  override connectedCallback() {
    super.connectedCallback();
  }

  private _onEnsure() {
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
            value=${this.model.title}
          />
          <input
            type="text"
            class="bookmark-input description"
            placeholder="Description"
            value=${this.model.description}
          />
          <div class="bookmark-modal-footer">
            <div
              class="bookmark-ensure-button"
              @click=${() => {
                this._onEnsure();
                this.onCancel?.();
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
