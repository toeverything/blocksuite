import type { BlockStdScope } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/lit';
import { Slice } from '@blocksuite/store';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { toast } from '../../_common/components/toast.js';
import {
  CopyIcon,
  DeleteIcon,
  DuplicateIcon,
  OpenIcon,
  RefreshIcon,
} from '../../_common/icons/text.js';
import type { BookmarkBlockComponent } from '../bookmark-block.js';
import type { BookmarkBlockModel } from '../bookmark-model.js';

@customElement('bookmark-more-menu')
export class BookmarkMoreMenu extends WithDisposable(LitElement) {
  static override styles = css`
    .bookmark-more-menu {
      border-radius: 8px;
      padding: 8px;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
    }

    .menu-item {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      width: 100%;
    }

    .menu-item:hover {
      background: var(--affine-hover-color);
    }

    .menu-item:hover.delete {
      background: var(--affine-background-error-color);
      color: var(--affine-error-color);
    }
    .menu-item:hover.delete > svg {
      color: var(--affine-error-color);
    }

    .menu-item svg {
      margin: 0 8px;
    }

    .divider {
      width: 148px;
      height: 1px;
      margin: 8px;
      background-color: var(--affine-border-color);
    }
  `;

  @property({ attribute: false })
  model!: BookmarkBlockModel;

  @property({ attribute: false })
  block!: BookmarkBlockComponent;

  @property({ attribute: false })
  std!: BlockStdScope;

  @property({ attribute: false })
  abortController!: AbortController;

  private _openLink() {
    let link = this.model.url;
    if (!link.match(/^[a-zA-Z]+:\/\//)) {
      link = 'https://' + link;
    }
    window.open(link, '_blank');
    this.abortController.abort();
  }

  private async _copyBookmark() {
    const slice = Slice.fromModels(this.model.page, [this.model]);
    await this.std.clipboard.copySlice(slice);
    toast('Copied link to clipboard');
    this.abortController.abort();
  }

  private _duplicateBookmark() {
    const { page, url } = this.model;
    const parent = page.getParent(this.model);
    const index = parent?.children.indexOf(this.model);
    page.addBlock(
      'affine:bookmark',
      {
        url,
      },
      parent,
      index
    );
    this.abortController.abort();
  }

  private _refreshBookmark() {
    this.block.refreshUrlData();
    this.abortController.abort();
  }

  override render() {
    return html`<div class="bookmark-more-menu">
      <icon-button
        width="126px"
        height="32px"
        class="menu-item open"
        text="Open"
        @click=${() => this._openLink()}
      >
        ${OpenIcon}
      </icon-button>

      <icon-button
        width="126px"
        height="32px"
        class="menu-item copy"
        text="Copy"
        @click=${() => this._copyBookmark()}
      >
        ${CopyIcon}
      </icon-button>

      <icon-button
        width="126px"
        height="32px"
        class="menu-item duplicate"
        text="Duplicate"
        ?disabled=${this.model.page.readonly}
        @click=${() => this._duplicateBookmark()}
      >
        ${DuplicateIcon}
      </icon-button>

      <icon-button
        width="126px"
        height="32px"
        class="menu-item reload"
        text="Reload"
        ?disabled=${this.model.page.readonly}
        @click=${() => this._refreshBookmark()}
      >
        ${RefreshIcon}
      </icon-button>

      <div class="divider"></div>

      <icon-button
        width="126px"
        height="32px"
        class="menu-item delete"
        text="Delete"
        ?disabled=${this.model.page.readonly}
        @click=${() => this.model.page.deleteBlock(this.model)}
      >
        ${DeleteIcon}
      </icon-button>
    </div> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bookmark-more-menu': BookmarkMoreMenu;
  }
}
