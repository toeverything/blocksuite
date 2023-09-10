import './components/bookmark-create-modal.js';
import './components/bookmark-edit-modal.js';
import './components/bookmark-toolbar.js';
import './components/loader.js';

import { Slot, whenHover } from '@blocksuite/global/utils';
import { BlockElement } from '@blocksuite/lit';
import { flip, offset } from '@floating-ui/dom';
import { css, html, nothing } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { ref, type RefOrCallback } from 'lit/directives/ref.js';

import { stopPropagation } from '../__internal__/utils/event.js';
import { queryCurrentMode } from '../__internal__/utils/query.js';
import { createLitPortal } from '../components/portal.js';
import { WebIcon16 } from '../icons/text.js';
import type { BookmarkBlockModel } from './bookmark-model.js';
import type {
  MenuActionCallback,
  ToolbarActionCallback,
} from './components/config.js';
import { embedIframeTemplate } from './embed.js';
import { DefaultBanner } from './images/banners.js';
import { DarkLoadingBanner, LoadingBanner } from './images/icons.js';
import { reloadBookmarkBlock } from './utils.js';

@customElement('affine-bookmark')
export class BookmarkBlockComponent extends BlockElement<BookmarkBlockModel> {
  static override styles = css`
    .affine-bookmark-block-container {
      width: 100%;
      margin-top: 18px;
      margin-bottom: 18px;
      position: relative;
    }
    .affine-bookmark-link {
      display: flex;
      flex-direction: column;
      align-items: center;
      box-shadow: var(--affine-shadow-1);
      border: 3px solid var(--affine-background-secondary-color);
      border-radius: 12px;
      padding: 16px 24px;
      cursor: pointer;
      text-decoration: none;
      color: var(--affine-text-primary-color);
      overflow: hidden;
      line-height: calc(1em + 4px);
      position: relative;
    }
    .affine-bookmark-banner {
      position: absolute;
      right: 24px;
      bottom: 0;
      width: 140px;
      height: 93px;
      border-radius: 8px 8px 0 0;
      overflow: hidden;
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
      width: 100%;
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
      display: flex;
      align-items: center;
      width: 18px;
      height: 18px;
      color: var(--affine-text-secondary-color);
      fill: var(--affine-text-secondary-color);
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

    .affine-bookmark-embed-frame {
      grid-area: embed;
      width: 100%;
      margin-bottom: 20px;
      border-radius: 8px;
      overflow: hidden;
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
  private _showEditModal = false;

  @state()
  private _caption!: string;

  @state()
  private _isLoading = false;
  @state()
  private _isIconError = false;
  @state()
  private _isImageError = false;

  private _optionsAbortController?: AbortController;

  set loading(value: boolean) {
    this._isLoading = value;
  }

  get loading() {
    return this._isLoading;
  }

  private _setReference: RefOrCallback;
  constructor() {
    super();

    const { setReference, setFloating, dispose } = whenHover(isHover => {
      if (!isHover) {
        this._optionsAbortController?.abort();
        return;
      }
      if (this._optionsAbortController) return;
      this._optionsAbortController = new AbortController();
      this._optionsAbortController.signal.addEventListener('abort', () => {
        this._optionsAbortController = undefined;
      });
      createLitPortal({
        template: html`<bookmark-toolbar
          ${ref(setFloating)}
          .model=${this.model}
          .onSelected=${this._onToolbarSelected}
          .root=${this}
          .abortController=${this._optionsAbortController}
        ></bookmark-toolbar>`,
        computePosition: {
          referenceElement: this,
          placement: 'top-end',
          middleware: [flip(), offset(4)],
          autoUpdate: true,
        },
        abortController: this._optionsAbortController,
      });
    });
    this._setReference = setReference;
    this.disposables.add(dispose);
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
    reloadBookmarkBlock(this.model, this);
    this.slots.openInitialModal.on(() => {
      this._showCreateModal = true;
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

  private _onCardClick() {
    const selectionManager = this.root.selectionManager;
    const blockSelection = selectionManager.getInstance('block', {
      path: this.path,
    });
    selectionManager.setGroup('note', [blockSelection]);
  }

  private _onCardDbClick() {
    let link = this.model.url;

    if (!link.match(/^[a-zA-Z]+:\/\//)) {
      link = 'https://' + link;
    }
    window.open(link, '_blank');
  }

  private _onIconError() {
    this._isIconError = true;
  }
  private _onImageError() {
    this._isImageError = true;
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

      if (type === 'reload') {
        this._isImageError = false;
        this._isIconError = false;
      }
      this._optionsAbortController?.abort();
    };

  private _linkCard() {
    const { url, bookmarkTitle, description, icon, image } = this.model;

    const isEmbed = this.model.type === 'embed';
    const titleIcon =
      icon && !this._isIconError
        ? html`<img src="${icon}" alt="icon" @error="${this._onIconError}" />`
        : WebIcon16;

    const bannerImage = isEmbed
      ? nothing
      : html`<div class="affine-bookmark-banner ${image ? 'shadow' : ''}">
          ${image && !this._isImageError
            ? html`<img
                src="${image}"
                alt="image"
                @error="${this._onImageError}"
              />`
            : DefaultBanner}
        </div>`;

    return html`<div
      class="affine-bookmark-link"
      style="${isEmbed
        ? nothing
        : 'background: var(--affine-card-background-blue);'}"
      @click=${this._onCardClick}
      @dblclick=${this._onCardDbClick}
    >
      ${isEmbed
        ? html`<div class="affine-bookmark-embed-frame">
            ${embedIframeTemplate(url)}
          </div>`
        : nothing}

      <div
        class="affine-bookmark-content-wrapper"
        style="${isEmbed ? nothing : 'padding-right: 165px;'}"
      >
        <div class="affine-bookmark-title">
          <div class="affine-bookmark-icon">${titleIcon}</div>
          <div class="affine-bookmark-title-content">
            ${bookmarkTitle || 'Bookmark'}
          </div>
        </div>

        <div class="affine-bookmark-description">${description || url}</div>
        <div class="affine-bookmark-url">${url}</div>
      </div>

      ${bannerImage}
    </div>`;
  }

  override render() {
    const { url } = this.model;
    const mode = queryCurrentMode();

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

    if (!url) {
      return createModal;
    }

    return html`
      ${editModal}
      <div ${ref(this._setReference)} class="affine-bookmark-block-container">
        ${this._isLoading ? loading : this._linkCard()}
        <input
          .disabled=${this.model.page.readonly}
          placeholder="Write a caption"
          class="affine-bookmark-caption"
          value=${this._caption}
          @input=${this._onInputChange}
          @blur=${this._onInputBlur}
          @pointerdown=${stopPropagation}
        />
        ${this.selected?.is('block')
          ? html`<affine-block-selection></affine-block-selection>`
          : null}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-bookmark': BookmarkBlockComponent;
  }
}
