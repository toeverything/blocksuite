import type { Slot } from '@blocksuite/global/utils';
import { assertExists } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { Page, PageMeta } from '@blocksuite/store';
import {
  type DeltaInsert,
  ZERO_WIDTH_NON_JOINER,
  ZERO_WIDTH_SPACE,
} from '@blocksuite/virgo';
import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import {
  FontLinkedPageIcon,
  FontPageIcon,
} from '../../../../../_common/icons/index.js';
import {
  getBlockElementById,
  getClosestBlockElementByElement,
  getModelByElement,
} from '../../../../../_common/utils/index.js';
import type { DocPageBlockComponent } from '../../../../../page-block/doc/doc-page-block.js';
import { DEFAULT_PAGE_NAME, REFERENCE_NODE } from '../../consts.js';
import type { AffineTextAttributes } from '../types.js';
import { affineTextStyles } from './affine-text.js';

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

  // Since the linked page may be deleted, the `_refMeta` could be undefined.
  @state()
  private _refMeta?: PageMeta;

  private _refAttribute: NonNullable<AffineTextAttributes['reference']> = {
    type: 'LinkedPage',
    pageId: '0',
  };

  override connectedCallback() {
    super.connectedCallback();
    if (this.delta.insert !== REFERENCE_NODE) {
      console.error(
        `Reference node must be initialized with '${REFERENCE_NODE}', but got '${this.delta.insert}'`
      );
    }

    const closestBlock = getClosestBlockElementByElement(this);
    if (!closestBlock) return;

    const page = closestBlock.page;

    this._updateRefMeta(page);
    this._disposables.add(
      page.workspace.slots.pagesUpdated.on(() => this._updateRefMeta(page))
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
    const element = getBlockElementById(root?.id) as DocPageBlockComponent;
    assertExists(element);
    element.slots.pageLinkClicked.emit({ pageId: targetPageId });
  }

  override render() {
    const refMeta = this._refMeta;
    const unavailable = !refMeta;
    const title = unavailable
      ? // Maybe the page is deleted
        'Deleted page'
      : refMeta.title;
    const attributes = this.delta.attributes;
    assertExists(attributes, 'Failed to get attributes!');
    const type = attributes.reference?.type;
    assertExists(type, 'Unable to get reference type!');

    const style = affineTextStyles(
      attributes,
      unavailable
        ? {
            color: 'var(--affine-text-disable-color)',
            textDecoration: 'line-through',
            fill: 'var(--affine-text-disable-color)',
          }
        : {}
    );

    // we need to add `<v-text .str=${ZERO_WIDTH_NON_JOINER}></v-text>` in an
    // embed element to make sure virgo range calculation is correct
    return html`<span
      data-selected=${this.selected}
      class="affine-reference"
      style=${style}
      @click=${this._onClick}
      >${type === 'LinkedPage' ? FontLinkedPageIcon : FontPageIcon}<span
        data-title=${title || DEFAULT_PAGE_NAME}
        class="affine-reference-title"
        >${title || DEFAULT_PAGE_NAME}</span
      ><v-text .str=${ZERO_WIDTH_NON_JOINER}></v-text
    ></span>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-reference': AffineReference;
  }
}
