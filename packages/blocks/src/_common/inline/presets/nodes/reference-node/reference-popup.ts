import '../../../../components/toolbar/icon-button.js';
import '../../../../components/toolbar/toolbar.js';
import '../../../../components/tooltip/tooltip.js';
import '../../../../components/button.js';

import type { BlockElement } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { InlineRange } from '@blocksuite/inline';
import { computePosition, inline, offset, shift } from '@floating-ui/dom';
import { html, LitElement, nothing, type TemplateResult } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { join } from 'lit/directives/join.js';
import { repeat } from 'lit/directives/repeat.js';

import type { RootBlockComponent } from '../../../../../root-block/types.js';
import { isPeekable, peek } from '../../../../components/index.js';
import { renderSeparator } from '../../../../components/toolbar/separator.js';
import type { AffineToolbar } from '../../../../components/toolbar/toolbar.js';
import { renderActions } from '../../../../components/toolbar/utils.js';
import { BLOCK_ID_ATTR } from '../../../../consts.js';
import { MoreVerticalIcon } from '../../../../icons/index.js';
import {
  ArrowDownSmallIcon,
  CenterPeekIcon,
  DeleteIcon,
  ExpandFullSmallIcon,
  OpenIcon,
  // SplitViewIcon,
} from '../../../../icons/text.js';
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

  @query('.affine-reference-popover-toolbar')
  accessor popupContainer!: AffineToolbar;

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

  private _openDoc = () => {
    const refDocId = this.referenceDocId;
    const blockElement = this.blockElement;
    if (refDocId === blockElement.doc.id) return;

    const rootElement = this.std.view.viewFromPath('block', [
      blockElement.model.doc.root?.id ?? '',
    ]) as RootBlockComponent | null;
    assertExists(rootElement);

    rootElement.slots.docLinkClicked.emit({ docId: refDocId });
  };

  private _delete = () => {
    if (this.inlineEditor.isValidInlineRange(this.targetInlineRange)) {
      this.inlineEditor.deleteText(this.targetInlineRange);
    }
    this.abortController.abort();
  };

  private _moreActions() {
    return renderActions([
      [
        {
          name: 'Open this doc',
          icon: OpenIcon,
          handler: this._openDoc,
          disabled: this._openButtonDisabled,
        },
      ],

      [
        {
          name: 'Delete',
          icon: DeleteIcon,
          handler: this._delete,
        },
      ],
    ]);
  }

  private _openMenuButton() {
    const buttons = [
      {
        type: 'open-this-doc',
        name: 'Open this doc',
        icon: ExpandFullSmallIcon,
      },

      // {
      //   type: 'open-in-new-tab',
      //   name: 'Open in new tab',
      //   icon: OpenIcon,
      // },

      isPeekable(this.target)
        ? {
            type: 'open-in-center-peek',
            name: 'Open in center peek',
            icon: CenterPeekIcon,
            handler: () => peek(this.target),
          }
        : nothing,

      // {
      //   type: 'open-in-split-view',
      //   name: 'Open in split view',
      //   icon: SplitViewIcon,
      // },
    ].filter(button => button !== nothing) as {
      type: string;
      name: string;
      icon: TemplateResult<1>;
      handler?: () => void;
      disabled?: boolean;
    }[];

    return html`
      <affine-menu-button
        .contentPadding=${'8px'}
        .button=${html`
          <affine-toolbar-icon-button
            aria-label="Open in view"
            .justify=${'space-between'}
            .withHover=${true}
            .labelHeight=${'20px'}
            .iconContainerWidth=${'40px'}
          >
            ${OpenIcon} ${ArrowDownSmallIcon}
          </affine-toolbar-icon-button>
        `}
      >
        <div slot>
          ${repeat(
            buttons,
            button => button.type,
            ({ type, name, icon, handler, disabled }) => html`
              <affine-menu-action
                data-testid=${`link-to-${type}`}
                ?data-selected=${this._viewType === type}
                ?disabled=${disabled}
                @click=${handler}
              >
                ${icon} ${name}
              </affine-menu-action>
            `
          )}
        </div>
      </affine-menu-button>
    `;
  }

  private get _viewType(): 'inline' | 'embed' | 'card' {
    return 'inline';
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

    return html`
      <affine-menu-button
        .contentPadding=${'8px'}
        .button=${html`
          <affine-toolbar-icon-button
            aria-label="View"
            .justify=${'space-between'}
            .withHover=${true}
            .labelHeight=${'20px'}
            .iconContainerWidth=${'110px'}
          >
            <div class="label">
              <span style="text-transform: capitalize">${this._viewType}</span>
              view
            </div>
            ${ArrowDownSmallIcon}
          </affine-toolbar-icon-button>
        `}
      >
        <div slot data-size="small">
          ${repeat(
            buttons,
            button => button.type,
            ({ type, name, handler, disabled }) => html`
              <affine-menu-action
                data-testid=${`link-to-${type}`}
                ?data-selected=${this._viewType === type}
                ?disabled=${disabled}
                @click=${handler}
              >
                ${name}
              </affine-menu-action>
            `
          )}
        </div>
      </affine-menu-button>
    `;
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

      this._viewMenuButton(),

      html`
        <affine-menu-button
          .contentPadding=${'8px'}
          .button=${html`
            <affine-toolbar-icon-button aria-label="More" .tooltip=${'More'}>
              ${MoreVerticalIcon}
            </affine-toolbar-icon-button>
          `}
        >
          <div slot data-size="large">${this._moreActions()}</div>
        </affine-menu-button>
      `,
    ];

    return html`
      <affine-toolbar
        class="affine-reference-popover-container affine-reference-popover-toolbar"
      >
        ${join(buttons, renderSeparator)}
      </affine-toolbar>
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
