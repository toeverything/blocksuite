import type {
  AttachmentBlockModel,
  BlockModels,
  BookmarkBlockModel,
  CodeBlockModel,
  DatabaseBlockModel,
  ImageBlockModel,
  ListBlockModel,
  ParagraphBlockModel,
} from '@blocksuite/blocks';
import { BlocksUtils } from '@blocksuite/blocks';
import { DisposableGroup, noop } from '@blocksuite/global/utils';
import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';

import { placeholderMap, previewIconMap } from './config.js';

type ValuesOf<T, K extends keyof T = keyof T> = T[K];

function assertType<T>(value: unknown): asserts value is T {
  noop(value);
}

export class TOCBlockPreview extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .toc-block-preview {
      width: 100%;
      box-sizing: border-box;
      padding: 6px 8px;
      white-space: nowrap;
      display: flex;
      justify-content: start;
      align-items: center;
      gap: 8px;
    }

    .icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      box-sizing: border-box;
      padding: 4px;
      background: var(--affine-background-secondary-color);
      border-radius: 4px;
      color: var(--affine-icon-color);
    }

    .icon.disabled {
      color: var(--affine-disabled-icon-color);
    }

    .text {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;

      font-size: var(--affine-font-sm);
      line-height: 24px;
    }

    .text.general,
    .subtype.text,
    .subtype.quote {
      font-weight: 400;
      padding-left: 28px;
    }

    .subtype.h1,
    .subtype.h2,
    .subtype.h3,
    .subtype.h4,
    .subtype.h5,
    .subtype.h6 {
      font-weight: 600;
    }

    .subtype.h1 {
      padding-left: 0;
    }
    .subtype.h2 {
      padding-left: 4px;
    }
    .subtype.h3 {
      padding-left: 12px;
    }
    .subtype.h4 {
      padding-left: 16px;
    }
    .subtype.h5 {
      padding-left: 20px;
    }
    .subtype.h6 {
      padding-left: 24px;
    }

    .toc-block-preview:not(:has(span)) {
      display: none;
    }
  `;

  @property({ attribute: false })
  block!: ValuesOf<BlockModels>;

  @property({ attribute: false })
  hidePreviewIcon!: boolean;

  @property({ attribute: false })
  disabledIcon = false;

  @property({ attribute: false })
  cardNumber!: number;

  private _textDisposables: DisposableGroup | null = null;

  private _clearTextDisposables = () => {
    this._textDisposables?.dispose();
    this._textDisposables = null;
  };

  private _setTextDisposables = (block: ValuesOf<BlockModels>) => {
    this._clearTextDisposables();
    this._textDisposables = new DisposableGroup();
    block.text?.yText.observe(this._updateElement);
    this._textDisposables.add({
      dispose: () => block.text?.yText.unobserve(this._updateElement),
    });
    this._textDisposables.add(this.block.propsUpdated.on(this._updateElement));
  };

  private _updateElement = () => {
    this.requestUpdate();
  };

  override connectedCallback(): void {
    super.connectedCallback();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._clearTextDisposables();
  }

  override updated() {
    this.updateComplete
      .then(() => {
        if (
          BlocksUtils.matchFlavours(this.block, [
            'affine:paragraph',
            'affine:list',
          ])
        ) {
          this._setTextDisposables(this.block);
        }
      })
      .catch(console.error);
  }

  renderBlockByFlavour() {
    const { block } = this;
    const iconClass = this.disabledIcon ? 'icon disabled' : 'icon';

    switch (block.flavour as keyof BlockModels) {
      case 'affine:paragraph':
        assertType<ParagraphBlockModel>(block);
        if (!block.text.toString().trim().length) return nothing;

        return html`
          <span class="text subtype ${block.type}"
            >${block.text.toString().length
              ? block.text.toString()
              : placeholderMap[block.type]}</span
          >
          ${!this.hidePreviewIcon
            ? html`<span class=${iconClass}
                >${previewIconMap[block.type]}</span
              >`
            : nothing}
        `;
      case 'affine:list':
        assertType<ListBlockModel>(block);
        if (!block.text.toString().trim().length) return nothing;

        return html`
          <span class="text general"
            >${block.text.toString().length
              ? block.text.toString()
              : placeholderMap[block.type]}</span
          >
          ${!this.hidePreviewIcon
            ? html`<span class=${iconClass}
                >${previewIconMap[block.type]}</span
              >`
            : nothing}
        `;
      case 'affine:bookmark':
        assertType<BookmarkBlockModel>(block);
        return html`
          <span class="text general"
            >${block.title || block.url || placeholderMap['bookmark']}</span
          >
          ${!this.hidePreviewIcon
            ? html`<span class=${iconClass}
                >${previewIconMap['bookmark']}</span
              >`
            : nothing}
        `;
      case 'affine:code':
        assertType<CodeBlockModel>(block);
        return html`
          <span class="text general"
            >${block.language ?? placeholderMap['code']}</span
          >
          ${!this.hidePreviewIcon
            ? html`<span class=${iconClass}>${previewIconMap['code']}</span>`
            : nothing}
        `;
      case 'affine:database':
        assertType<DatabaseBlockModel>(block);
        return html`
          <span class="text general"
            >${block.title.toString().length
              ? block.title.toString()
              : placeholderMap['database']}</span
          >
          ${!this.hidePreviewIcon
            ? html`<span class=${iconClass}>${previewIconMap['table']}</span>`
            : nothing}
        `;
      case 'affine:image':
        assertType<ImageBlockModel>(block);
        return html`
          <span class="text general"
            >${block.caption?.length
              ? block.caption
              : placeholderMap['image']}</span
          >
          ${!this.hidePreviewIcon
            ? html`<span class=${iconClass}>${previewIconMap['image']}</span>`
            : nothing}
        `;
      case 'affine:attachment':
        assertType<AttachmentBlockModel>(block);
        return html`
          <span class="text general"
            >${block.name?.length
              ? block.name
              : placeholderMap['attachment']}</span
          >
          ${!this.hidePreviewIcon
            ? html`<span class=${iconClass}
                >${previewIconMap['attachment']}</span
              >`
            : nothing}
        `;
      default:
        return nothing;
    }
  }

  override render() {
    return html`<div class="toc-block-preview">
      ${this.renderBlockByFlavour()}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'toc-block-preview': TOCBlockPreview;
  }
}
