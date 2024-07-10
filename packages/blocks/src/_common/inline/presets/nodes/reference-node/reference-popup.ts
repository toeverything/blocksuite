import '../../../../components/toolbar/icon-button.js';
import '../../../../components/toolbar/menu-button.js';
import '../../../../components/toolbar/separator.js';
import '../../../../components/toolbar/toolbar.js';
import '../../../../components/tooltip/tooltip.js';

import type { BlockElement } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { InlineRange } from '@blocksuite/inline';
import { computePosition, inline, offset, shift } from '@floating-ui/dom';
import { html, LitElement, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { join } from 'lit/directives/join.js';
import { repeat } from 'lit/directives/repeat.js';

import type { RootBlockComponent } from '../../../../../root-block/types.js';
import { isPeekable, peek } from '../../../../components/index.js';
import { renderToolbarSeparator } from '../../../../components/toolbar/separator.js';
import {
  type Action,
  renderActions,
} from '../../../../components/toolbar/utils.js';
import { BLOCK_ID_ATTR } from '../../../../consts.js';
import {
  CenterPeekIcon,
  DeleteIcon,
  ExpandFullSmallIcon,
  MoreVerticalIcon,
  OpenIcon,
  SmallArrowDownIcon,
} from '../../../../icons/index.js';
import { isInsideBlockByFlavour } from '../../../../utils/model.js';
import type { AffineInlineEditor } from '../../affine-inline-specs.js';
import { styles } from './styles.js';

@customElement('reference-popup')
export class ReferencePopup extends WithDisposable(LitElement) {
  static override styles = styles;

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

  private _delete() {
    if (this.inlineEditor.isValidInlineRange(this.targetInlineRange)) {
      this.inlineEditor.deleteText(this.targetInlineRange);
    }
    this.abortController.abort();
  }

  private _openMenuButton() {
    const buttons: Action[] = [
      {
        name: 'Open this doc',
        icon: ExpandFullSmallIcon,
        handler: () => this._openDoc(),
        disabled: this._openButtonDisabled,
      },
    ];

    // open in new tab

    if (isPeekable(this.target)) {
      buttons.push({
        name: 'Open in center peek',
        icon: CenterPeekIcon,
        handler: () => peek(this.target),
      });
    }

    // open in split view

    if (buttons.length === 0) {
      return nothing;
    }

    return html`
      <editor-menu-button
        .contentPadding=${'8px'}
        .button=${html`
          <editor-icon-button
            aria-label="Open doc"
            .justify=${'space-between'}
            .labelHeight=${'20px'}
          >
            ${OpenIcon}${SmallArrowDownIcon}
          </editor-icon-button>
        `}
      >
        <div slot data-size="large" data-orientation="vertical">
          ${repeat(
            buttons,
            button => button.name,
            ({ name, icon, handler, disabled }) => html`
              <editor-menu-action
                aria-label=${name}
                ?disabled=${disabled}
                @click=${handler}
              >
                ${icon}<span class="label">${name}</span>
              </editor-menu-action>
            `
          )}
        </div>
      </editor-menu-button>
    `;
  }

  private _viewActions() {
    // synced doc entry controlled by awareness flag
    const isSyncedDocEnabled = this.doc.awarenessStore.getFlag(
      'enable_synced_doc_block'
    );

    const buttons = [];

    buttons.push({
      type: 'inline',
      name: 'Inline view',
    });

    if (isSyncedDocEnabled) {
      buttons.push({
        type: 'embed',
        name: 'Embed view',
        handler: () => this._convertToEmbedView(),
        disabled: this._embedViewButtonDisabled,
      });
    }

    buttons.push({
      type: 'card',
      name: 'Card view',
      handler: () => this._convertToCardView(),
    });

    return repeat(
      buttons,
      button => button.type,
      ({ type, name, handler, disabled }) => html`
        <editor-menu-action
          aria-label=${name}
          data-testid=${`link-to-${type}`}
          ?data-selected=${type === 'inline'}
          ?disabled=${disabled}
          @click=${handler}
        >
          ${name}
        </editor-menu-action>
      `
    );
  }

  private _moreActions() {
    return renderActions([
      [
        {
          type: 'delete',
          name: 'Delete',
          icon: DeleteIcon,
          disabled: this.doc.readonly,
          handler: () => this._delete(),
        },
      ],
    ]);
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
    const buttons = [
      this._openMenuButton(),

      html`
        <editor-menu-button
          .contentPadding=${'8px'}
          .button=${html`
            <editor-icon-button
              aria-label="Switch view"
              .justify=${'space-between'}
              .labelHeight=${'20px'}
              .iconContainerWidth=${'110px'}
            >
              <span class="label">Inline view</span>
              ${SmallArrowDownIcon}
            </editor-icon-button>
          `}
        >
          <div slot data-size="small" data-orientation="vertical">
            ${this._viewActions()}
          </div>
        </editor-menu-button>
      `,

      html`
        <editor-menu-button
          .contentPadding=${'8px'}
          .button=${html`
            <editor-icon-button aria-label="More" .tooltip=${'More'}>
              ${MoreVerticalIcon}
            </editor-icon-button>
          `}
        >
          <div slot data-size="large" data-orientation="vertical">
            ${this._moreActions()}
          </div>
        </editor-menu-button>
      `,
    ];

    return html`
      <div class="overlay-root">
        <div class="affine-reference-popover-container">
          <editor-toolbar class="affine-reference-popover view">
            ${join(
              buttons.filter(button => button !== nothing),
              renderToolbarSeparator
            )}
          </editor-toolbar>
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
