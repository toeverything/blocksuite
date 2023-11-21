import { assertExists } from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';
import { WithDisposable } from '@blocksuite/lit';
import type { VRange } from '@blocksuite/virgo/types';
import { computePosition, inline, offset, shift } from '@floating-ui/dom';
import { html, LitElement, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import {
  isValidUrl,
  normalizeUrl,
} from '../../../../../../../_common/utils/url.js';
import type { BookmarkProps } from '../../../../../../../bookmark-block/bookmark-model.js';
import { allowEmbed } from '../../../../../../../bookmark-block/embed.js';
import { BLOCK_ID_ATTR } from '../../../../../../consts.js';
import { BookmarkIcon } from '../../../../../../icons/edgeless.js';
import {
  ConfirmIcon,
  EditIcon,
  EmbedWebIcon,
  UnlinkIcon,
} from '../../../../../../icons/text.js';
import type { IconButton } from '../../../../../button.js';
import { toast } from '../../../../../toast.js';
import type { AffineVEditor } from '../../../types.js';
import { linkPopupStyle } from './styles.js';

@customElement('link-popup')
export class LinkPopup extends WithDisposable(LitElement) {
  static override styles = linkPopupStyle;

  @property()
  type: 'create' | 'edit' | 'view' = 'create';

  @property({ attribute: false })
  vEditor!: AffineVEditor;
  @property({ attribute: false })
  goalVRange!: VRange;

  @query('#text-input')
  textInput?: HTMLInputElement;
  @query('#link-input')
  linkInput?: HTMLInputElement;
  @query('.popup-container')
  popupContainer?: HTMLDivElement;
  @query('.mock-selection-container')
  mockSelectionContainer?: HTMLDivElement;
  @query('.affine-confirm-button')
  confirmButton?: IconButton;

  private _bodyOverflowStyle = '';

  override connectedCallback() {
    super.connectedCallback();

    if (this.goalVRange.length === 0) {
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

    const parent = this.blockElement.root.page.getParent(
      this.blockElement.model
    );
    assertExists(parent);
    this.disposables.add(
      parent.childrenUpdated.on(() => {
        const children = parent.children;
        if (children.includes(this.blockElement.model)) return;
        this.remove();
      })
    );
  }

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

  override updated() {
    assertExists(this.popupContainer);
    const range = this.vEditor.toDomRange(this.goalVRange);
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
        this.mockSelectionContainer.appendChild(mockSelection);
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
    }).then(({ x, y }) => {
      if (!this.popupContainer) return;
      this.popupContainer.style.left = `${x}px`;
      this.popupContainer.style.top = `${y}px`;
    });
  }

  get blockElement() {
    const blockElement = this.vEditor.rootElement.closest<BlockElement>(
      `[${BLOCK_ID_ATTR}]`
    );
    assertExists(blockElement);
    return blockElement;
  }

  get currentText() {
    return this.vEditor.yTextString.slice(
      this.goalVRange.index,
      this.goalVRange.index + this.goalVRange.length
    );
  }

  get currentLink() {
    const link = this.vEditor.getFormat(this.goalVRange).link;
    assertExists(link);
    return link;
  }

  private _isBookmarkAllowed() {
    const blockElement = this.blockElement;
    const schema = blockElement.root.page.schema;
    const parent = blockElement.root.page.getParent(blockElement.model);
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

  private _onConfirm() {
    if (!this.vEditor.isVRangeValid(this.goalVRange)) return;

    assertExists(this.linkInput);
    const linkInputValue = this.linkInput.value;
    if (!linkInputValue || !isValidUrl(linkInputValue)) return;

    const link = normalizeUrl(linkInputValue);

    if (this.type === 'create') {
      this.vEditor.formatText(
        this.goalVRange,
        {
          link: link,
          reference: null,
        },
        { mode: 'replace' }
      );
      this.vEditor.setVRange(this.goalVRange);
    } else if (this.type === 'edit') {
      const text = this.textInput?.value ?? link;
      this.vEditor.insertText(this.goalVRange, text, {
        link: link,
        reference: null,
      });
      this.vEditor.setVRange({
        index: this.goalVRange.index,
        length: text.length,
      });
    }

    this.remove();
  }

  private _linkToBookmark(type: BookmarkProps['type']) {
    if (!this.vEditor.isVRangeValid(this.goalVRange)) return;

    const blockElement = this.blockElement;
    const props: BookmarkProps = {
      type,
      url: this.currentLink,
      title: this.currentText,
    };
    const page = blockElement.root.page;
    const parent = page.getParent(blockElement.model);
    assertExists(parent);
    const index = parent.children.indexOf(blockElement.model);
    blockElement.root.page.addBlock(
      'affine:bookmark',
      props,
      parent,
      index + 1
    );

    this.vEditor.deleteText(this.goalVRange);

    this.remove();
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
    const link = this.linkInput?.value;
    this.confirmButton.disabled = !(link && isValidUrl(link));
    this.confirmButton.requestUpdate();
  }

  private _confirmBtnTemplate() {
    return html`<icon-button
      class="affine-confirm-button"
      @click=${this._onConfirm}
      >${ConfirmIcon}</icon-button
    >`;
  }

  private _createTemplate() {
    this.updateComplete.then(() => {
      this.linkInput?.focus();

      this._updateConfirmBtn();
    });

    return html`<div class="affine-link-popover">
      <input
        id="link-input"
        class="affine-link-popover-input"
        type="text"
        spellcheck="false"
        placeholder="Paste or type a link"
        @input=${this._updateConfirmBtn}
      />
      <span class="affine-link-popover-dividing-line"></span>
      ${this._confirmBtnTemplate()}
    </div>`;
  }

  private _viewTemplate() {
    return html`<div class="affine-link-popover">
      <div
        class="affine-link-preview"
        @click=${() => {
          navigator.clipboard.writeText(this.currentLink);
          toast('Copied link to clipboard');
          this.remove();
        }}
      >
        <affine-tooltip .offset=${12}>Click to copy link</affine-tooltip>
        <span style="overflow: hidden;">${this.currentLink}</span>
      </div>

      ${this._isBookmarkAllowed()
        ? html`<span class="affine-link-popover-dividing-line"></span
            ><icon-button
              data-testid="link-to-card"
              @click=${() => this._linkToBookmark('card')}
            >
              ${BookmarkIcon}
              <affine-tooltip .offset=${12}>Turn into Card view</affine-tooltip>
            </icon-button>`
        : nothing}
      ${this._isBookmarkAllowed() && allowEmbed(this.currentLink)
        ? html`<icon-button
            data-testid="link-to-embed"
            @click=${() => this._linkToBookmark('embed')}
          >
            ${EmbedWebIcon}
            <affine-tooltip .offset=${12}>Turn into Embed view</affine-tooltip>
          </icon-button>`
        : nothing}
      <span class="affine-link-popover-dividing-line"></span>
      <icon-button
        data-testid="unlink"
        @click=${() => {
          if (this.vEditor.isVRangeValid(this.goalVRange)) {
            this.vEditor.formatText(this.goalVRange, { link: null });
          }
          this.remove();
        }}
      >
        ${UnlinkIcon}
        <affine-tooltip .offset=${12}>Remove</affine-tooltip>
      </icon-button>

      <icon-button
        data-testid="edit"
        @click=${() => {
          this.type = 'edit';
        }}
      >
        ${EditIcon}
        <affine-tooltip .offset=${12}>Edit</affine-tooltip>
      </icon-button>
    </div>`;
  }

  private _editTemplate() {
    this.updateComplete.then(() => {
      assertExists(this.textInput);
      this.textInput.value = this.currentText;
      assertExists(this.linkInput);
      this.linkInput.value = this.currentLink;

      this.textInput.select();

      this._updateConfirmBtn();
    });

    return html`<div class="affine-link-edit-popover">
      <div class="affine-edit-text-area">
        <input
          class="affine-edit-text-input"
          id="text-input"
          type="text"
          placeholder="Enter text"
          @input=${this._updateConfirmBtn}
        />
        <span class="affine-link-popover-dividing-line"></span>
        <label class="affine-edit-text-text" for="text-input">Text</label>
      </div>
      <div class="affine-edit-link-area">
        <input
          id="link-input"
          class="affine-edit-link-input"
          type="text"
          spellcheck="false"
          placeholder="Paste or type a link"
          @input=${this._updateConfirmBtn}
        />
        <span class="affine-link-popover-dividing-line"></span>
        <label class="affine-edit-link-text" for="link-input">Link</label>
      </div>
      ${this._confirmBtnTemplate()}
    </div>`;
  }

  override render() {
    const mask =
      this.type === 'edit' || this.type === 'create'
        ? html`<div class="overlay-mask" @click=${() => this.remove()}></div>`
        : nothing;

    const popover =
      this.type === 'create'
        ? this._createTemplate()
        : this.type === 'view'
          ? this._viewTemplate()
          : this._editTemplate();

    return html`
      <div class="overlay-root">
        ${mask}
        <div class="popup-container" @keydown=${this._onKeydown}>
          ${popover}
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
