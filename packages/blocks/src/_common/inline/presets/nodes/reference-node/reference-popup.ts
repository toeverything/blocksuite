import { assertExists } from '@blocksuite/global/utils';
import type { InlineRange } from '@blocksuite/inline';
import type { BlockElement } from '@blocksuite/lit';
import { WithDisposable } from '@blocksuite/lit';
import { computePosition, flip, inline, offset, shift } from '@floating-ui/dom';
import { html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import type { PageBlockComponent } from '../../../../../page-block/types.js';
import { createLitPortal } from '../../../../components/portal.js';
import { BLOCK_ID_ATTR } from '../../../../consts.js';
import { MoreVerticalIcon } from '../../../../icons/index.js';
import { EmbedWebIcon, LinkIcon, OpenIcon } from '../../../../icons/text.js';
import type { AffineInlineEditor } from '../../affine-inline-specs.js';
import { ReferencePopupMoreMenu } from './reference-popup-more-menu-popup.js';
import { styles } from './styles.js';

@customElement('reference-popup')
export class ReferencePopup extends WithDisposable(LitElement) {
  static override styles = styles;

  @property({ attribute: false })
  inlineEditor!: AffineInlineEditor;

  @property({ attribute: false })
  targetInlineRange!: InlineRange;

  @property({ attribute: false })
  abortController!: AbortController;

  @query('.affine-reference-popover-container')
  popupContainer!: HTMLDivElement;

  get referencePageId() {
    const pageId = this.inlineEditor.getFormat(this.targetInlineRange).reference
      ?.pageId;
    assertExists(pageId);
    return pageId;
  }

  private _moreMenuAbortController: AbortController | null = null;

  override connectedCallback() {
    super.connectedCallback();

    if (this.targetInlineRange.length === 0) {
      throw new Error('Cannot toggle reference popup on empty range');
    }

    const parent = this.blockElement.host.page.getParent(
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

  private _openPage() {
    const refPageId = this.referencePageId;
    const blockElement = this.blockElement;
    if (refPageId === blockElement.model.page.id) return;

    const pageElement = this.std.view.viewFromPath('block', [
      blockElement.model.page.root?.id ?? '',
    ]) as PageBlockComponent | null;
    assertExists(pageElement);

    pageElement.slots.pageLinkClicked.emit({ pageId: refPageId });
  }

  private _convertToEmbedView() {
    const blockElement = this.blockElement;
    const page = blockElement.host.page;
    const parent = page.getParent(blockElement.model);
    assertExists(parent);

    const index = parent.children.indexOf(blockElement.model);
    const pageId = this.referencePageId;
    page.addBlock('affine:embed-linked-page', { pageId }, parent, index + 1);

    const totalTextLength = this.inlineEditor.yTextLength;
    const inlineTextLength = this.targetInlineRange.length;
    if (totalTextLength === inlineTextLength) {
      page.deleteBlock(blockElement.model);
    } else {
      this.inlineEditor.deleteText(this.targetInlineRange);
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
    const linkPopupMoreMenu = new ReferencePopupMoreMenu();
    linkPopupMoreMenu.abortController = this.abortController;
    linkPopupMoreMenu.inlineEditor = this.inlineEditor;
    linkPopupMoreMenu.targetInlineRange = this.targetInlineRange;

    createLitPortal({
      template: linkPopupMoreMenu,
      container: this.popupContainer,
      computePosition: {
        referenceElement: this.popupContainer,
        placement: 'top-end',
        middleware: [flip(), offset(4)],
        autoUpdate: true,
      },
      abortController: this._moreMenuAbortController,
    });
  }

  override render() {
    return html`
      <div class="overlay-root blocksuite-overlay">
        <div class="affine-reference-popover-container">
          <div class="affine-reference-popover view">
            <icon-button size="32px" @click=${this._openPage}>
              ${OpenIcon}
              <affine-tooltip .offset=${12}
                >${'Click to open page'}</affine-tooltip
              >
            </icon-button>

            <span class="affine-reference-popover-dividing-line"></span>

            <div class="affine-reference-popover-view-selector">
              <icon-button
                size="24px"
                class="affine-reference-popover-view-selector-button link current-view"
                hover="false"
              >
                ${LinkIcon}
                <affine-tooltip .offset=${12}>${'Link view'}</affine-tooltip>
              </icon-button>

              <icon-button
                size="24px"
                class="affine-reference-popover-view-selector-button embed"
                hover="false"
                @click=${() => this._convertToEmbedView()}
              >
                ${EmbedWebIcon}
                <affine-tooltip .offset=${12}>${'Embed view'}</affine-tooltip>
              </icon-button>
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
  inlineEditor: AffineInlineEditor,
  targetInlineRange: InlineRange,
  abortController: AbortController
): ReferencePopup {
  const popup = new ReferencePopup();
  popup.inlineEditor = inlineEditor;
  popup.targetInlineRange = targetInlineRange;
  popup.abortController = abortController;

  document.body.appendChild(popup);

  return popup;
}
