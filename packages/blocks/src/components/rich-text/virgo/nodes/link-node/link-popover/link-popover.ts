import { html, LitElement, nothing, type PropertyValues } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import { createEvent } from '../../../../../../__internal__/utils/common.js';
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
import { linkPopoverStyle } from './styles.js';

@customElement('edit-link-panel')
export class LinkPopover extends LitElement {
  static override styles = linkPopoverStyle;

  @property()
  left = '0';

  @property()
  top = '0';

  @property()
  type: 'create' | 'edit' = 'create';

  @property({ type: Boolean })
  showMask = true;

  @property()
  text = '';

  @property()
  previewLink = '';

  @property({ type: Boolean })
  showBookmarkOperation = false;

  @state()
  private _bodyOverflowStyle = '';

  @state()
  private _disableConfirm = true;

  @query('#text-input')
  textInput: HTMLInputElement | undefined;

  @query('#link-input')
  linkInput: HTMLInputElement | undefined;

  @query('.popover-container')
  popoverContainer: HTMLDivElement | undefined;

  override connectedCallback() {
    super.connectedCallback();

    if (this.showMask) {
      // Disable body scroll
      this._bodyOverflowStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
  }

  protected override firstUpdated(_changedProperties: PropertyValues): void {
    super.firstUpdated(_changedProperties);

    if (this.linkInput) {
      this.linkInput.focus();
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();

    if (this.showMask) {
      // Restore body scroll style
      document.body.style.overflow = this._bodyOverflowStyle;
    }
  }

  private _hide() {
    this.dispatchEvent(
      new CustomEvent<LinkDetail>('updateLink', {
        detail: { type: 'cancel' },
      })
    );
  }

  private _onConfirm() {
    if (this._disableConfirm) {
      return;
    }
    if (!this.linkInput) {
      throw new Error('Failed to update link! Link input not found!');
    }
    const link = normalizeUrl(this.linkInput.value);
    const text = this.textInput?.value ?? undefined;
    if (!link) {
      return;
    }

    this.dispatchEvent(
      createEvent('updateLink', {
        type: 'confirm',
        link,
        text,
      })
    );
    return;
  }

  private _onCopy() {
    navigator.clipboard.writeText(this.previewLink);
    toast('Copied link to clipboard');
  }

  private _onUnlink() {
    this.dispatchEvent(createEvent('updateLink', { type: 'remove' }));
  }

  private _onLinkToCard() {
    this.dispatchEvent(
      new CustomEvent<LinkDetail>('updateLink', {
        detail: { type: 'toBookmark', bookmarkType: 'card' },
      })
    );
  }

  private _onLinkToEmbed() {
    this.dispatchEvent(
      new CustomEvent<LinkDetail>('updateLink', {
        detail: { type: 'toBookmark', bookmarkType: 'embed' },
      })
    );
  }

  private _onEdit() {
    this.dispatchEvent(createEvent('editLink', null));
    this._disableConfirm = false;
  }

  private _onInput() {
    if (!this.linkInput) {
      throw new Error('Failed to update link! Link input not found!');
    }
    const isValid = isValidUrl(this.linkInput.value);
    this._disableConfirm = isValid ? false : true;
  }

  private _onKeydown(e: KeyboardEvent) {
    e.stopPropagation();
    if (e.key === 'Enter' && !e.isComposing) {
      e.preventDefault();
      this._onConfirm();
    }
    return;
  }

  confirmBtnTemplate() {
    return html`<icon-button
      class="affine-confirm-button"
      ?disabled=${this._disableConfirm}
      @click=${this._onConfirm}
      >${ConfirmIcon}</icon-button
    >`;
  }

  createLinkTemplate() {
    return html`<div class="affine-link-popover">
      <input
        id="link-input"
        class="affine-link-popover-input"
        type="text"
        spellcheck="false"
        placeholder="Paste or type a link"
        value=${this.previewLink}
        @keydown=${this._onKeydown}
        @input=${this._onInput}
      />
      <span class="affine-link-popover-dividing-line"></span>
      ${this.confirmBtnTemplate()}
    </div>`;
  }

  previewTemplate() {
    return html`<div class="affine-link-popover">
      <div class="affine-link-preview has-tool-tip" @click=${this._onCopy}>
        <tool-tip inert role="tooltip">Click to copy link</tool-tip>
        <span style="overflow: hidden;">${this.previewLink}</span>
      </div>
      <span class="affine-link-popover-dividing-line"></span>
      ${this.showBookmarkOperation
        ? html`<icon-button
              class="has-tool-tip"
              data-testid="unlink"
              @click=${this._onLinkToCard}
            >
              ${BookmarkIcon}
              <tool-tip inert role="tooltip">Turn into Card view</tool-tip>
            </icon-button>
            ${allowEmbed(this.previewLink)
              ? html`<icon-button
                  class="has-tool-tip"
                  data-testid="unlink"
                  @click=${this._onLinkToEmbed}
                >
                  ${EmbedWebIcon}
                  <tool-tip inert role="tooltip">Turn into Embed view</tool-tip>
                </icon-button>`
              : nothing}
            <span class="affine-link-popover-dividing-line"></span>`
        : nothing}
      <icon-button
        class="has-tool-tip"
        data-testid="unlink"
        @click=${this._onUnlink}
      >
        ${UnlinkIcon}
        <tool-tip inert role="tooltip">Remove</tool-tip>
      </icon-button>

      <icon-button
        class="has-tool-tip"
        data-testid="edit"
        @click=${this._onEdit}
      >
        ${EditIcon}
        <tool-tip inert role="tooltip">Edit</tool-tip>
      </icon-button>
    </div>`;
  }

  simpleTemplate() {
    const isCreateLink = !this.previewLink;
    return isCreateLink ? this.createLinkTemplate() : this.previewTemplate();
  }

  /**
   * ```
   * ┌─────────────────┐
   * │ ┌──────────┐    │
   * │ │Text      │    │
   * │ └──────────┘    │
   * │ ┌──────────┐    │
   * │ │Link      │ X  │
   * │ └──────────┘    │
   * └─────────────────┘
   * ```
   */
  editTemplate() {
    return html`<div class="affine-link-edit-popover">
      <div class="affine-edit-text-area">
        <input
          class="affine-edit-text-input"
          id="text-input"
          type="text"
          placeholder="Enter text"
          value=${this.text}
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
          value=${this.previewLink}
          @keydown=${this._onKeydown}
        />
        <span class="affine-link-popover-dividing-line"></span>
        <label class="affine-edit-link-text" for="link-input">Link</label>
      </div>
      ${this.confirmBtnTemplate()}
    </div>`;
  }

  override render() {
    const mask = this.showMask
      ? html`<div class="overlay-mask" @click="${this._hide}"></div>`
      : html``;

    const popover =
      this.type === 'create' ? this.simpleTemplate() : this.editTemplate();

    return html`
      <div class="overlay-root">
        ${mask}
        <div
          class="popover-container"
          style="position: absolute; left: ${this.left}; top: ${this.top};${this
            .style.cssText}"
        >
          ${popover}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edit-link-panel': LinkPopover;
  }
  interface HTMLElementEventMap {
    updateLink: CustomEvent<LinkDetail>;
    editLink: CustomEvent<null>;
  }
}

export type LinkDetail =
  | { type: 'toBookmark'; bookmarkType: BookmarkProps['type'] }
  | { type: 'cancel' }
  | { type: 'confirm'; link: string; text?: string }
  | { type: 'remove' };
