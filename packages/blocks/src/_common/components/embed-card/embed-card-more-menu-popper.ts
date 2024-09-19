import {
  CenterPeekIcon,
  CopyIcon,
  DeleteIcon,
  DuplicateIcon,
  OpenIcon,
  RefreshIcon,
} from '@blocksuite/affine-components/icons';
import { isPeekable, peek } from '@blocksuite/affine-components/peek';
import { toast } from '@blocksuite/affine-components/toast';
import { WithDisposable } from '@blocksuite/global/utils';
import { Slice } from '@blocksuite/store';
import { css, html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';

import type { EmbedToolbarBlockComponent } from './type.js';

import {
  isEmbedLinkedDocBlock,
  isEmbedSyncedDocBlock,
} from '../../../root-block/edgeless/utils/query.js';
import { getBlockProps } from '../../utils/index.js';

export class EmbedCardMoreMenu extends WithDisposable(LitElement) {
  static override styles = css`
    .embed-card-more-menu {
      box-sizing: border-box;
      padding-bottom: 4px;
    }

    .embed-card-more-menu-container {
      border-radius: 8px;
      padding: 8px;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
    }

    .embed-card-more-menu-container > .menu-item {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      width: 100%;
    }

    .embed-card-more-menu-container > .menu-item:hover {
      background: var(--affine-hover-color);
    }

    .embed-card-more-menu-container > .menu-item:hover.delete {
      background: var(--affine-background-error-color);
      color: var(--affine-error-color);
    }
    .embed-card-more-menu-container > .menu-item:hover.delete > svg {
      color: var(--affine-error-color);
    }

    .embed-card-more-menu-container > .menu-item svg {
      margin: 0 8px;
    }

    .embed-card-more-menu-container > .divider {
      width: 148px;
      height: 1px;
      margin: 8px;
      background-color: var(--affine-border-color);
    }
  `;

  private get _doc() {
    return this.block.doc;
  }

  private get _model() {
    return this.block.model;
  }

  get _openButtonDisabled() {
    return (
      isEmbedLinkedDocBlock(this._model) && this._model.pageId === this._doc.id
    );
  }

  private get _std() {
    return this.block.std;
  }

  private async _copyBlock() {
    const slice = Slice.fromModels(this._doc, [this._model]);
    await this._std.clipboard.copySlice(slice);
    toast(this.block.host, 'Copied link to clipboard');
    this.abortController.abort();
  }

  private _duplicateBlock() {
    const model = this._model;
    const blockProps = getBlockProps(model);
    const { width, height, xywh, rotate, zIndex, ...duplicateProps } =
      blockProps;

    const { doc } = model;
    const parent = doc.getParent(model);
    const index = parent?.children.indexOf(model);
    doc.addBlock(
      model.flavour as BlockSuite.Flavour,
      duplicateProps,
      parent,
      index
    );
    this.abortController.abort();
  }

  private _open() {
    this.block.open();
    this.abortController.abort();
  }

  private _peek() {
    peek(this.block);
  }

  private _peekable() {
    return isPeekable(this.block);
  }

  private _refreshData() {
    this.block.refreshData();
    this.abortController.abort();
  }

  override render() {
    return html`
      <div class="embed-card-more-menu">
        <div
          class="embed-card-more-menu-container"
          @pointerdown=${(e: MouseEvent) => e.stopPropagation()}
        >
          <icon-button
            width="126px"
            height="32px"
            class="menu-item open"
            text="Open"
            @click=${() => this._open()}
            ?disabled=${this._openButtonDisabled}
          >
            ${OpenIcon}
          </icon-button>

          ${this._peekable()
            ? html`<icon-button
                width="126px"
                height="32px"
                text="Open in center peek"
                class="menu-item center-peek"
                @click=${() => this._peek()}
              >
                ${CenterPeekIcon}
              </icon-button>`
            : nothing}

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
            ?disabled=${this._doc.readonly}
            @click=${() => this._duplicateBlock()}
          >
            ${DuplicateIcon}
          </icon-button>

          ${isEmbedLinkedDocBlock(this._model) ||
          isEmbedSyncedDocBlock(this._model)
            ? nothing
            : html`<icon-button
                width="126px"
                height="32px"
                class="menu-item reload"
                text="Reload"
                ?disabled=${this._doc.readonly}
                @click=${() => this._refreshData()}
              >
                ${RefreshIcon}
              </icon-button>`}

          <div class="divider"></div>

          <icon-button
            width="126px"
            height="32px"
            class="menu-item delete"
            text="Delete"
            ?disabled=${this._doc.readonly}
            @click=${() => this._doc.deleteBlock(this._model)}
          >
            ${DeleteIcon}
          </icon-button>
        </div>
      </div>
    `;
  }

  @property({ attribute: false })
  accessor abortController!: AbortController;

  @property({ attribute: false })
  accessor block!: EmbedToolbarBlockComponent;
}

declare global {
  interface HTMLElementTagNameMap {
    'embed-card-more-menu': EmbedCardMoreMenu;
  }
}
