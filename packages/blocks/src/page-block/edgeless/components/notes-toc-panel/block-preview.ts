import type { BlockModels } from '@blocksuite/global/types.js';
import { WithDisposable } from '@blocksuite/lit';
import { matchFlavours } from '@blocksuite/store/index.js';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { getVirgoByModel, noop } from '../../../../__internal__/index.js';
import type { DividerBlockModel } from '../../../../models.js';
import {
  type AttachmentBlockModel,
  type BookmarkBlockModel,
  type CodeBlockModel,
  type DatabaseBlockModel,
  type DataViewBlockModel,
  type ImageBlockModel,
  type ListBlockModel,
  type ParagraphBlockModel,
} from '../../../../models.js';

type ValuesOf<T, K extends keyof T = keyof T> = T[K];

function assertType<T>(value: unknown): asserts value is T {
  noop(value);
}

@customElement('blocksuite-toc-block-preview')
export class TOCBlockPreview extends WithDisposable(LitElement) {
  static override styles = css`
    .blocksuite-toc-block-preview {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 10px;
      line-height: 16px;
    }

    .subtype.h1,
    .subtype.h2,
    .subtype.h3 .subtype.h4 {
      font-weight: bolder;
    }
  `;

  @property({ attribute: false })
  block!: ValuesOf<BlockModels>;

  override connectedCallback() {
    super.connectedCallback();

    if (matchFlavours(this.block, ['affine:paragraph'])) {
      const virgoEditor = getVirgoByModel(this.block);

      if (virgoEditor) {
        this._disposables.add(
          virgoEditor.slots.updated.on(() => this.requestUpdate())
        );
      }
    }
    this._disposables.add(
      this.block.propsUpdated.on(() => this.requestUpdate())
    );
  }

  renderBlockByFlavour() {
    const { block } = this;

    switch (block.flavour as keyof BlockModels) {
      case 'affine:paragraph':
        assertType<ParagraphBlockModel>(block);
        return html`<span class="subtype ${block.type}"
          >${block.text.toString()}</span
        >`;
      case 'affine:bookmark':
        assertType<BookmarkBlockModel>(block);
        return block.bookmarkTitle ?? block.url;
      case 'affine:code':
        assertType<CodeBlockModel>(block);
        return block.language;
      case 'affine:database':
        assertType<DatabaseBlockModel>(block);
        return block.title ?? '';
      case 'affine:image':
        assertType<ImageBlockModel>(block);
        return block.caption ?? '';
      case 'affine:list':
        assertType<ListBlockModel>(block);
        return block.text.toString();
      case 'affine:attachment':
        assertType<AttachmentBlockModel>(block);
        return block.name;
      case 'affine:data-view':
        assertType<DataViewBlockModel>(block);
        return block.sourceId;
      case 'affine:divider':
        assertType<DividerBlockModel>(block);
        return 'divider';
      default:
        return block.type;
    }
  }

  override render() {
    return html`<div class="blocksuite-toc-block-preview">
      ${this.renderBlockByFlavour()}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'blocksuite-toc-block-preview': TOCBlockPreview;
  }
}
