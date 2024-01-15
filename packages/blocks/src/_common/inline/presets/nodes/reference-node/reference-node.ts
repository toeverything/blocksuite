import type { Slot } from '@blocksuite/global/utils';
import { assertExists } from '@blocksuite/global/utils';
import {
  type DeltaInsert,
  INLINE_ROOT_ATTR,
  type InlineRootElement,
  ZERO_WIDTH_NON_JOINER,
  ZERO_WIDTH_SPACE,
} from '@blocksuite/inline';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { Page, PageMeta } from '@blocksuite/store';
import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ref } from 'lit/directives/ref.js';

import type { PageBlockComponent } from '../../../../../page-block/types.js';
import { HoverController } from '../../../../components/hover/controller.js';
import { FontLinkedPageIcon, FontPageIcon } from '../../../../icons/text.js';
import {
  getModelByElement,
  getPageByElement,
} from '../../../../utils/query.js';
import type { AffineTextAttributes } from '../../affine-inline-specs.js';
import { affineTextStyles } from '../affine-text.js';
import { DEFAULT_PAGE_NAME, REFERENCE_NODE } from '../consts.js';
import type { ReferenceNodeConfig } from './reference-config.js';
import { toggleReferencePopup } from './reference-popup.js';

export type RefNodeSlots = {
  pageLinkClicked: Slot<{ pageId: string; blockId?: string }>;
  tagClicked: Slot<{ tagId: string }>;
};
@customElement('affine-reference')
export class AffineReference extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .affine-reference {
      white-space: nowrap;
      word-break: break-word;
      color: var(--affine-text-primary-color);
      fill: var(--affine-icon-color);
      border-radius: 4px;
      text-decoration: none;
      cursor: pointer;
      user-select: none;
      padding: 1px 2px 1px 0;
    }
    .affine-reference:hover {
      background: var(--affine-hover-color);
    }

    .affine-reference[data-selected='true'] {
      background: var(--affine-hover-color);
    }

    .affine-reference-title {
      margin-left: 4px;
      border-bottom: 0.5px solid var(--affine-divider-color);
      transition: border 0.2s ease-out;
    }
    .affine-reference-title:hover {
      border-bottom: 0.5px solid var(--affine-icon-color);
    }

    .affine-reference > span {
      white-space: break-spaces;
    }
  `;

  @property({ type: Object })
  delta: DeltaInsert<AffineTextAttributes> = {
    insert: ZERO_WIDTH_SPACE,
    attributes: {},
  };

  @property({ type: Boolean })
  selected = false;

  @property({ attribute: false })
  config!: ReferenceNodeConfig;

  // Since the linked page may be deleted, the `_refMeta` could be undefined.
  @state()
  private _refMeta?: PageMeta;

  private _refAttribute: NonNullable<AffineTextAttributes['reference']> = {
    type: 'LinkedPage',
    pageId: '0',
  };

  get inlineEditor() {
    const inlineRoot = this.closest<InlineRootElement<AffineTextAttributes>>(
      `[${INLINE_ROOT_ATTR}]`
    );
    assertExists(inlineRoot);
    return inlineRoot.inlineEditor;
  }

  get selfInlineRange() {
    const selfInlineRange = this.inlineEditor.getInlineRangeFromElement(this);
    assertExists(selfInlineRange);
    return selfInlineRange;
  }

  get page() {
    const page = this.config.page;
    assertExists(page, '`reference-node` need `Page`.');
    return page;
  }

  get customIcon() {
    return this.config.customIcon;
  }

  get customTitle() {
    return this.config.customTitle;
  }

  get customContent() {
    return this.config.customContent;
  }

  override connectedCallback() {
    super.connectedCallback();

    assertExists(this.config, '`reference-node` need `ReferenceNodeConfig`.');

    if (this.delta.insert !== REFERENCE_NODE) {
      console.error(
        `Reference node must be initialized with '${REFERENCE_NODE}', but got '${this.delta.insert}'`
      );
    }

    const page = this.page;
    this._updateRefMeta(page);
    this._disposables.add(
      page.workspace.slots.pagesUpdated.on(() => this._updateRefMeta(page))
    );

    // observe yText update
    this.disposables.add(
      this.inlineEditor.slots.textChange.on(() => this._updateRefMeta(page))
    );
  }

  private _updateRefMeta = (page: Page) => {
    const refAttribute = this.delta.attributes?.reference;
    assertExists(refAttribute, 'Failed to get reference attribute!');
    this._refAttribute = refAttribute;
    const refMeta = page.workspace.meta.pageMetas.find(
      page => page.id === refAttribute.pageId
    );
    this._refMeta = refMeta
      ? {
          ...refMeta,
        }
      : undefined;
  };

  private _onClick() {
    const refMeta = this._refMeta;
    const model = getModelByElement(this);
    if (!refMeta) {
      // The page is deleted
      console.warn('The page is deleted', this._refAttribute.pageId);
      return;
    }
    if (refMeta.id === model.page.id) {
      // the page is the current page.
      return;
    }
    const targetPageId = refMeta.id;
    const root = model.page.root;
    assertExists(root);
    const pageElement = getPageByElement(this) as PageBlockComponent;
    assertExists(pageElement);
    pageElement.slots.pageLinkClicked.emit({ pageId: targetPageId });
  }

  private _whenHover = new HoverController(this, ({ abortController }) => {
    return {
      template: toggleReferencePopup(
        this.inlineEditor,
        this.selfInlineRange,
        this._refMeta?.title ?? DEFAULT_PAGE_NAME,
        abortController
      ),
    };
  });

  override render() {
    const refMeta = this._refMeta;
    const isDeleted = !refMeta;

    const attributes = this.delta.attributes;
    assertExists(attributes, 'Failed to get attributes!');

    const type = attributes.reference?.type;
    assertExists(type, 'Unable to get reference type!');

    const title =
      this.customTitle ??
      (isDeleted
        ? 'Deleted page'
        : refMeta.title.length > 0
          ? refMeta.title
          : DEFAULT_PAGE_NAME);
    const icon =
      this.customIcon ??
      (type === 'LinkedPage' ? FontLinkedPageIcon : FontPageIcon);

    const style = affineTextStyles(
      attributes,
      isDeleted
        ? {
            color: 'var(--affine-text-disable-color)',
            textDecoration: 'line-through',
            fill: 'var(--affine-text-disable-color)',
          }
        : {}
    );

    const content =
      this.customContent ??
      html`${icon}<span data-title=${title} class="affine-reference-title"
          >${title}</span
        >`;

    // we need to add `<v-text .str=${ZERO_WIDTH_NON_JOINER}></v-text>` in an
    // embed element to make sure inline range calculation is correct
    return html`<span
      ${ref(this._whenHover.setReference)}
      data-selected=${this.selected}
      class="affine-reference"
      style=${style}
      @click=${this._onClick}
      >${content}<v-text .str=${ZERO_WIDTH_NON_JOINER}></v-text
    ></span>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-reference': AffineReference;
  }
}
