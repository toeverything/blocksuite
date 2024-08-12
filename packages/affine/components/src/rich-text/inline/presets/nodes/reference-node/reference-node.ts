import type { RootBlockModel } from '@blocksuite/affine-model';
import type { BlockComponent } from '@blocksuite/block-std';
import type { Doc, DocMeta } from '@blocksuite/store';

import { BLOCK_ID_ATTR } from '@blocksuite/affine-shared/consts';
import {
  getModelByElement,
  getRootByElement,
} from '@blocksuite/affine-shared/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import {
  type DeltaInsert,
  INLINE_ROOT_ATTR,
  type InlineRootElement,
  ZERO_WIDTH_NON_JOINER,
  ZERO_WIDTH_SPACE,
} from '@blocksuite/inline';
import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ref } from 'lit/directives/ref.js';

import type { AffineTextAttributes } from '../../affine-inline-specs.js';
import type { ReferenceNodeConfig } from './reference-config.js';
import type { RefNodeSlots } from './types.js';

import { HoverController } from '../../../../../hover/index.js';
import { FontDocIcon, FontLinkedDocIcon } from '../../../../../icons/index.js';
import { Peekable } from '../../../../../peek/index.js';
import { affineTextStyles } from '../affine-text.js';
import { DEFAULT_DOC_NAME, REFERENCE_NODE } from '../consts.js';
import { toggleReferencePopup } from './reference-popup.js';

@customElement('affine-reference')
@Peekable({ action: false })
export class AffineReference extends WithDisposable(ShadowlessElement) {
  private _refAttribute: NonNullable<AffineTextAttributes['reference']> = {
    type: 'LinkedPage',
    pageId: '0',
  };

  private _updateRefMeta = (doc: Doc) => {
    const refAttribute = this.delta.attributes?.reference;
    assertExists(refAttribute, 'Failed to get reference attribute!');
    this._refAttribute = refAttribute;
    const refMeta = doc.collection.meta.docMetas.find(
      doc => doc.id === refAttribute.pageId
    );
    this.refMeta = refMeta
      ? {
          ...refMeta,
        }
      : undefined;
  };

  private _whenHover: HoverController = new HoverController(
    this,
    ({ abortController }) => {
      if (this.doc.readonly || this.closest('.prevent-reference-popup')) {
        return null;
      }

      const selection = this.std.selection;
      const textSelection = selection.find('text');
      if (
        !!textSelection &&
        (!!textSelection.to || !!textSelection.from.length)
      ) {
        return null;
      }

      const blockSelections = selection.filter('block');
      if (blockSelections.length) {
        return null;
      }

      return {
        template: toggleReferencePopup(
          this,
          this.inlineEditor,
          this.selfInlineRange,
          this.refMeta?.title ?? DEFAULT_DOC_NAME,
          abortController
        ),
      };
    },
    { enterDelay: 500 }
  );

  static override styles = css`
    .affine-reference {
      white-space: normal;
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
  `;

  private _onClick() {
    if (!this.config.interactable) return;

    const refMeta = this.refMeta;
    const model = getModelByElement(this);
    if (!refMeta) {
      // The doc is deleted
      console.warn('The doc is deleted', this._refAttribute.pageId);
      return;
    }
    if (!model || refMeta.id === model.doc.id) {
      // the doc is the current doc.
      return;
    }
    const targetDocId = refMeta.id;
    const rootComponent = getRootByElement(
      this
    ) as BlockComponent<RootBlockModel> & { slots: RefNodeSlots };
    rootComponent.slots.docLinkClicked.emit({ docId: targetDocId });
  }

  override connectedCallback() {
    super.connectedCallback();

    assertExists(this.config, '`reference-node` need `ReferenceNodeConfig`.');

    if (this.delta.insert !== REFERENCE_NODE) {
      console.error(
        `Reference node must be initialized with '${REFERENCE_NODE}', but got '${this.delta.insert}'`
      );
    }

    const doc = this.doc;
    this._disposables.add(
      doc.collection.slots.docUpdated.on(() => this._updateRefMeta(doc))
    );

    this.updateComplete
      .then(() => {
        // observe yText update
        this.disposables.add(
          this.inlineEditor.slots.textChange.on(() => this._updateRefMeta(doc))
        );
      })
      .catch(console.error);
  }

  override render() {
    const refMeta = this.refMeta;
    const isDeleted = !refMeta;

    const attributes = this.delta.attributes;
    assertExists(attributes, 'Failed to get attributes!');

    const type = attributes.reference?.type;
    assertExists(type, 'Unable to get reference type!');

    const title = this.customTitle
      ? this.customTitle(this)
      : isDeleted
        ? 'Deleted doc'
        : refMeta.title.length > 0
          ? refMeta.title
          : DEFAULT_DOC_NAME;
    const icon = this.customIcon
      ? this.customIcon(this)
      : type === 'LinkedPage'
        ? FontLinkedDocIcon
        : FontDocIcon;

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

    const content = this.customContent
      ? this.customContent(this)
      : html`${icon}<span data-title=${title} class="affine-reference-title"
            >${title}</span
          >`;

    // we need to add `<v-text .str=${ZERO_WIDTH_NON_JOINER}></v-text>` in an
    // embed element to make sure inline range calculation is correct
    return html`<span
      ${this.config.interactable ? ref(this._whenHover.setReference) : ''}
      data-selected=${this.selected}
      class="affine-reference"
      style=${style}
      @click=${this._onClick}
      >${content}<v-text .str=${ZERO_WIDTH_NON_JOINER}></v-text
    ></span>`;
  }

  override willUpdate(_changedProperties: Map<PropertyKey, unknown>) {
    super.willUpdate(_changedProperties);

    const doc = this.doc;
    this._updateRefMeta(doc);
  }

  get block() {
    const block = this.inlineEditor.rootElement.closest<BlockComponent>(
      `[${BLOCK_ID_ATTR}]`
    );
    assertExists(block);
    return block;
  }

  get customContent() {
    return this.config.customContent;
  }

  get customIcon() {
    return this.config.customIcon;
  }

  get customTitle() {
    return this.config.customTitle;
  }

  get doc() {
    const doc = this.config.doc;
    assertExists(doc, '`reference-node` need `Doc`.');
    return doc;
  }

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

  get std() {
    const std = this.block.std;
    assertExists(std);
    return std;
  }

  @property({ attribute: false })
  accessor config!: ReferenceNodeConfig;

  @property({ type: Object })
  accessor delta: DeltaInsert<AffineTextAttributes> = {
    insert: ZERO_WIDTH_SPACE,
    attributes: {},
  };

  // Since the linked doc may be deleted, the `_refMeta` could be undefined.
  @state()
  accessor refMeta: DocMeta | undefined = undefined;

  @property({ type: Boolean })
  accessor selected = false;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-reference': AffineReference;
  }
}
