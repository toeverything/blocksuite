import './components/bookmark-toolbar.js';

import { BlockElement } from '@blocksuite/lit';
import { css, html, nothing } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';

import { registerService } from '../__internal__/service.js';
import type { BookmarkBlockModel } from './bookmark-model.js';
import { BookmarkBlockService } from './bookmark-service.js';
import type { ToolbarActionCallback } from './components/bookmark-toolbar.js';
import { DefaultBanner } from './images/banners.js';
import { DefaultIcon } from './images/icons.js';
import { refreshBookmarkBlock } from './utils.js';
@customElement('affine-bookmark')
export class BookmarkBlockComponent extends BlockElement<BookmarkBlockModel> {
  static override styles = css`
    .affine-bookmark-block-container {
      width: 100%;
      margin-top: calc(var(--affine-paragraph-space) + 8px);
      position: relative;
    }
    .affine-bookmark-link {
      height: 112px;
      background: linear-gradient(180deg, #f0f3fd 0%, #fcfcfd 100%);
      border: 3px solid #fcfcfd;
      box-shadow: 0 0 4px rgba(66, 65, 73, 0.14);
      border-radius: 12px;
      padding: 16px 24px;
      display: flex;
      cursor: pointer;
      text-decoration: none;
      color: var(--affine-text-primary-color);
      overflow: hidden;
      line-height: calc(1em + 4px);
    }
    .affine-bookmark-banner {
      width: 140px;
      height: 96px;
    }
    .affine-bookmark-banner img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .affine-bookmark-content-wrapper {
      flex-grow: 1;
      overflow: hidden;
    }
    .affine-bookmark-title {
      height: 18px;
      display: flex;
      align-items: center;
      font-size: var(--affine-font-sm);
      font-weight: 600;
    }
    .affine-bookmark-icon {
      width: 18px;
      height: 18px;
      margin-right: 4px;
      color: var(--affine-text-secondary-color);
    }
    .affine-bookmark-icon img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .affine-bookmark-description {
      height: 32px;
      line-height: 16px;
      margin-top: 4px;
      font-size: var(--affine-font-xs);

      display: -webkit-box;
      word-break: break-all;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .affine-bookmark-url {
      font-size: var(--affine-font-xs);
      color: var(--affine-text-secondary-color);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-top: 2px;
    }
    .affine-bookmark-caption {
      width: 100%;
      font-size: var(--affine-font-sm);
      outline: none;
      border: 0;
      font-family: inherit;
      text-align: center;
      color: var(--affine-icon-color);
      display: none;
      background: var(--affine-background-primary-color);
    }
    .affine-bookmark-caption::placeholder {
      color: var(--affine-placeholder-color);
    }
    .affine-bookmark-caption.caption-show {
      display: inline-block;
    }
  `;

  @query('input.affine-bookmark-caption')
  _input!: HTMLInputElement;

  @state()
  private _showToolbar = false;

  @state()
  private _caption!: string;

  private _timer: ReturnType<typeof setTimeout> | null = null;

  override firstUpdated() {
    this.model.propsUpdated.on(() => this.requestUpdate());

    this.updateComplete.then(() => {
      this._caption = this.model?.caption ?? '';

      if (this._caption) {
        // Caption input should be toggled manually.
        // However, it will be lost if the caption is deleted into empty state.
        this._input.classList.add('caption-show');
      }
    });
  }

  override connectedCallback() {
    super.connectedCallback();
    registerService('affine:bookmark', BookmarkBlockService);
    refreshBookmarkBlock(this.model);
  }

  private _onInputChange() {
    this._caption = this._input.value;
    this.model.page.updateBlock(this.model, { caption: this._caption });
  }

  private _onInputBlur() {
    if (!this._caption) {
      this._input.classList.remove('caption-show');
    }
  }

  private _onHover() {
    this._showToolbar = true;
    this._timer && clearTimeout(this._timer);
  }
  private _onHoverOut() {
    this._timer = setTimeout(() => {
      this._showToolbar = false;
    }, 200);
  }

  private _onToolbarSelected: ToolbarActionCallback = type => {
    if (type === 'caption') {
      this._input.classList.add('caption-show');
    }
  };
  override render() {
    const { url, title, description, icon, image } = this.model;

    return html`
      <div
        class="affine-bookmark-block-container"
        @mouseover="${this._onHover}"
        @mouseout="${this._onHoverOut}"
      >
        ${this._showToolbar
          ? html`<bookmark-toolbar
              .model=${this.model}
              .onSelected=${this._onToolbarSelected}
            ></bookmark-toolbar>`
          : nothing}
        <a href="${url}" target="_blank" class="affine-bookmark-link">
          <div class="affine-bookmark-content-wrapper">
            <div class="affine-bookmark-title">
              <div class="affine-bookmark-icon">
                ${icon ? html`<img src="${icon}" alt="icon" />` : DefaultIcon}
              </div>
              ${title || 'Bookmark'}
            </div>

            <div class="affine-bookmark-description">${description || url}</div>
            <div class="affine-bookmark-url">${url}</div>
          </div>
          <div class="affine-bookmark-banner">
            ${image ? html`<img src="${image}" alt="image" />` : DefaultBanner}
          </div>
        </a>

        <input
          .disabled=${this.model.page.readonly}
          placeholder="Write a caption"
          class="affine-bookmark-caption"
          value=${this._caption}
          @input=${this._onInputChange}
          @blur=${this._onInputBlur}
          @click=${(e: Event) => {
            e.stopPropagation();
          }}
        />
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-bookmark': BookmarkBlockComponent;
  }
}
