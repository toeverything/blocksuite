import './../button.js';

import type { BlockStdScope } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/lit';
import { Slice } from '@blocksuite/store';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { EmbedFigmaBlockComponent } from '../../../embed-figma-block/embed-figma-block.js';
import type { EmbedFigmaModel } from '../../../embed-figma-block/embed-figma-model.js';
import type { EmbedGithubBlockComponent } from '../../../embed-github-block/embed-github-block.js';
import type { EmbedGithubModel } from '../../../embed-github-block/embed-github-model.js';
import type { EmbedLinkedDocBlockComponent } from '../../../embed-linked-doc-block/embed-linked-doc-block.js';
import type { EmbedLinkedDocModel } from '../../../embed-linked-doc-block/embed-linked-doc-model.js';
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

@customElement('embed-card-more-menu')
export class EmbedCardMoreMenu extends WithDisposable(LitElement) {
  static override styles = css`
    .embed-card-more-menu {
      border-radius: 8px;
      padding: 8px;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
    }

    .embed-card-more-menu .menu-item {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      width: 100%;
    }

    .embed-card-more-menu .menu-item:hover {
      background: var(--affine-hover-color);
    }

    .embed-card-more-menu .menu-item:hover.delete {
      background: var(--affine-background-error-color);
      color: var(--affine-error-color);
    }
    .embed-card-more-menu .menu-item:hover.delete > svg {
      color: var(--affine-error-color);
    }

    .embed-card-more-menu .menu-item svg {
      margin: 0 8px;
    }

    .embed-card-more-menu .divider {
      width: 148px;
      height: 1px;
      margin: 8px;
      background-color: var(--affine-border-color);
    }
  `;

  @property({ attribute: false })
  model!:
    | BookmarkBlockModel
    | EmbedGithubModel
    | EmbedYoutubeModel
    | EmbedFigmaModel
    | EmbedLinkedDocModel;

  @property({ attribute: false })
  block!:
    | BookmarkBlockComponent
    | EmbedGithubBlockComponent
    | EmbedYoutubeBlockComponent
    | EmbedFigmaBlockComponent
    | EmbedLinkedDocBlockComponent;

  @property({ attribute: false })
  std!: BlockStdScope;

  @property({ attribute: false })
  abortController!: AbortController;

  private _open() {
    this.block.open();
    this.abortController.abort();
  }

  private async _copyBlock() {
    const slice = Slice.fromModels(this.model.page, [this.model]);
    await this.std.clipboard.copySlice(slice);
    toast(this.block.host, 'Copied link to clipboard');
    this.abortController.abort();
  }

  private _duplicateBlock() {
    const model = this.model;
    const keys = model.keys as (keyof typeof model)[];
    const values = keys.map(key => model[key]);
    const blockProps = Object.fromEntries(
      keys.map((key, i) => [key, values[i]])
    );
    const { width, height, xywh, rotate, zIndex, ...duplicateProps } =
      blockProps;

    const { page } = model;
    const parent = page.getParent(model);
    const index = parent?.children.indexOf(model);
    page.addBlock(model.flavour, duplicateProps, parent, index);
    this.abortController.abort();
  }

  private _refreshData() {
    this.block.refreshData();
    this.abortController.abort();
  }

  override render() {
    return html`<div class="embed-card-more-menu">
      <icon-button
        width="126px"
        height="32px"
        class="menu-item open"
        text="Open"
        @click=${() => this._open()}
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
        @click=${() => this._refreshData()}
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
    'embed-card-more-menu': EmbedCardMoreMenu;
  }
}
