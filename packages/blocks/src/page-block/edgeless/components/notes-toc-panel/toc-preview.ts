import { noop } from '@blocksuite/global/utils';
import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';

import {
  BlockPreviewIcon,
  SmallHeading1Icon,
  SmallHeading2Icon,
  SmallHeading3Icon,
  SmallHeading4Icon,
  SmallHeading5Icon,
  SmallHeading6Icon,
  SmallTextIcon,
} from '../../../../_common/icons/index.js';
import type { BlockModels } from '../../../../_common/utils/model.js';
import type { SurfaceRefBlockModel } from '../../../../index.js';
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

const paragraphIconMap: {
  [key in ParagraphBlockModel['type']]: TemplateResult<1>;
} = {
  quote: BlockPreviewIcon,
  text: SmallTextIcon,
  h1: SmallHeading1Icon,
  h2: SmallHeading2Icon,
  h3: SmallHeading3Icon,
  h4: SmallHeading4Icon,
  h5: SmallHeading5Icon,
  h6: SmallHeading6Icon,
};

export class TOCBlockPreview extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .edgeless-toc-block-preview {
      width: 100%;
      box-sizing: border-box;
      padding: 8px 8px;
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

      font-size: 15px;
      line-height: 24px;
    }

    .text.general,
    .subtype.text,
    .subtype.quote {
      font-weight: 400;
      padding-left: 20px;
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
      padding-left: 8px;
    }
    .subtype.h4 {
      padding-left: 12px;
    }
    .subtype.h5 {
      padding-left: 16px;
    }
    .subtype.h6 {
      padding-left: 20px;
    }
  `;

  @property({ attribute: false })
  block!: ValuesOf<BlockModels>;

  @property({ attribute: false })
  hidePreviewIcon!: boolean;

  @property({ attribute: false })
  disabledIcon = false;

  override connectedCallback(): void {
    super.connectedCallback();

    this._disposables.add(
      this.block.propsUpdated.on(() => this.requestUpdate())
    );
  }

  renderBlockByFlavour() {
    const { block } = this;
    const iconClass = this.disabledIcon ? 'icon disabled' : 'icon';

    switch (block.flavour as keyof BlockModels) {
      case 'affine:paragraph':
        assertType<ParagraphBlockModel>(block);
        return html`
          <span class="text subtype ${block.type}"
            >${block.text.toString().length
              ? block.text.toString()
              : 'placeholder'}</span
          >
          ${!this.hidePreviewIcon
            ? html`<span class=${iconClass}
                >${paragraphIconMap[block.type]}</span
              >`
            : nothing}
        `;
      case 'affine:list':
        assertType<ListBlockModel>(block);
        return html`
          <span class="text general">${block.text.toString()}</span>
          ${!this.hidePreviewIcon
            ? html`<span class=${iconClass}>${BlockPreviewIcon}</span>`
            : nothing}
        `;
      case 'affine:bookmark':
        assertType<BookmarkBlockModel>(block);
        return html`
          <span class="text general"
            >${block.bookmarkTitle || block.url || 'Bookmark'}</span
          >
          ${!this.hidePreviewIcon
            ? html`<span class=${iconClass}>${BlockPreviewIcon}</span>`
            : nothing}
        `;
      case 'affine:code':
        assertType<CodeBlockModel>(block);
        return html`
          <span class="text general">${block.language}</span>
          ${!this.hidePreviewIcon
            ? html`<span class=${iconClass}>${BlockPreviewIcon}</span>`
            : nothing}
        `;
      case 'affine:database':
        assertType<DatabaseBlockModel>(block);
        return html`
          <span class="text general">${block.title || 'Database'}</span>
          ${!this.hidePreviewIcon
            ? html`<span class=${iconClass}>${BlockPreviewIcon}</span>`
            : nothing}
        `;
      case 'affine:image':
        assertType<ImageBlockModel>(block);
        return html`
          <span class="text general">${block.caption || 'Image'}</span>
          ${!this.hidePreviewIcon
            ? html`<span class=${iconClass}>${BlockPreviewIcon}</span>`
            : nothing}
        `;
      case 'affine:attachment':
        assertType<AttachmentBlockModel>(block);
        return html`
          <span class="text general">${block.name}</span>
          ${!this.hidePreviewIcon
            ? html`<span class=${iconClass}>${BlockPreviewIcon}</span>`
            : nothing}
        `;
      case 'affine:data-view':
        assertType<DataViewBlockModel>(block);
        return html`
          <span class="text general">Database View</span>
          ${!this.hidePreviewIcon
            ? html`<span class=${iconClass}>${BlockPreviewIcon}</span>`
            : nothing}
        `;
      case 'affine:divider':
        assertType<DividerBlockModel>(block);
        return html`
          <span class="text general">Divider</span>
          ${!this.hidePreviewIcon
            ? html`<span class=${iconClass}>${BlockPreviewIcon}</span>`
            : nothing}
        `;
      case 'affine:surface-ref':
        assertType<SurfaceRefBlockModel>(block);
        return html`
          <span class="text general"
            >${block.caption ? block.caption : 'Surface-Ref'}</span
          >
          ${!this.hidePreviewIcon
            ? html`<span class=${iconClass}>${BlockPreviewIcon}</span>`
            : nothing}
        `;
      default:
        return block.flavour;
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
