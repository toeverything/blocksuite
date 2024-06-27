import '../../../../components/tooltip/tooltip.js';
import '../../../../components/button.js';

import type { BlockElement } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { InlineRange } from '@blocksuite/inline';
import { computePosition, flip, inline, offset, shift } from '@floating-ui/dom';
import { html, LitElement, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import type { RootBlockComponent } from '../../../../../root-block/types.js';
import { isPeekable, peek } from '../../../../components/index.js';
import { createLitPortal } from '../../../../components/portal.js';
import { BLOCK_ID_ATTR } from '../../../../consts.js';
import { BookmarkIcon, MoreVerticalIcon } from '../../../../icons/index.js';
import {
  CenterPeekIcon,
  EmbedWebIcon,
  LinkIcon,
  OpenIcon,
} from '../../../../icons/text.js';
import { isInsideBlockByFlavour } from '../../../../utils/model.js';
import type { AffineInlineEditor } from '../../affine-inline-specs.js';
import { ReferencePopupMoreMenu } from './reference-popup-more-menu-popup.js';
import { styles } from './styles.js';

@customElement('reference-popup')
export class ReferencePopup extends WithDisposable(LitElement) {
  get referenceDocId() {
    const docId = this.inlineEditor.getFormat(this.targetInlineRange).reference
      ?.pageId;
    assertExists(docId);
    return docId;
  }

  get blockElement() {
    const blockElement = this.inlineEditor.rootElement.closest<BlockElement>(
      `[${BLOCK_ID_ATTR}]`
    );
    assertExists(blockElement);
    return blockElement;
  }

  get std() {
    const std = this.blockElement.std;
    assertExists(std);
    return std;
  }

  get doc() {
    const doc = this.blockElement.doc;
    assertExists(doc);
    return doc;
  }

  get _embedViewButtonDisabled() {
    if (
      this.blockElement.doc.readonly ||
      isInsideBlockByFlavour(
        this.blockElement.doc,
        this.blockElement.model,
        'affine:edgeless-text'
      )
    ) {
      return true;
    }
    return (
      !!this.blockElement.closest('affine-embed-synced-doc-block') ||
      this.referenceDocId === this.doc.id
    );
  }

  get _openButtonDisabled() {
    return this.referenceDocId === this.doc.id;
  }

  static override styles = styles;

  private _moreMenuAbortController: AbortController | null = null;

  @property({ attribute: false })
  accessor target!: LitElement;

  @property({ attribute: false })
  accessor inlineEditor!: AffineInlineEditor;

  @property({ attribute: false })
  accessor targetInlineRange!: InlineRange;

  @property({ attribute: false })
  accessor docTitle!: string;

  @property({ attribute: false })
  accessor abortController!: AbortController;

  @query('.affine-reference-popover-container')
  accessor popupContainer!: HTMLDivElement;

  private _openDoc() {
    const refDocId = this.referenceDocId;
    const blockElement = this.blockElement;
    if (refDocId === blockElement.doc.id) return;

    const rootElement = this.std.view.viewFromPath('block', [
      blockElement.doc.root?.id ?? '',
    ]) as RootBlockComponent | null;
    assertExists(rootElement);

    rootElement.slots.docLinkClicked.emit({ docId: refDocId });
  }

  private _convertToCardView() {
    const blockElement = this.blockElement;
    const doc = blockElement.host.doc;
    const parent = doc.getParent(blockElement.model);
    assertExists(parent);

    const index = parent.children.indexOf(blockElement.model);
    const docId = this.referenceDocId;
    doc.addBlock(
      'affine:embed-linked-doc',
      { pageId: docId },
      parent,
      index + 1
    );

    const totalTextLength = this.inlineEditor.yTextLength;
    const inlineTextLength = this.targetInlineRange.length;
    if (totalTextLength === inlineTextLength) {
      doc.deleteBlock(blockElement.model);
    } else {
      this.inlineEditor.insertText(this.targetInlineRange, this.docTitle);
    }

    this.abortController.abort();
  }

  private _convertToEmbedView() {
    const blockElement = this.blockElement;
    const doc = blockElement.host.doc;
    const parent = doc.getParent(blockElement.model);
    assertExists(parent);

    const index = parent.children.indexOf(blockElement.model);
    const docId = this.referenceDocId;
    doc.addBlock(
      'affine:embed-synced-doc',
      { pageId: docId },
      parent,
      index + 1
    );

    const totalTextLength = this.inlineEditor.yTextLength;
    const inlineTextLength = this.targetInlineRange.length;
    if (totalTextLength === inlineTextLength) {
      doc.deleteBlock(blockElement.model);
    } else {
      this.inlineEditor.insertText(this.targetInlineRange, this.docTitle);
    }

    this.abortController.abort();
  }

  private _toggleMoreMenu() {
    if (this._moreMenuAbortController) {
      this._moreMenuAbortController.abort();
      this._moreMenuAbortController = null;
      return;
    }
    this._moreMenuAbortController = new AbortController();
    const referencePopupMoreMenu = new ReferencePopupMoreMenu();
    referencePopupMoreMenu.target = this.target;
    referencePopupMoreMenu.abortController = this.abortController;
    referencePopupMoreMenu.inlineEditor = this.inlineEditor;
    referencePopupMoreMenu.targetInlineRange = this.targetInlineRange;

    createLitPortal({
      template: referencePopupMoreMenu,
      container: this.popupContainer,
      computePosition: {
        referenceElement: this.popupContainer,
        placement: 'top-end',
        middleware: [flip()],
        autoUpdate: true,
      },
      abortController: this._moreMenuAbortController,
    });
  }

  override connectedCallback() {
    super.connectedCallback();

    if (this.targetInlineRange.length === 0) {
      throw new Error('Cannot toggle reference popup on empty range');
    }

    const parent = this.blockElement.host.doc.getParent(
      this.blockElement.model
    );
    assertExists(parent);

    this.disposables.add(
      parent.childrenUpdated.on(() => {
        const children = parent.children;
        if (children.includes(this.blockElement.model)) return;
        this.abortController.abort();
      })
    );
  }

  override updated() {
    assertExists(this.popupContainer);
    const range = this.inlineEditor.toDomRange(this.targetInlineRange);
    assertExists(range);

    const visualElement = {
      getBoundingClientRect: () => range.getBoundingClientRect(),
      getClientRects: () => range.getClientRects(),
    };
    computePosition(visualElement, this.popupContainer, {
      middleware: [
        offset(10),
        inline(),
        shift({
          padding: 6,
        }),
      ],
    })
      .then(({ x, y }) => {
        const popupContainer = this.popupContainer;
        if (!popupContainer) return;
        popupContainer.style.left = `${x}px`;
        popupContainer.style.top = `${y}px`;
      })
      .catch(console.error);
  }

  override render() {
    // synced doc entry controlled by awareness flag
    const isSyncedDocEnabled = this.doc.awarenessStore.getFlag(
      'enable_synced_doc_block'
    );

    return html`
      <div class="overlay-root">
        <div class="affine-reference-popover-container">
          <div class="affine-reference-popover view">
            <icon-button
              size="24px"
              class="affine-reference-popover-open-button"
              @click=${this._openDoc}
              ?disabled=${this._openButtonDisabled}
            >
              ${OpenIcon}
              <affine-tooltip .offset=${12}>${'Open this doc'}</affine-tooltip>
            </icon-button>
            ${isPeekable(this.target)
              ? html`<icon-button
                  size="24px"
                  class="affine-reference-popover-open-button"
                  @click=${() => peek(this.target)}
                >
                  ${CenterPeekIcon}
                  <affine-tooltip .offset=${12}
                    >${'Open in center peek'}</affine-tooltip
                  >
                </icon-button>`
              : nothing}

            <span class="affine-reference-popover-dividing-line"></span>

            <div class="affine-reference-popover-view-selector">
              <icon-button
                size="24px"
                class="affine-reference-popover-view-selector-button link current-view"
                .hover=${false}
              >
                ${LinkIcon}
                <affine-tooltip .offset=${12}>${'Inline view'}</affine-tooltip>
              </icon-button>

              <icon-button
                size="24px"
                class="affine-reference-popover-view-selector-button embed card-view"
                .hover=${false}
                @click=${() => this._convertToCardView()}
              >
                ${BookmarkIcon}
                <affine-tooltip .offset=${12}>${'Card view'}</affine-tooltip>
              </icon-button>

              ${isSyncedDocEnabled
                ? html`
                    <icon-button
                      size="24px"
                      class="affine-reference-popover-view-selector-button embed embed-view"
                      .hover=${false}
                      @click=${() => this._convertToEmbedView()}
                      ?disabled=${this._embedViewButtonDisabled}
                    >
                      ${EmbedWebIcon}
                      <affine-tooltip .offset=${12}
                        >${'Embed view'}</affine-tooltip
                      >
                    </icon-button>
                  `
                : nothing}
            </div>

            <span class="affine-reference-popover-dividing-line"></span>

            <icon-button size="24px" @click=${() => this._toggleMoreMenu()}>
              ${MoreVerticalIcon}
              <affine-tooltip .offset=${12}>More</affine-tooltip>
            </icon-button>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'reference-popup': ReferencePopup;
  }
}

export function toggleReferencePopup(
  target: LitElement,
  inlineEditor: AffineInlineEditor,
  targetInlineRange: InlineRange,
  docTitle: string,
  abortController: AbortController
): ReferencePopup {
  const popup = new ReferencePopup();
  popup.target = target;
  popup.inlineEditor = inlineEditor;
  popup.targetInlineRange = targetInlineRange;
  popup.docTitle = docTitle;
  popup.abortController = abortController;

  document.body.append(popup);

  return popup;
}
