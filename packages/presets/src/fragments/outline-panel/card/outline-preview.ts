import { WithDisposable } from '@blocksuite/block-std';
import type {
  AffineTextAttributes,
  AttachmentBlockModel,
  BookmarkBlockModel,
  CodeBlockModel,
  DatabaseBlockModel,
  ImageBlockModel,
  ListBlockModel,
  ParagraphBlockModel,
} from '@blocksuite/blocks';
import { BlocksUtils } from '@blocksuite/blocks';
import { DisposableGroup, noop } from '@blocksuite/global/utils';
import type { DeltaInsert } from '@blocksuite/inline';
import { css, html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';

import { SmallLinkedDocIcon } from '../../_common/icons.js';
import { headingKeys, placeholderMap, previewIconMap } from '../config.js';

type ValuesOf<T, K extends keyof T = keyof T> = T[K];

function assertType<T>(value: unknown): asserts value is T {
  noop(value);
}

const styles = css`
  :host {
    display: block;
    width: 100%;
  }

  .outline-block-preview {
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
    height: 24px;
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

  .outline-block-preview:not(:has(span)) {
    display: none;
  }

  .text span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .linked-doc-preview svg {
    width: 1.1em;
    height: 1.1em;
    vertical-align: middle;
    font-size: inherit;
    margin-bottom: 0.1em;
  }

  .linked-doc-text {
    font-size: inherit;
    border-bottom: 0.5px solid var(--affine-divider-color);
    white-space: break-spaces;
    margin-right: 2px;
  }

  .linked-doc-preview.unavailable svg {
    color: var(--affine-text-disable-color);
  }

  .linked-doc-preview.unavailable .linked-doc-text {
    color: var(--affine-text-disable-color);
    text-decoration: line-through;
  }
`;

export class OutlineBlockPreview extends WithDisposable(LitElement) {
  static override styles = styles;

  private _textDisposables: DisposableGroup | null = null;

  @property({ attribute: false })
  accessor block!: ValuesOf<BlockSuite.BlockModels>;

  @property({ attribute: false })
  accessor showPreviewIcon!: boolean;

  @property({ attribute: false })
  accessor enableNotesSorting!: boolean;

  @property({ attribute: false })
  accessor disabledIcon = false;

  @property({ attribute: false })
  accessor cardNumber!: number;

  private _clearTextDisposables = () => {
    this._textDisposables?.dispose();
    this._textDisposables = null;
  };

  private _setTextDisposables = (block: ValuesOf<BlockSuite.BlockModels>) => {
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

  private _TextBlockPreview(block: ParagraphBlockModel | ListBlockModel) {
    const deltas: DeltaInsert<AffineTextAttributes>[] =
      block.text.yText.toDelta();
    if (!deltas?.length) return nothing;
    const iconClass = this.disabledIcon ? 'icon disabled' : 'icon';

    const previewText = deltas.map(delta => {
      if (delta.attributes?.reference) {
        // If linked doc, render linked doc icon and the doc title.
        const refAttribute = delta.attributes.reference;
        const refMeta = block.doc.collection.meta.docMetas.find(
          doc => doc.id === refAttribute.pageId
        );
        const unavailable = !refMeta;
        const title = unavailable ? 'Deleted doc' : refMeta.title;
        return html`<span
          class="linked-doc-preview ${unavailable ? 'unavailable' : ''}"
          >${SmallLinkedDocIcon}
          <span class="linked-doc-text"
            >${title.length ? title : 'Untitled'}</span
          ></span
        >`;
      } else {
        // If not linked doc, render the text.
        return delta.insert.toString().trim().length > 0
          ? html`<span>${delta.insert.toString()}</span>`
          : nothing;
      }
    });

    return html`<span class="text subtype ${block.type}">${previewText}</span>
      ${this.showPreviewIcon
        ? html`<span class=${iconClass}>${previewIconMap[block.type]}</span>`
        : nothing}`;
  }

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

    const isHeadingBlock =
      BlocksUtils.matchFlavours(block, ['affine:paragraph']) &&
      headingKeys.has(block.type);
    if (!this.enableNotesSorting && !isHeadingBlock) return nothing;

    switch (block.flavour as keyof BlockSuite.BlockModels) {
      case 'affine:paragraph':
        assertType<ParagraphBlockModel>(block);
        return this._TextBlockPreview(block);
      case 'affine:list':
        assertType<ListBlockModel>(block);
        return this._TextBlockPreview(block);
      case 'affine:bookmark':
        assertType<BookmarkBlockModel>(block);
        return html`
          <span class="text general"
            >${block.title || block.url || placeholderMap['bookmark']}</span
          >
          ${this.showPreviewIcon
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
          ${this.showPreviewIcon
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
          ${this.showPreviewIcon
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
          ${this.showPreviewIcon
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
          ${this.showPreviewIcon
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
    return html`<div class="outline-block-preview">
      ${this.renderBlockByFlavour()}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'outline-block-preview': OutlineBlockPreview;
  }
}
