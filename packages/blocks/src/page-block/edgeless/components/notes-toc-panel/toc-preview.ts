import {
  AttachmentIcon,
  BookmarkIcon,
  BulletedListIcon,
  CodeBlockIcon,
  DatabaseKanbanViewIcon,
  DatabaseTableViewIcon,
  DividerIcon,
  ImageIcon,
  NumberedListIcon,
  QuoteIcon,
  TodoIcon,
} from '@blocksuite/global/config';
import type { BlockModels } from '@blocksuite/global/types';
import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import * as Y from 'yjs';

import { noop } from '../../../../__internal__/index.js';
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

const listIconMap: {
  [key in ListBlockModel['type']]: TemplateResult<1>;
} = {
  bulleted: BulletedListIcon,
  numbered: NumberedListIcon,
  todo: TodoIcon,
  toggle: BulletedListIcon,
};

export class TOCBlockPreview extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: block;
      width: 156%;
    }

    .edgeless-toc-block-preview {
      white-space: nowrap;
      line-height: 15px;
      display: flex;
      justify-content: start;
      align-items: center;
      gap: 5px;
    }

    .icon {
      color: var(--affine-icon-color);
      display: flex;
      align-items: center;
    }

    .icon > svg {
      width: 12px;
      height: 12px;
      fill: currentColor;
    }

    .text {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;

      font-size: 12px;
      transform: scale(0.625);
      transform-origin: center left;
      color: var(--affine-text-primary-color);
    }
    .subtype.h1,
    .subtype.h2,
    .subtype.h3 .subtype.h4 {
      font-weight: bolder;
    }
  `;

  @property({ attribute: false })
  block!: ValuesOf<BlockModels>;

  override connectedCallback(): void {
    super.connectedCallback();

    this._disposables.add(
      this.block.page.slots.onYEvent.on(({ event }) => {
        if (event instanceof Y.YTextEvent && event.path[0] === this.block.id) {
          this.requestUpdate();
        }
      })
    );

    this._disposables.add(
      this.block.propsUpdated.on(() => this.requestUpdate())
    );
  }

  renderBlockByFlavour() {
    const { block } = this;

    switch (block.flavour as keyof BlockModels) {
      case 'affine:paragraph':
        assertType<ParagraphBlockModel>(block);
        return html`
          ${block.type === 'quote'
            ? html`<span class="icon">${QuoteIcon}</span>`
            : nothing}
          <span class="text subtype ${block.type}"
            >${block.text.toString()}</span
          >
        `;
      case 'affine:list':
        assertType<ListBlockModel>(block);
        return html`
          <span class="icon">${listIconMap[block.type]}</span>
          <span class="text">${block.text.toString()}</span>
        `;
      case 'affine:bookmark':
        assertType<BookmarkBlockModel>(block);
        return html`
          <span class="icon">${BookmarkIcon}</span>
          <span class="text"
            >${block.bookmarkTitle || block.url || 'Bookmark'}</span
          >
        `;
      case 'affine:code':
        assertType<CodeBlockModel>(block);
        return html`
          <span class="icon">${CodeBlockIcon}</span>
          <span class="text">${block.language}</span>
        `;
      case 'affine:database':
        assertType<DatabaseBlockModel>(block);
        return html`
          <span class="icon">${DatabaseTableViewIcon}</span>
          <span class="text">${block.title || 'Database'}</span>
        `;
      case 'affine:image':
        assertType<ImageBlockModel>(block);
        return html`
          <span class="icon">${ImageIcon}</span>
          <span class="text">${block.caption || ''}</span>
        `;
      case 'affine:attachment':
        assertType<AttachmentBlockModel>(block);
        return html`
          <span class="icon">${AttachmentIcon}</span>
          <span class="text">${block.name}</span>
        `;
      case 'affine:data-view':
        assertType<DataViewBlockModel>(block);
        return html`
          <span class="icon">${DatabaseKanbanViewIcon}</span>
          <span class="text">Database View</span>
        `;
      case 'affine:divider':
        assertType<DividerBlockModel>(block);
        return html`
          <span class="icon">${DividerIcon}</span>
          <span class="text">Divider</span>
        `;
      default:
        return block.type;
    }
  }

  override render() {
    return html`<div class="edgeless-toc-block-preview">
      ${this.renderBlockByFlavour()}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-toc-block-preview': TOCBlockPreview;
  }
}
