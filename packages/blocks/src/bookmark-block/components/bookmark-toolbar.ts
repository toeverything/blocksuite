import './bookmark-card-style-popper';

import type { BlockStdScope } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/lit';
import { Workspace } from '@blocksuite/store';
import { flip, offset } from '@floating-ui/dom';
import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import { createLitPortal } from '../../_common/components/portal.js';
import { toast } from '../../_common/components/toast.js';
import {
  BookmarkIcon,
  CaptionIcon,
  CopyIcon,
  EditIcon,
  EmbedWebIcon,
  LinkIcon,
  MoreVerticalIcon,
  PaletteIcon,
} from '../../_common/icons/index.js';
import type { BookmarkBlockComponent } from '../bookmark-block.js';
import type { BookmarkBlockModel } from '../bookmark-model.js';
import { BookmarkCardStyleMenu } from './bookmark-card-style-popper.js';
import { BookmarkMoreMenu } from './bookmark-more-menu-popper.js';
import { type ToolbarActionCallback } from './config.js';
import { toggleBookmarkEditModal } from './modal/bookmark-edit-modal.js';

@customElement('bookmark-toolbar')
export class BookmarkToolbar extends WithDisposable(LitElement) {
  static override styles = css`
    .bookmark-toolbar {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      padding: 8px;
      gap: 8px;
      height: 40px;

      border-radius: 8px;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      user-select: none;
    }

    .divider {
      width: 1px;
      height: 24px;
      background-color: var(--affine-border-color);
    }

    .bookmark-toolbar-button.url {
      display: flex;
      width: 180px;
      padding: var(--1, 0px);
      align-items: flex-start;
      gap: 10px;
      border-radius: var(--1, 0px);
      opacity: var(--add, 1);
      user-select: none;
      cursor: pointer;
    }

    .bookmark-toolbar-button.url > span {
      color: var(--affine-link-color);
      font-feature-settings:
        'clig' off,
        'liga' off;
      font-family: var(--affine-font-family);
      font-size: 15px;
      font-style: normal;
      font-weight: 400;
      line-height: 24px;
      text-overflow: ellipsis;
      overflow: hidden;
      opacity: var(--add, 1);
    }

    .bookmark-toolbar-button.view-selector {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 2px;
      border-radius: 6px;
      background: var(--affine-hover-color);
    }
    .bookmark-toolbar-button.view-selector > icon-button {
      padding: 0px;
    }
    .bookmark-toolbar-button.view-selector .current-view {
      background: var(--affine-background-overlay-panel-color);
      border-radius: 6px;
    }
  `;

  @property({ attribute: false })
  model!: BookmarkBlockModel;

  @property({ attribute: false })
  block!: BookmarkBlockComponent;

  @property({ attribute: false })
  onSelected!: ToolbarActionCallback;

  @property({ attribute: false })
  host!: HTMLElement;

  @property({ attribute: false })
  abortController!: AbortController;

  @property({ attribute: false })
  std!: BlockStdScope;

  @query('.bookmark-toolbar')
  bookmarkBarElement!: HTMLElement;

  @query('.bookmark-toolbar-button.card-style')
  cardStyleButton!: HTMLElement;

  private _cardStyleMenuAbortController: AbortController | null = null;

  private _moreMenuAbortController: AbortController | null = null;

  private _copyUrl() {
    navigator.clipboard.writeText(this.model.url).catch(console.error);
    toast('Copied link to clipboard');
    this.remove();
  }

  private _turnIntoLinkView() {
    const { page } = this.model;
    const parent = page.getParent(this.model);
    const index = parent?.children.indexOf(this.model);

    const yText = new Workspace.Y.Text();
    const insert = this.model.title || this.model.caption || this.model.url;
    yText.insert(0, insert);
    yText.format(0, insert.length, { link: this.model.url });
    const text = new page.Text(yText);
    page.addBlock(
      'affine:paragraph',
      {
        text,
      },
      parent,
      index
    );

    page.deleteBlock(this.model);
    this.onSelected('link');
  }

  private _toggleCardStyleMenu() {
    if (this._moreMenuAbortController) {
      this._moreMenuAbortController.abort();
      this._moreMenuAbortController = null;
    }
    if (this._cardStyleMenuAbortController) {
      this._cardStyleMenuAbortController.abort();
      this._cardStyleMenuAbortController = null;
      return;
    }
    this._cardStyleMenuAbortController = new AbortController();
    const cardStyleMenu = new BookmarkCardStyleMenu();
    cardStyleMenu.model = this.model;
    cardStyleMenu.std = this.std;
    cardStyleMenu.abortController = this.abortController;

    createLitPortal({
      template: cardStyleMenu,
      container: this.bookmarkBarElement,
      computePosition: {
        referenceElement: this.cardStyleButton,
        placement: 'top',
        middleware: [flip(), offset(8)],
        autoUpdate: true,
      },
      abortController: this._cardStyleMenuAbortController,
    });
  }

  private _toggleMoreMenu() {
    if (this._cardStyleMenuAbortController) {
      this._cardStyleMenuAbortController.abort();
      this._cardStyleMenuAbortController = null;
    }
    if (this._moreMenuAbortController) {
      this._moreMenuAbortController.abort();
      this._moreMenuAbortController = null;
      return;
    }
    this._moreMenuAbortController = new AbortController();
    const bookmarkOperationMenu = new BookmarkMoreMenu();
    bookmarkOperationMenu.model = this.model;
    bookmarkOperationMenu.block = this.block;
    bookmarkOperationMenu.std = this.std;
    bookmarkOperationMenu.abortController = this.abortController;

    createLitPortal({
      template: bookmarkOperationMenu,
      container: this.bookmarkBarElement,
      computePosition: {
        referenceElement: this.bookmarkBarElement,
        placement: 'top-end',
        middleware: [flip(), offset(4)],
        autoUpdate: true,
      },
      abortController: this._moreMenuAbortController,
    });
  }

  override render() {
    return html`
      <div class="bookmark-toolbar">
        <div
          class="bookmark-toolbar-button url"
          @click=${() => this._copyUrl()}
        >
          <affine-tooltip .offset=${12}>Click to copy link</affine-tooltip>
          <span>${this.model.url}</span>
        </div>

        <icon-button
          size="32px"
          class="bookmark-toolbar-button copy"
          ?disabled=${this.model.page.readonly}
          @click=${() => this._copyUrl()}
        >
          ${CopyIcon}
          <affine-tooltip .offset=${12}>${'Click to copy link'}</affine-tooltip>
        </icon-button>

        <icon-button
          size="32px"
          class="bookmark-toolbar-button edit"
          ?disabled=${this.model.page.readonly}
          @click=${() => toggleBookmarkEditModal(this.block)}
        >
          ${EditIcon}
          <affine-tooltip .offset=${12}>${'Edit'}</affine-tooltip>
        </icon-button>

        <div class="divider"></div>

        <div class="bookmark-toolbar-button view-selector">
          <icon-button
            size="24px"
            class="bookmark-toolbar-button link"
            hover="false"
            ?disabled=${this.model.page.readonly}
            @click=${() => this._turnIntoLinkView()}
          >
            ${LinkIcon}
            <affine-tooltip .offset=${12}>${'Link view'}</affine-tooltip>
          </icon-button>

          <icon-button
            size="24px"
            class="bookmark-toolbar-button card current-view"
            hover="false"
            ?disabled=${this.model.page.readonly}
          >
            ${BookmarkIcon}
            <affine-tooltip .offset=${12}>${'Card view'}</affine-tooltip>
          </icon-button>

          <icon-button
            size="24px"
            class="bookmark-toolbar-button embed"
            hover="false"
            ?disabled=${this.model.page.readonly}
          >
            ${EmbedWebIcon}
            <affine-tooltip .offset=${12}>${'Embed view'}</affine-tooltip>
          </icon-button>
        </div>

        <icon-button
          size="32px"
          class="bookmark-toolbar-button card-style"
          ?disabled=${this.model.page.readonly}
          @click=${() => this._toggleCardStyleMenu()}
        >
          ${PaletteIcon}
          <affine-tooltip .offset=${12}>${'Card style'}</affine-tooltip>
        </icon-button>

        <div class="divider"></div>

        <icon-button
          size="32px"
          class="bookmark-toolbar-button caption"
          ?disabled=${this.model.page.readonly}
          @click=${() => this.onSelected('caption')}
        >
          ${CaptionIcon}
          <affine-tooltip .offset=${12}>${'Add Caption'}</affine-tooltip>
        </icon-button>

        <div class="divider"></div>

        <icon-button
          size="24px"
          class="bookmark-toolbar-button more-button"
          @click=${() => this._toggleMoreMenu()}
        >
          ${MoreVerticalIcon}
          <affine-tooltip .offset=${12}>More</affine-tooltip>
        </icon-button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bookmark-toolbar': BookmarkToolbar;
  }
}
