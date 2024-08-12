import type { BlockComponent } from '@blocksuite/block-std';
import type { InlineRange } from '@blocksuite/inline';

import { BLOCK_ID_ATTR } from '@blocksuite/affine-shared/consts';
import { isInsideBlockByFlavour } from '@blocksuite/affine-shared/utils';
import { WithDisposable } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { computePosition, inline, offset, shift } from '@floating-ui/dom';
import { effect } from '@lit-labs/preact-signals';
import { LitElement, html, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { join } from 'lit/directives/join.js';
import { repeat } from 'lit/directives/repeat.js';

import type { AffineInlineEditor } from '../../affine-inline-specs.js';
import type { RefNodeSlots } from './types.js';

import {
  CenterPeekIcon,
  DeleteIcon,
  ExpandFullSmallIcon,
  MoreVerticalIcon,
  OpenIcon,
  SmallArrowDownIcon,
} from '../../../../../icons/index.js';
import { isPeekable, peek } from '../../../../../peek/index.js';
import {
  type Action,
  renderActions,
  renderToolbarSeparator,
} from '../../../../../toolbar/index.js';
import { styles } from './styles.js';

@customElement('reference-popup')
export class ReferencePopup extends WithDisposable(LitElement) {
  static override styles = styles;

  private _convertToCardView() {
    const block = this.block;
    const doc = block.host.doc;
    const parent = doc.getParent(block.model);
    assertExists(parent);

    const index = parent.children.indexOf(block.model);
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
      doc.deleteBlock(block.model);
    } else {
      this.inlineEditor.insertText(this.targetInlineRange, this.docTitle);
    }

    this.abortController.abort();
  }

  private _convertToEmbedView() {
    const block = this.block;
    const doc = block.host.doc;
    const parent = doc.getParent(block.model);
    assertExists(parent);

    const index = parent.children.indexOf(block.model);
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
      doc.deleteBlock(block.model);
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

  get _embedViewButtonDisabled() {
    if (
      this.block.doc.readonly ||
      isInsideBlockByFlavour(
        this.block.doc,
        this.block.model,
        'affine:edgeless-text'
      )
    ) {
      return true;
    }
    return (
      !!this.block.closest('affine-embed-synced-doc-block') ||
      this.referenceDocId === this.doc.id
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

  get _openButtonDisabled() {
    return this.referenceDocId === this.doc.id;
  }

  private _openDoc() {
    const refDocId = this.referenceDocId;
    const block = this.block;
    if (refDocId === block.doc.id) return;
    const rootId = block.doc.root?.id;
    if (!rootId) return;

    const rootComponent = this.std.view.getBlock(rootId) as BlockComponent & {
      slots: RefNodeSlots;
    };
    if (!rootComponent) return;

    rootComponent.slots.docLinkClicked.emit({ docId: refDocId });
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
        <div data-size="large" data-orientation="vertical">
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

  private _viewMenuButton() {
    // synced doc entry controlled by awareness flag
    const isSyncedDocEnabled = this.doc.awarenessStore.getFlag(
      'enable_synced_doc_block'
    );

    const buttons = [];

    buttons.push({
      type: 'inline',
      name: 'Inline view',
    });

    buttons.push({
      type: 'card',
      name: 'Card view',
      handler: () => this._convertToCardView(),
    });

    if (isSyncedDocEnabled) {
      buttons.push({
        type: 'embed',
        name: 'Embed view',
        handler: () => this._convertToEmbedView(),
        disabled: this._embedViewButtonDisabled,
      });
    }

    return html`
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
        <div data-size="small" data-orientation="vertical">
          ${repeat(
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
          )}
        </div>
      </editor-menu-button>
    `;
  }

  override connectedCallback() {
    super.connectedCallback();

    if (this.targetInlineRange.length === 0) {
      return;
    }

    const parent = this.block.host.doc.getParent(this.block.model);
    assertExists(parent);

    this.disposables.add(
      effect(() => {
        const children = parent.children;
        if (children.includes(this.block.model)) return;
        this.abortController.abort();
      })
    );
  }

  override render() {
    const buttons = [
      this._openMenuButton(),

      this._viewMenuButton(),

      html`
        <editor-menu-button
          .contentPadding=${'8px'}
          .button=${html`
            <editor-icon-button aria-label="More" .tooltip=${'More'}>
              ${MoreVerticalIcon}
            </editor-icon-button>
          `}
        >
          <div data-size="large" data-orientation="vertical">
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

  get block() {
    const block = this.inlineEditor.rootElement.closest<BlockComponent>(
      `[${BLOCK_ID_ATTR}]`
    );
    assertExists(block);
    return block;
  }

  get doc() {
    const doc = this.block.doc;
    assertExists(doc);
    return doc;
  }

  get referenceDocId() {
    const docId = this.inlineEditor.getFormat(this.targetInlineRange).reference
      ?.pageId;
    assertExists(docId);
    return docId;
  }

  get std() {
    const std = this.block.std;
    assertExists(std);
    return std;
  }

  @property({ attribute: false })
  accessor abortController!: AbortController;

  @property({ attribute: false })
  accessor docTitle!: string;

  @property({ attribute: false })
  accessor inlineEditor!: AffineInlineEditor;

  @query('.affine-reference-popover-container')
  accessor popupContainer!: HTMLDivElement;

  @property({ attribute: false })
  accessor target!: LitElement;

  @property({ attribute: false })
  accessor targetInlineRange!: InlineRange;
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
