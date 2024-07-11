import '../../../../../components/toolbar/icon-button.js';
import '../../../../../components/toolbar/menu-button.js';
import '../../../../../components/toolbar/separator.js';
import '../../../../../components/toolbar/toolbar.js';
import '../../../../../components/tooltip/tooltip.js';

import type { BlockElement } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { InlineRange } from '@blocksuite/inline/types';
import { computePosition, inline, offset, shift } from '@floating-ui/dom';
import { html, LitElement, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';
import { join } from 'lit/directives/join.js';
import { repeat } from 'lit/directives/repeat.js';

import type { EmbedOptions } from '../../../../../../root-block/root-service.js';
import { toast } from '../../../../../components/toast.js';
import type { EditorIconButton } from '../../../../../components/toolbar/icon-button.js';
import { renderToolbarSeparator } from '../../../../../components/toolbar/separator.js';
import { renderActions } from '../../../../../components/toolbar/utils.js';
import { BLOCK_ID_ATTR } from '../../../../../consts.js';
import {
  ConfirmIcon,
  CopyIcon,
  DeleteIcon,
  EditIcon,
  MoreVerticalIcon,
  OpenIcon,
  SmallArrowDownIcon,
  UnlinkIcon,
} from '../../../../../icons/index.js';
import {
  getHostName,
  isValidUrl,
  normalizeUrl,
} from '../../../../../utils/url.js';
import type { AffineInlineEditor } from '../../../affine-inline-specs.js';
import { linkPopupStyle } from './styles.js';

@customElement('link-popup')
export class LinkPopup extends WithDisposable(LitElement) {
  static override styles = linkPopupStyle;

  private get _rootService() {
    return this.std.spec.getService('affine:page');
  }

  get host() {
    return this.blockElement.host;
  }

  get std() {
    return this.blockElement.std;
  }

  get blockElement() {
    const blockElement = this.inlineEditor.rootElement.closest<BlockElement>(
      `[${BLOCK_ID_ATTR}]`
    );
    assertExists(blockElement);
    return blockElement;
  }

  get currentText() {
    return this.inlineEditor.yTextString.slice(
      this.targetInlineRange.index,
      this.targetInlineRange.index + this.targetInlineRange.length
    );
  }

  get currentLink() {
    const link = this.inlineEditor.getFormat(this.targetInlineRange).link;
    assertExists(link);
    return link;
  }

  private get _isBookmarkAllowed() {
    const blockElement = this.blockElement;
    const schema = blockElement.doc.schema;
    const parent = blockElement.doc.getParent(blockElement.model);
    assertExists(parent);
    const bookmarkSchema = schema.flavourSchemaMap.get('affine:bookmark');
    assertExists(bookmarkSchema);
    const parentSchema = schema.flavourSchemaMap.get(parent.flavour);
    assertExists(parentSchema);

    try {
      schema.validateSchema(bookmarkSchema, parentSchema);
    } catch {
      return false;
    }

    return true;
  }

  private get _canConvertToEmbedView() {
    return this._embedOptions?.viewType === 'embed';
  }

  private _bodyOverflowStyle = '';

  private _embedOptions: EmbedOptions | null = null;

  @property()
  accessor type: 'create' | 'edit' | 'view' = 'create';

  @property({ attribute: false })
  accessor inlineEditor!: AffineInlineEditor;

  @property({ attribute: false })
  accessor targetInlineRange!: InlineRange;

  @property({ attribute: false })
  accessor abortController!: AbortController;

  @query('#text-input')
  accessor textInput: HTMLInputElement | null = null;

  @query('#link-input')
  accessor linkInput: HTMLInputElement | null = null;

  @query('.affine-link-popover-container')
  accessor popupContainer!: HTMLDivElement;

  @query('.mock-selection-container')
  accessor mockSelectionContainer!: HTMLDivElement;

  @query('.affine-confirm-button')
  accessor confirmButton: EditorIconButton | null = null;

  private _onConfirm() {
    if (!this.inlineEditor.isValidInlineRange(this.targetInlineRange)) return;

    assertExists(this.linkInput);
    const linkInputValue = this.linkInput.value;
    if (!linkInputValue || !isValidUrl(linkInputValue)) return;

    const link = normalizeUrl(linkInputValue);

    if (this.type === 'create') {
      this.inlineEditor.formatText(this.targetInlineRange, {
        link: link,
        reference: null,
      });
      this.inlineEditor.setInlineRange(this.targetInlineRange);
      const textSelection = this.host.selection.find('text');
      assertExists(textSelection);
      this.host.rangeManager?.syncTextSelectionToRange(textSelection);
    } else if (this.type === 'edit') {
      const text = this.textInput?.value ?? link;
      this.inlineEditor.insertText(this.targetInlineRange, text, {
        link: link,
        reference: null,
      });
      this.inlineEditor.setInlineRange({
        index: this.targetInlineRange.index,
        length: text.length,
      });
      const textSelection = this.host.selection.find('text');
      assertExists(textSelection);
      this.host.rangeManager?.syncTextSelectionToRange(textSelection);
    }

    this.abortController.abort();
  }

  private _copyUrl() {
    navigator.clipboard.writeText(this.currentLink).catch(console.error);
    toast(this.host, 'Copied link to clipboard');
    this.abortController.abort();
  }

  private _edit = () => {
    this.type = 'edit';
  };

  private _openLink = () => {
    let link = this.currentLink;
    if (!link.match(/^[a-zA-Z]+:\/\//)) {
      link = 'https://' + link;
    }
    window.open(link, '_blank');
    this.abortController.abort();
  };

  private _removeLink = () => {
    if (this.inlineEditor.isValidInlineRange(this.targetInlineRange)) {
      this.inlineEditor.formatText(this.targetInlineRange, {
        link: null,
      });
    }
    this.abortController.abort();
  };

  private _delete = () => {
    if (this.inlineEditor.isValidInlineRange(this.targetInlineRange)) {
      this.inlineEditor.deleteText(this.targetInlineRange);
    }
    this.abortController.abort();
  };

  private _convertToCardView() {
    if (!this.inlineEditor.isValidInlineRange(this.targetInlineRange)) {
      return;
    }

    let targetFlavour = 'affine:bookmark';

    if (this._embedOptions && this._embedOptions.viewType === 'card') {
      targetFlavour = this._embedOptions.flavour;
    }

    const blockElement = this.blockElement;
    const url = this.currentLink;
    const title = this.currentText;
    const props = {
      url,
      title: title === url ? '' : title,
    };
    const doc = blockElement.doc;
    const parent = doc.getParent(blockElement.model);
    assertExists(parent);
    const index = parent.children.indexOf(blockElement.model);
    doc.addBlock(targetFlavour as never, props, parent, index + 1);

    const totalTextLength = this.inlineEditor.yTextLength;
    const inlineTextLength = this.targetInlineRange.length;
    if (totalTextLength === inlineTextLength) {
      doc.deleteBlock(blockElement.model);
    } else {
      this.inlineEditor.formatText(this.targetInlineRange, { link: null });
    }

    this.abortController.abort();
  }

  private _convertToEmbedView() {
    if (!this._embedOptions || this._embedOptions.viewType !== 'embed') {
      return;
    }

    const { flavour } = this._embedOptions;
    const url = this.currentLink;

    const blockElement = this.blockElement;
    const doc = blockElement.doc;
    const parent = doc.getParent(blockElement.model);
    assertExists(parent);
    const index = parent.children.indexOf(blockElement.model);

    doc.addBlock(flavour as never, { url }, parent, index + 1);

    const totalTextLength = this.inlineEditor.yTextLength;
    const inlineTextLength = this.targetInlineRange.length;
    if (totalTextLength === inlineTextLength) {
      doc.deleteBlock(blockElement.model);
    } else {
      this.inlineEditor.formatText(this.targetInlineRange, { link: null });
    }

    this.abortController.abort();
  }

  private _onKeydown(e: KeyboardEvent) {
    e.stopPropagation();
    if (e.key === 'Enter' && !e.isComposing) {
      e.preventDefault();
      this._onConfirm();
    }
  }

  private _updateConfirmBtn() {
    assertExists(this.confirmButton);
    const link = this.linkInput?.value.trim();
    this.confirmButton.disabled = !(link && isValidUrl(link));
    this.confirmButton.requestUpdate();
  }

  private _confirmBtnTemplate() {
    return html`
      <editor-icon-button
        class="affine-confirm-button"
        .iconSize=${'24px'}
        .disabled=${true}
        @click=${this._onConfirm}
      >
        ${ConfirmIcon}
      </editor-icon-button>
    `;
  }

  private _createTemplate = () => {
    this.updateComplete
      .then(() => {
        this.linkInput?.focus();

        this._updateConfirmBtn();
      })
      .catch(console.error);

    return html`
      <div class="affine-link-popover create">
        <input
          id="link-input"
          class="affine-link-popover-input"
          type="text"
          spellcheck="false"
          placeholder="Paste or type a link"
          @input=${this._updateConfirmBtn}
        />
        ${this._confirmBtnTemplate()}
      </div>
    `;
  };

  private _moreActions() {
    return renderActions([
      [
        {
          name: 'Open',
          icon: OpenIcon,
          handler: this._openLink,
        },

        {
          name: 'Copy',
          icon: CopyIcon,
          handler: this._copyUrl,
        },

        {
          name: 'Remove link',
          icon: UnlinkIcon,
          handler: this._removeLink,
        },
      ],

      [
        {
          type: 'delete',
          name: 'Delete',
          icon: DeleteIcon,
          handler: this._delete,
        },
      ],
    ]);
  }

  private _viewMenuButton() {
    if (!this._isBookmarkAllowed) return nothing;

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

    if (this._canConvertToEmbedView) {
      buttons.push({
        type: 'embed',
        name: 'Embed view',
        handler: () => this._convertToEmbedView(),
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
            <div class="label">Inline view</div>
            ${SmallArrowDownIcon}
          </editor-icon-button>
        `}
      >
        <div slot data-size="small" data-orientation="vertical">
          ${repeat(
            buttons,
            button => button.type,
            ({ type, name, handler }) => html`
              <editor-menu-action
                data-testid=${`link-to-${type}`}
                ?data-selected=${type === 'inline'}
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

  private _viewTemplate = () => {
    this._embedOptions = this._rootService.getEmbedBlockOptions(
      this.currentLink
    );

    const buttons = [
      html`
        <a
          class="affine-link-preview"
          href=${this.currentLink}
          rel="noopener noreferrer"
          target="_blank"
        >
          <span>${getHostName(this.currentLink)}</span>
        </a>

        <editor-icon-button
          aria-label="Copy"
          data-testid="copy-link"
          .tooltip=${'Click to copy link'}
          @click=${this._copyUrl}
        >
          ${CopyIcon}
        </editor-icon-button>

        <editor-icon-button
          aria-label="Edit"
          data-testid="edit"
          .tooltip=${'Edit'}
          @click=${this._edit}
        >
          ${EditIcon}
        </editor-icon-button>
      `,

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
          <div slot data-size="large" data-orientation="vertical">
            ${this._moreActions()}
          </div>
        </editor-menu-button>
      `,
    ];

    return html`
      <editor-toolbar class="affine-link-popover view">
        ${join(
          buttons.filter(button => button !== nothing),
          renderToolbarSeparator
        )}
      </editor-toolbar>
    `;
  };

  private _editTemplate = () => {
    this.updateComplete
      .then(() => {
        assertExists(this.textInput);
        this.textInput.value = this.currentText;
        assertExists(this.linkInput);
        this.linkInput.value = this.currentLink;

        this.textInput.select();

        this._updateConfirmBtn();
      })
      .catch(console.error);

    return html`
      <div class="affine-link-edit-popover">
        <div class="affine-edit-area text">
          <input
            class="affine-edit-input"
            id="text-input"
            type="text"
            placeholder="Enter text"
            @input=${this._updateConfirmBtn}
          />
          <label class="affine-edit-label" for="text-input">Text</label>
        </div>
        <div class="affine-edit-area link">
          <input
            id="link-input"
            class="affine-edit-input"
            type="text"
            spellcheck="false"
            placeholder="Paste or type a link"
            @input=${this._updateConfirmBtn}
          />
          <label class="affine-edit-label" for="link-input">Link</label>
        </div>
        ${this._confirmBtnTemplate()}
      </div>
    `;
  };

  protected override firstUpdated() {
    if (!this.linkInput) return;

    this._disposables.addFromEvent(this.linkInput, 'copy', e => {
      e.stopPropagation();
    });
    this._disposables.addFromEvent(this.linkInput, 'cut', e => {
      e.stopPropagation();
    });
    this._disposables.addFromEvent(this.linkInput, 'paste', e => {
      e.stopPropagation();
    });
  }

  override connectedCallback() {
    super.connectedCallback();

    if (this.targetInlineRange.length === 0) {
      throw new Error('Cannot toggle link popup on empty range');
    }

    if (this.type === 'edit' || this.type === 'create') {
      // disable body scroll
      this._bodyOverflowStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      this.disposables.add({
        dispose: () => {
          document.body.style.overflow = this._bodyOverflowStyle;
        },
      });
    }

    const parent = this.blockElement.doc.getParent(this.blockElement.model);
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

    if (this.type !== 'view') {
      const domRects = range.getClientRects();

      Object.values(domRects).forEach(domRect => {
        const mockSelection = document.createElement('div');
        mockSelection.classList.add('mock-selection');
        mockSelection.style.left = `${domRect.left}px`;
        mockSelection.style.top = `${domRect.top}px`;
        mockSelection.style.width = `${domRect.width}px`;
        mockSelection.style.height = `${domRect.height}px`;

        assertExists(this.mockSelectionContainer);
        this.mockSelectionContainer.append(mockSelection);
      });
    }

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
    return html`
      <div class="overlay-root">
        ${this.type === 'view'
          ? nothing
          : html`
              <div
                class="affine-link-popover-overlay-mask"
                @click=${() => {
                  this.abortController.abort();
                  this.host.selection.clear();
                }}
              ></div>
            `}
        <div class="affine-link-popover-container" @keydown=${this._onKeydown}>
          ${choose(this.type, [
            ['create', this._createTemplate],
            ['edit', this._editTemplate],
            ['view', this._viewTemplate],
          ])}
        </div>
        <div class="mock-selection-container"></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'link-popup': LinkPopup;
  }
}
