import type { ReferenceInfo } from '@blocksuite/affine-model';
import type { AffineTextAttributes } from '@blocksuite/affine-shared/types';
import type { Doc, DocMeta } from '@blocksuite/store';

import { DocDisplayMetaProvider } from '@blocksuite/affine-shared/services';
import {
  cloneReferenceInfo,
  referenceToNode,
} from '@blocksuite/affine-shared/utils';
import {
  BLOCK_ID_ATTR,
  type BlockComponent,
  ShadowlessElement,
} from '@blocksuite/block-std';
import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import { WithDisposable } from '@blocksuite/global/utils';
import { LinkedPageIcon } from '@blocksuite/icons/lit';
import {
  type DeltaInsert,
  INLINE_ROOT_ATTR,
  type InlineRootElement,
  ZERO_WIDTH_NON_JOINER,
  ZERO_WIDTH_SPACE,
} from '@blocksuite/inline';
import { css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { ref } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { ReferenceNodeConfigProvider } from './reference-config.js';

import { HoverController } from '../../../../../hover/index.js';
import { Peekable } from '../../../../../peek/index.js';
import { RefNodeSlotsProvider } from '../../../../extension/index.js';
import { affineTextStyles } from '../affine-text.js';
import { DEFAULT_DOC_NAME, REFERENCE_NODE } from '../consts.js';
import { toggleReferencePopup } from './reference-popup.js';

@Peekable({ action: false })
export class AffineReference extends WithDisposable(ShadowlessElement) {
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

  private _updateRefMeta = (doc: Doc) => {
    const refAttribute = this.delta.attributes?.reference;
    if (!refAttribute) {
      return;
    }

    const refMeta = doc.collection.meta.docMetas.find(
      doc => doc.id === refAttribute.pageId
    );
    this.refMeta = refMeta
      ? {
          ...refMeta,
        }
      : undefined;
  };

  // Since the linked doc may be deleted, the `_refMeta` could be undefined.
  @state()
  accessor refMeta: DocMeta | undefined = undefined;

  private _whenHover: HoverController = new HoverController(
    this,
    ({ abortController }) => {
      if (
        this.config.hidePopup ||
        this.doc?.readonly ||
        this.closest('.prevent-reference-popup') ||
        !this.selfInlineRange ||
        !this.inlineEditor
      ) {
        return null;
      }

      const selection = this.std?.selection;
      if (!selection) {
        return null;
      }
      const textSelection = selection.find('text');
      if (!!textSelection && !textSelection.isCollapsed()) {
        return null;
      }

      const blockSelections = selection.filter('block');
      if (blockSelections.length) {
        return null;
      }

      return {
        template: toggleReferencePopup(
          this,
          this.referenceToNode(),
          this.referenceInfo,
          this.inlineEditor,
          this.selfInlineRange,
          this.refMeta?.title ?? DEFAULT_DOC_NAME,
          abortController
        ),
      };
    },
    { enterDelay: 500 }
  );

  get _icon() {
    const { pageId, params, title } = this.referenceInfo;
    return this.block?.std
      ?.get(DocDisplayMetaProvider)
      .icon(pageId, { params, title, referenced: true }).value;
  }

  get _title() {
    const { pageId, params, title } = this.referenceInfo;
    return (
      title ||
      this.block?.std
        ?.get(DocDisplayMetaProvider)
        .title(pageId, { params, title, referenced: true }).value
    );
  }

  get block() {
    const block = this.inlineEditor?.rootElement.closest<BlockComponent>(
      `[${BLOCK_ID_ATTR}]`
    );
    return block;
  }

  get customContent() {
    return this.config.customContent;
  }

  get doc() {
    const doc = this.config.doc;
    return doc;
  }

  get inlineEditor() {
    const inlineRoot = this.closest<InlineRootElement<AffineTextAttributes>>(
      `[${INLINE_ROOT_ATTR}]`
    );
    return inlineRoot?.inlineEditor;
  }

  get referenceInfo(): ReferenceInfo {
    const reference = this.delta.attributes?.reference;
    const id = this.doc?.id ?? '';
    if (!reference) return { pageId: id };
    return cloneReferenceInfo(reference);
  }

  get selfInlineRange() {
    const selfInlineRange = this.inlineEditor?.getInlineRangeFromElement(this);
    return selfInlineRange;
  }

  get std() {
    const std = this.block?.std;
    if (!std) {
      throw new BlockSuiteError(
        ErrorCode.ValueNotExists,
        'std not found in reference node'
      );
    }
    return std;
  }

  private _onClick() {
    if (!this.config.interactable) return;
    this.std
      .getOptional(RefNodeSlotsProvider)
      ?.docLinkClicked.emit(this.referenceInfo);
  }

  override connectedCallback() {
    super.connectedCallback();

    if (!this.config) {
      console.error('`reference-node` need `ReferenceNodeConfig`.');
      return;
    }

    if (this.delta.insert !== REFERENCE_NODE) {
      console.error(
        `Reference node must be initialized with '${REFERENCE_NODE}', but got '${this.delta.insert}'`
      );
    }

    const doc = this.doc;
    if (doc) {
      this._disposables.add(
        doc.collection.slots.docUpdated.on(() => this._updateRefMeta(doc))
      );
    }

    this.updateComplete
      .then(() => {
        if (!this.inlineEditor || !doc) return;

        // observe yText update
        this.disposables.add(
          this.inlineEditor.slots.textChange.on(() => this._updateRefMeta(doc))
        );
      })
      .catch(console.error);
  }

  // reference to block/element
  referenceToNode() {
    return referenceToNode(this.referenceInfo);
  }

  override render() {
    const refMeta = this.refMeta;
    const isDeleted = !refMeta;

    const attributes = this.delta.attributes;
    const reference = attributes?.reference;
    const type = reference?.type;
    if (!attributes || !type) {
      return nothing;
    }

    const title = this._title;
    const icon = choose(type, [
      ['LinkedPage', () => this._icon],
      [
        'Subpage',
        () =>
          LinkedPageIcon({
            width: '1.25em',
            height: '1.25em',
            style:
              'user-select:none;flex-shrink:0;vertical-align:middle;font-size:inherit;margin-bottom:0.1em;',
          }),
      ],
    ]);

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
      : html`${icon}<span
            data-title=${ifDefined(title)}
            class="affine-reference-title"
            >${title}</span
          >`;

    // we need to add `<v-text .str=${ZERO_WIDTH_NON_JOINER}></v-text>` in an
    // embed element to make sure inline range calculation is correct
    return html`<span
      ${this.config.interactable ? ref(this._whenHover.setReference) : ''}
      data-selected=${this.selected}
      class="affine-reference"
      style=${styleMap(style)}
      @click=${this._onClick}
      >${content}<v-text .str=${ZERO_WIDTH_NON_JOINER}></v-text
    ></span>`;
  }

  override willUpdate(_changedProperties: Map<PropertyKey, unknown>) {
    super.willUpdate(_changedProperties);

    const doc = this.doc;
    if (doc) {
      this._updateRefMeta(doc);
    }
  }

  @property({ attribute: false })
  accessor config!: ReferenceNodeConfigProvider;

  @property({ type: Object })
  accessor delta: DeltaInsert<AffineTextAttributes> = {
    insert: ZERO_WIDTH_SPACE,
    attributes: {},
  };

  @property({ type: Boolean })
  accessor selected = false;
}
