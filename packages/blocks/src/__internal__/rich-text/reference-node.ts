import { FontLinkedPageIcon, FontPageIcon } from '@blocksuite/global/config';
import type { Slot } from '@blocksuite/global/utils';
import { assertExists } from '@blocksuite/global/utils';
import type { Page, PageMeta } from '@blocksuite/store';
import {
  type DeltaInsert,
  ZERO_WIDTH_NON_JOINER,
  ZERO_WIDTH_SPACE,
} from '@blocksuite/virgo';
import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import {
  type BlockHost,
  getModelByElement,
  ShadowlessElement,
  WithDisposable,
} from '../utils/index.js';
import { affineTextStyles } from './virgo/affine-text.js';
import type { AffineTextAttributes } from './virgo/types.js';

export const REFERENCE_NODE = ' ';
const DEFAULT_PAGE_NAME = 'Untitled';

export type RefNodeSlots = {
  pageLinkClicked: Slot<{ pageId: string; blockId?: string }>;
};

@customElement('affine-reference')
export class AffineReference extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .affine-reference {
      white-space: nowrap;
      word-break: break-word;
      color: var(--affine-link-color);
      fill: var(--affine-link-color);
      border-radius: 2px;
      text-decoration: none;
      cursor: pointer;
      user-select: none;
      padding: 0 2px;
      margin: 0 2px;
    }
    .affine-reference:hover {
      background: var(--affine-hover-color);
    }

    .affine-reference > svg {
      margin-right: 4px;
    }

    .affine-reference > span {
      white-space: break-spaces;
    }

    .affine-reference-title {
      color: var(--affine-text-primary-color);
    }
    .affine-reference-title::before {
      content: attr(data-title);
      color: var(--affine-link-color);
    }
  `;

  @property({ type: Object })
  delta: DeltaInsert<AffineTextAttributes> = {
    insert: ZERO_WIDTH_SPACE,
    attributes: {},
  };

  @property()
  host!: BlockHost;

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
    const model = getModelByElement(this);
    const page = model.page;

    this._updateRefMeta(page);
    this._disposables.add(
      model.page.workspace.slots.pagesUpdated.on(() =>
        this._updateRefMeta(page)
      )
    );

    // TODO fix User may create a subpage ref node by paste or undo/redo.
  }

  private _updateRefMeta = (page: Page) => {
    const refAttribute = this.delta.attributes?.reference;
    assertExists(refAttribute, 'Failed to get reference attribute!');
    this._refAttribute = refAttribute;
    this._refMeta = page.workspace.meta.pageMetas.find(
      page => page.id === refAttribute.pageId
    );
  };

  private _onClick(e: MouseEvent) {
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
    this.host.slots.pageLinkClicked.emit({ pageId: targetPageId });
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
            fill: 'var(--affine-text-disable-color)',
          }
        : {}
    );

    // Sine reference title should not be edit by user,
    // we set it into the `::before` pseudo element.
    //
    // There are some issues if you try to turn off the `contenteditable` attribute in the title node:
    //   - the cursor may invisible when trying to move across the reference node using the keyboard
    //
    // see also [HTML contenteditable with non-editable islands](https://stackoverflow.com/questions/14615551/html-contenteditable-with-non-editable-islands)
    //
    // The virgo will skip the zero-width space when calculating the cursor position,
    // so we use a other zero-width symbol to make the cursor work correctly.

    // This node is under contenteditable="true",
    // so we should not add any extra white space between HTML tags

    return html`<span
      class="affine-reference"
      style=${style}
      @click=${this._onClick}
      >${type === 'LinkedPage' ? FontLinkedPageIcon : FontPageIcon}<span
        class="affine-reference-title"
        data-title=${title || DEFAULT_PAGE_NAME}
        data-virgo-text="true"
        data-virgo-text-value=${ZERO_WIDTH_NON_JOINER}
        >${ZERO_WIDTH_NON_JOINER}</span
      ></span
    >`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-reference': AffineReference;
  }
}
