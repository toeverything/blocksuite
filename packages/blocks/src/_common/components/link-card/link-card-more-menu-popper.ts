import type { BlockStdScope } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/lit';
import { Slice } from '@blocksuite/store';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { EmbedGithubBlockComponent } from '../../../embed-github-block/embed-github-block.js';
import type { EmbedGithubModel } from '../../../embed-github-block/embed-github-model.js';
import type { EmbedYoutubeBlockComponent } from '../../../embed-youtube-block/embed-youtube-block.js';
import type { EmbedYoutubeModel } from '../../../embed-youtube-block/embed-youtube-model.js';
import type {
  BookmarkBlockComponent,
  BookmarkBlockModel,
} from '../../../index.js';
import {
  CopyIcon,
  DeleteIcon,
  DuplicateIcon,
  OpenIcon,
  RefreshIcon,
} from '../../icons/text.js';
import { toast } from '../toast.js';

@customElement('link-card-more-menu')
export class LinkCardMoreMenu extends WithDisposable(LitElement) {
  static override styles = css`
    .link-card-more-menu {
      border-radius: 8px;
      padding: 8px;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
    }

    .link-card-more-menu .menu-item {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      width: 100%;
    }

    .link-card-more-menu .menu-item:hover {
      background: var(--affine-hover-color);
    }

    .link-card-more-menu .menu-item:hover.delete {
      background: var(--affine-background-error-color);
      color: var(--affine-error-color);
    }
    .link-card-more-menu .menu-item:hover.delete > svg {
      color: var(--affine-error-color);
    }

    .link-card-more-menu .menu-item svg {
      margin: 0 8px;
    }

    .link-card-more-menu .divider {
      width: 148px;
      height: 1px;
      margin: 8px;
      background-color: var(--affine-border-color);
    }
  `;

  @property({ attribute: false })
  model!: BookmarkBlockModel | EmbedGithubModel | EmbedYoutubeModel;

  @property({ attribute: false })
  block!:
    | BookmarkBlockComponent
    | EmbedGithubBlockComponent
    | EmbedYoutubeBlockComponent;

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

  private async _copyBlock() {
    const slice = Slice.fromModels(this.model.page, [this.model]);
    await this.std.clipboard.copySlice(slice);
    toast('Copied link to clipboard');
    this.abortController.abort();
  }

  private _duplicateBlock() {
    const { page, url } = this.model;
    const parent = page.getParent(this.model);
    const index = parent?.children.indexOf(this.model);
    page.addBlock(
      this.model.flavour,
      {
        url,
      },
      parent,
      index
    );
    this.abortController.abort();
  }

  private _refreshUrlData() {
    this.block.refreshUrlData();
    this.abortController.abort();
  }

  override render() {
    return html`<div class="link-card-more-menu">
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
        @click=${() => this._copyBlock()}
      >
        ${CopyIcon}
      </icon-button>

      <icon-button
        width="126px"
        height="32px"
        class="menu-item duplicate"
        text="Duplicate"
        ?disabled=${this.model.page.readonly}
        @click=${() => this._duplicateBlock()}
      >
        ${DuplicateIcon}
      </icon-button>

      <icon-button
        width="126px"
        height="32px"
        class="menu-item reload"
        text="Reload"
        ?disabled=${this.model.page.readonly}
        @click=${() => this._refreshUrlData()}
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
    'link-card-more-menu': LinkCardMoreMenu;
  }
}
