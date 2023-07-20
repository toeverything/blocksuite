import './components/bookmark-toolbar.js';
import './components/bookmark-edit-modal.js';
import './components/bookmark-create-modal.js';
import './components/loader.js';
import '../components/portal.js';

import { BlockElement } from '@blocksuite/lit';
import { Slot } from '@blocksuite/store';
import { css, html, nothing } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';

import { registerService } from '../__internal__/service.js';
import { stopPropagation } from '../__internal__/utils/event.js';
import { queryCurrentMode } from '../__internal__/utils/query.js';
import type { BookmarkBlockModel } from './bookmark-model.js';
import { BookmarkBlockService } from './bookmark-service.js';
import type { MenuActionCallback } from './components/bookmark-operation-popper.js';
import type { ToolbarActionCallback } from './components/bookmark-toolbar.js';
import { DefaultBanner } from './images/banners.js';
import {
  DarkLoadingBanner,
  DefaultIcon,
  LoadingBanner,
} from './images/icons.js';
import { reloadBookmarkBlock } from './utils.js';

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
      box-shadow: var(--affine-shadow-1);
      background: var(--affine-card-background-blue);
      border: 3px solid var(--affine-background-secondary-color);
      border-radius: 12px;
      padding: 16px 24px;
      display: flex;
      cursor: pointer;
      text-decoration: none;
      color: var(--affine-text-primary-color);
      overflow: hidden;
      line-height: calc(1em + 4px);
      position: relative;
    }
    .affine-bookmark-banner {
      width: 140px;
      height: 93px;
      margin-left: 20px;
      border-radius: 8px 8px 0 0;
      overflow: hidden;
      flex-shrink: 0;
    }
    .affine-bookmark-banner.shadow {
      box-shadow: var(--affine-shadow-1);
    }

    .affine-bookmark-banner img,
    .affine-bookmark-banner svg {
      width: 140px;
      height: 93px;
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
    .affine-bookmark-title-content {
      flex-grow: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-left: 8px;
    }
    .affine-bookmark-icon {
      width: 18px;
      height: 18px;
      color: var(--affine-text-secondary-color);
      flex-shrink: 0;
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
    .affine-bookmark-loading {
      width: 100%;
      height: 112px;
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      box-shadow: var(--affine-shadow-1);
      background: var(--affine-hover-color);
      border: 3px solid var(--affine-background-secondary-color);
      color: var(--affine-placeholder-color);
      border-radius: 12px;
    }
  `;

  slots = {
    openInitialModal: new Slot(),
  };

  @query('input.affine-bookmark-caption')
  _input!: HTMLInputElement;

  @state()
  private _showCreateModal = false;

  @state()
  private _toolbarHoverState: {
    inBookmark: boolean;
    inToolbar: boolean;
  } = {
    inBookmark: false,
    inToolbar: false,
  };

  @state()
  private _showEditModal = false;

  @state()
  private _caption!: string;

  @state()
  private _isLoading = false;

  private _toolbarHoverStateSlot = new Slot<{
    inBookmark?: boolean;
    inToolbar?: boolean;
  }>();

  private _timer: ReturnType<typeof setTimeout> | null = null;

  set loading(value: boolean) {
    this._isLoading = value;
  }

  get loading() {
    return this._isLoading;
  }

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
    reloadBookmarkBlock(this.model, this);
    this.slots.openInitialModal.on(() => {
      this._showCreateModal = true;
    });

    this._toolbarHoverStateSlot.on(({ inToolbar, inBookmark }) => {
      const {
        inBookmark: currentBookmarkState,
        inToolbar: currentToolbarState,
      } = this._toolbarHoverState;

      if (
        inBookmark === currentBookmarkState &&
        inToolbar === currentToolbarState
      ) {
        return;
      }

      this._toolbarHoverState = {
        inToolbar: inToolbar === undefined ? currentToolbarState : inToolbar,
        inBookmark:
          inBookmark === undefined ? currentBookmarkState : inBookmark,
      };
    });
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
    this._timer && clearTimeout(this._timer);
    this._toolbarHoverStateSlot.emit({ inBookmark: true });
  }

  private _onHoverOut() {
    this._timer = setTimeout(() => {
      this._toolbarHoverStateSlot.emit({ inBookmark: false });
    }, 100);
  }

  private _onCardClick() {
    let link = this.model.url;

    if (!link.match(/^[a-zA-Z]+:\/\//)) {
      link = 'https://' + link;
    }
    window.open(link, '_blank');
  }

  private _onToolbarSelected: ToolbarActionCallback & MenuActionCallback =
    type => {
      if (type === 'caption') {
        this._input.classList.add('caption-show');
        requestAnimationFrame(() => {
          this._input.focus();
        });
      }

      if (type === 'edit') {
        this._showEditModal = true;
      }

      this._toolbarHoverStateSlot.emit({ inBookmark: false, inToolbar: false });
    };

  override render() {
    const { url, bookmarkTitle, description, icon, image } = this.model;
    const mode = queryCurrentMode();
    const showToolbar =
      this._toolbarHoverState.inToolbar || this._toolbarHoverState.inBookmark;

    const createModal = this._showCreateModal
      ? html`<bookmark-create-modal
          .model=${this.model}
          .onCancel=${() => {
            this._showCreateModal = false;
          }}
          .onConfirm=${() => {
            reloadBookmarkBlock(this.model, this, true);
            this._showCreateModal = false;
          }}
        ></bookmark-create-modal>`
      : nothing;
    const editModal = this._showEditModal
      ? html`<bookmark-edit-modal
          .model=${this.model}
          .onCancel=${() => {
            this._showEditModal = false;
          }}
          .onConfirm=${() => {
            this._showEditModal = false;
          }}
        ></bookmark-edit-modal>`
      : nothing;
    const toolbar = showToolbar
      ? html`<bookmark-toolbar
          .model=${this.model}
          .onSelected=${this._onToolbarSelected}
          .root=${this}
          .toolbarHoverStateSlot=${this._toolbarHoverStateSlot}
        ></bookmark-toolbar>`
      : nothing;

    const loading = this._isLoading
      ? html`<div
          class="affine-bookmark-loading ${mode === 'light' ? '' : 'dark'}"
        >
          <div class="affine-bookmark-title">
            <bookmark-loader
              .size=${'15px'}
              .color=${'var(--affine-primary-color)'}
            ></bookmark-loader>
            <div class="affine-bookmark-title-content">Loading...</div>
          </div>
          <div class="affine-bookmark-banner">
            ${mode === 'light' ? LoadingBanner : DarkLoadingBanner}
          </div>
        </div>`
      : nothing;

    const linkCard = html`<div
      class="affine-bookmark-link"
      @click=${this._onCardClick}
    >
      <div class="affine-bookmark-content-wrapper">
        <div class="affine-bookmark-title">
          <div class="affine-bookmark-icon">
            ${icon ? html`<img src="${icon}" alt="icon" />` : DefaultIcon}
          </div>
          <div class="affine-bookmark-title-content">
            ${bookmarkTitle || 'Bookmark'}
          </div>
        </div>

        <div class="affine-bookmark-description">${description || url}</div>
        <div class="affine-bookmark-url">${url}</div>
      </div>
      <div class="affine-bookmark-banner ${image ? 'shadow' : ''}">
        ${image ? html`<img src="${image}" alt="image" />` : DefaultBanner}
      </div>
    </div>`;

    if (!url) {
      return createModal;
    }

    return html`
      ${editModal}
      <div
        class="affine-bookmark-block-container"
        @mouseover="${this._onHover}"
        @mouseout="${this._onHoverOut}"
      >
        <affine-portal .template=${toolbar}></affine-portal>
        ${this._isLoading ? loading : linkCard}
        <input
          .disabled=${this.model.page.readonly}
          placeholder="Write a caption"
          class="affine-bookmark-caption"
          value=${this._caption}
          @input=${this._onInputChange}
          @blur=${this._onInputBlur}
          @click=${stopPropagation}
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
