import { assertExists } from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';
import { WithDisposable } from '@blocksuite/lit';
import type { VRange } from '@blocksuite/virgo/types';
import { computePosition, inline, offset, shift } from '@floating-ui/dom';
import { html, LitElement, nothing, type PropertyValues } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import { BLOCK_ID_ATTR } from '../../../../../../__internal__/consts.js';
import {
  isValidUrl,
  normalizeUrl,
} from '../../../../../../__internal__/utils/url.js';
import type { BookmarkProps } from '../../../../../../bookmark-block/bookmark-model.js';
import { allowEmbed } from '../../../../../../bookmark-block/embed.js';
import { BookmarkIcon } from '../../../../../../icons/edgeless.js';
import {
  ConfirmIcon,
  EditIcon,
  EmbedWebIcon,
  UnlinkIcon,
} from '../../../../../../icons/text.js';
import { toast } from '../../../../../toast.js';
import type { AffineVEditor } from '../../../types.js';
import { linkPopupStyle } from './styles.js';

@customElement('link-popup')
export class LinkPopup extends WithDisposable(LitElement) {
  static override styles = linkPopupStyle;

  @property()
  type: 'create' | 'edit' | 'view' = 'create';

  @property()
  vEditor!: AffineVEditor;
  @property()
  goalVRange!: VRange;

  @query('#text-input')
  textInput?: HTMLInputElement;
  @query('#link-input')
  linkInput?: HTMLInputElement;
  @query('.popup-container')
  popupContainer?: HTMLDivElement;
  @query('.mock-selection')
  mockSelection?: HTMLDivElement;

  private _bodyOverflowStyle = '';

  override connectedCallback() {
    super.connectedCallback();

    if (this.type === 'edit' || this.type === 'create') {
      // disable body scroll
      this._bodyOverflowStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      this.disposables.add({
        dispose: () => {
          document.body.style.overflow = this._bodyOverflowStyle;
        },
      });

      this.disposables.addFromEvent(this, 'blur', () => {
        this.remove();
      });
    }
  }

  override firstUpdated(_changedProperties: PropertyValues): void {
    super.firstUpdated(_changedProperties);

    if (this.linkInput) {
      this.linkInput.focus();
    }
  }

  override updated() {
    assertExists(this.popupContainer);
    const range = this.vEditor.toDomRange(this.goalVRange);
    assertExists(range);

    if (this.type !== 'view') {
      assertExists(this.mockSelection);
      const rangeRect = range.getBoundingClientRect();
      this.mockSelection.style.left = `${rangeRect.left}px`;
      this.mockSelection.style.top = `${rangeRect.top}px`;
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

  get isLinkInputValueValid() {
    const link = this.linkInput?.value;
    return !!(link && isValidUrl(link));
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

  private _onConfirm() {
    assertExists(this.linkInput);
    const link = normalizeUrl(this.linkInput.value);
    const text = this.textInput?.value ?? link;

    if (this.vEditor.isVRangeValid(this.goalVRange)) {
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

    const blockElement = this.vEditor.rootElement.closest<BlockElement>(
      `[${BLOCK_ID_ATTR}]`
    );
    if (!blockElement) {
      throw new Error('Failed to convert link to bookmark! Block not found!');
    }

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

  private _confirmBtnTemplate() {
    return html`<icon-button
      class="affine-confirm-button"
      ?disabled=${this.isLinkInputValueValid}
      @click=${this._onConfirm}
      >${ConfirmIcon}</icon-button
    >`;
  }

  private _createTemplate() {
    return html`<div class="affine-link-popover">
      <input
        id="link-input"
        class="affine-link-popover-input"
        type="text"
        spellcheck="false"
        placeholder="Paste or type a link"
        @keydown=${this._onKeydown}
        @input=${() => this.requestUpdate()}
      />
      <span class="affine-link-popover-dividing-line"></span>
      ${this._confirmBtnTemplate()}
    </div>`;
  }

  private _viewTemplate() {
    return html`<div class="affine-link-popover">
      <div
        class="affine-link-preview has-tool-tip"
        @click=${() => {
          navigator.clipboard.writeText(this.currentLink);
          toast('Copied link to clipboard');
          this.remove();
        }}
      >
        <tool-tip inert role="tooltip">Click to copy link</tool-tip>
        <span style="overflow: hidden;">${this.currentLink}</span>
      </div>
      <span class="affine-link-popover-dividing-line"></span>
      <icon-button
        class="has-tool-tip"
        data-testid="unlink"
        @click=${() => this._linkToBookmark('card')}
      >
        ${BookmarkIcon}
        <tool-tip inert role="tooltip">Turn into Card view</tool-tip>
      </icon-button>
      ${allowEmbed(this.currentLink)
        ? html`<icon-button
            class="has-tool-tip"
            data-testid="unlink"
            @click=${() => this._linkToBookmark('embed')}
          >
            ${EmbedWebIcon}
            <tool-tip inert role="tooltip">Turn into Embed view</tool-tip>
          </icon-button>`
        : nothing}
      <span class="affine-link-popover-dividing-line"></span>
      <icon-button
        class="has-tool-tip"
        data-testid="unlink"
        @click=${() => {
          if (this.vEditor.isVRangeValid(this.goalVRange)) {
            this.vEditor.formatText(this.goalVRange, { link: null });
          }
          this.remove();
        }}
      >
        ${UnlinkIcon}
        <tool-tip inert role="tooltip">Remove</tool-tip>
      </icon-button>

      <icon-button
        class="has-tool-tip"
        data-testid="edit"
        @click=${() => {
          this.type = 'edit';
          this.requestUpdate();
        }}
      >
        ${EditIcon}
        <tool-tip inert role="tooltip">Edit</tool-tip>
      </icon-button>
    </div>`;
  }

  private _editTemplate() {
    return html`<div class="affine-link-edit-popover">
      <div class="affine-edit-text-area">
        <input
          class="affine-edit-text-input"
          id="text-input"
          type="text"
          placeholder="Enter text"
          @keydown=${this._onKeydown}
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
          @keydown=${this._onKeydown}
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
        ? html`<div class="overlay-mask"></div>`
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
        <div class="popup-container">${popover}</div>
        <div class="mock-selection"></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'link-popup': LinkPopup;
  }
}
