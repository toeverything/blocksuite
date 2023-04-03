import { FontPageIcon, FontPageSubpageIcon } from '@blocksuite/global/config';
import type { Slot } from '@blocksuite/global/utils';
import { assertExists, DisposableGroup } from '@blocksuite/global/utils';
import type {
  BaseBlockModel,
  DeltaOperation,
  PageMeta,
} from '@blocksuite/store';
import {
  type DeltaInsert,
  ZERO_WIDTH_NON_JOINER,
  ZERO_WIDTH_SPACE,
} from '@blocksuite/virgo';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
  type BlockHost,
  getModelByElement,
  NonShadowLitElement,
} from '../utils/index.js';
import { affineTextStyles } from './virgo/affine-text.js';
import type { AffineTextAttributes } from './virgo/types.js';

export const REFERENCE_NODE = ' ';

export type RefNodeSlots = {
  /**
   * Emit when the subpage is linked to the current page.
   */
  subpageLinked: Slot<{ pageId: string }>;
  /**
   * Emit when the subpage is unlinked from the current page.
   */
  subpageUnlinked: Slot<{ pageId: string }>;
  pageLinkClicked: Slot<{ pageId: string }>;
};

function isRefPageInDelta(delta: DeltaOperation[], pageId: string) {
  if (!delta.length) {
    return false;
  }
  return delta.some(op => {
    return op.attributes?.reference?.pageId === pageId;
  });
}

@customElement('affine-reference')
export class AffineReference extends NonShadowLitElement {
  static styles = css`
    .affine-reference {
      white-space: nowrap;
      word-break: break-word;
      color: var(--affine-link-color);
      fill: var(--affine-link-color);
      border-radius: 2px;
      text-decoration: none;
      cursor: pointer;
      user-select: none;
    }
    .affine-reference:hover {
      background: var(--affine-hover-background);
    }

    .affine-reference > svg {
      margin-right: 4px;
    }

    .affine-reference > span {
      white-space: pre-wrap;
    }

    .affine-reference-title::before {
      content: attr(data-title);
    }
  `;

  @property({ type: Object })
  delta: DeltaInsert<AffineTextAttributes> = {
    insert: ZERO_WIDTH_SPACE,
    attributes: {},
  };

  @property()
  host!: BlockHost<RefNodeSlots>;

  // Since the linked page may be deleted, the `_refMeta` could be undefined.
  private _refMeta?: PageMeta;

  private _model?: BaseBlockModel;

  private _refAttribute: NonNullable<AffineTextAttributes['reference']> = {
    type: 'LinkedPage',
    pageId: '0',
  };

  private _disposables = new DisposableGroup();

  connectedCallback() {
    super.connectedCallback();
    if (this.delta.insert !== REFERENCE_NODE) {
      console.error(
        `Reference node must be initialized with ${REFERENCE_NODE}, but got '${this.delta.insert}'`
      );
    }
    const model = getModelByElement(this);
    this._model = model;
    const refAttribute = this.delta.attributes?.reference;
    assertExists(refAttribute, 'Failed to get reference attribute!');
    this._refAttribute = refAttribute;

    this._refMeta = model.page.workspace.meta.pageMetas.find(
      page => page.id === refAttribute.pageId
    );

    this._disposables.add(
      model.page.workspace.slots.pagesUpdated.on(() => {
        this._refMeta = model.page.workspace.meta.pageMetas.find(
          page => page.id === refAttribute.pageId
        );
      })
    );

    if (refAttribute.type === 'Subpage') {
      if (!this._refMeta) {
        // The subpage is deleted
        console.warn('The subpage is deleted', refAttribute.pageId);
        // TODO remove this node since the subpage not exists.
        return;
      }
      // User may create a subpage ref node by paste or undo/redo.
      this.host.slots.subpageLinked.emit({ pageId: refAttribute.pageId });
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._disposables.dispose();
    if (this._refAttribute.type !== 'Subpage') {
      return;
    }
    const model = this._model;
    assertExists(model, 'Failed to get model!');
    const text = model.text;
    assertExists(text, 'Failed to get text');
    const delta = text.toDelta();

    if (!isRefPageInDelta(delta, this._refAttribute.pageId)) {
      // The subpage is deleted
      this.host.slots.subpageUnlinked.emit({
        pageId: this._refAttribute.pageId,
      });
    }
  }

  private _onClick(e: MouseEvent) {
    e.preventDefault();
    const refMeta = this._refMeta;
    const model = getModelByElement(this);
    if (!refMeta || refMeta.id === model.page.id) {
      return;
    }
    const targetPageId = refMeta.id;
    this.host.slots.pageLinkClicked.emit({ pageId: targetPageId });

    // const editor = getEditorContainer(model.page);
    // editor.page = model.page.workspace.getPage(targetPageId);
  }

  render() {
    const refMeta = this._refMeta;
    const isDisabled = !refMeta;
    if (isDisabled && this._refAttribute.type === 'Subpage') {
      return html`<v-text .str=${this.delta.insert}></v-text>`;
    }
    const title = isDisabled
      ? // Maybe the page is deleted
        'Deleted page'
      : refMeta.title;
    const attributes = this.delta.attributes;
    assertExists(attributes, 'Failed to get attributes!');
    const type = attributes.reference?.type;
    assertExists(type, 'Unable to get reference type!');
    const style = affineTextStyles(attributes);

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
      >${type === 'LinkedPage' ? FontPageSubpageIcon : FontPageIcon}<span
        class="affine-reference-title"
        data-title=${title}
        data-virgo-text="true"
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
