import {
  ConfirmIcon,
  EditIcon,
  LinkToCardIcon,
  UnlinkIcon,
} from '@blocksuite/global/config';
import { html, LitElement, type PropertyValues } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import { createEvent } from '../../__internal__/utils/index.js';
import { toast } from '../toast.js';
import { linkPopoverStyle } from './styles.js';

export const ALLOWED_SCHEMES = [
  'http',
  'https',
  'ftp',
  'sftp',
  'mailto',
  'tel',
  // may need support other schemes
];
// I guess you don't want to use the regex base the RFC 5322 Official Standard
// For more detail see https://stackoverflow.com/questions/201323/how-can-i-validate-an-email-address-using-a-regular-expression/1917982#1917982
const MAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

// For more detail see https://stackoverflow.com/questions/8667070/javascript-regular-expression-to-validate-url
const URL_REGEX = new RegExp(
  '^' +
    // protocol identifier (optional)
    // short syntax // still required
    '(?:(?:(?:https?|ftp):)?\\/\\/)' +
    // user:pass BasicAuth (optional)
    '(?:\\S+(?::\\S*)?@)?' +
    '(?:' +
    // IP address exclusion
    // private & local networks
    '(?!(?:10|127)(?:\\.\\d{1,3}){3})' +
    '(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})' +
    '(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})' +
    // IP address dotted notation octets
    // excludes loopback network 0.0.0.0
    // excludes reserved space >= 224.0.0.0
    // excludes network & broadcast addresses
    // (first & last IP address of each class)
    '(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])' +
    '(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}' +
    '(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))' +
    '|' +
    // host & domain names, may end with dot
    // can be replaced by a shortest alternative
    // (?![-_])(?:[-\\w\\u00a1-\\uffff]{0,63}[^-_]\\.)+
    '(?:' +
    '(?:' +
    '[a-z0-9\\u00a1-\\uffff]' +
    '[a-z0-9\\u00a1-\\uffff_-]{0,62}' +
    ')?' +
    '[a-z0-9\\u00a1-\\uffff]\\.' +
    ')+' +
    // TLD identifier name, may end with dot
    '(?:[a-z\\u00a1-\\uffff]{2,}\\.?)' +
    ')' +
    // port number (optional)
    '(?::\\d{2,5})?' +
    // resource path (optional)
    '(?:[/?#]\\S*)?' +
    '$',
  'i'
);

function normalizeUrl(url: string) {
  const hasScheme = ALLOWED_SCHEMES.some(scheme =>
    url.startsWith(scheme + ':')
  );
  if (hasScheme) {
    return url;
  }
  const isEmail = MAIL_REGEX.test(url);
  if (isEmail) {
    return 'mailto:' + url;
  }
  return 'http://' + url;
}

/**
 * For more detail see https://www.ietf.org/rfc/rfc1738.txt
 */
const isValidLink = (str: string) => {
  if (!str) {
    return false;
  }
  const url = normalizeUrl(str);
  if (url === str) {
    // Skip check if user input scheme manually
    return true;
  }
  return URL_REGEX.test(url);
};

@customElement('edit-link-panel')
export class LinkPopover extends LitElement {
  static override styles = linkPopoverStyle;

  @property()
  left = '0';

  @property()
  top = '0';

  @property()
  type: 'create' | 'edit' = 'create';

  @property()
  showMask = true;

  @property()
  text = '';

  @property()
  previewLink = '';

  @property()
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

  private _onCopy(e: MouseEvent) {
    navigator.clipboard.writeText(this.previewLink);
    toast('Copied link to clipboard');
  }

  private _onUnlink(e: MouseEvent) {
    this.dispatchEvent(createEvent('updateLink', { type: 'remove' }));
  }

  private _onLinkToCard(e: MouseEvent) {
    this.dispatchEvent(
      new CustomEvent<LinkDetail>('updateLink', {
        detail: { type: 'toBookmark' },
      })
    );
  }

  private _onEdit(e: MouseEvent) {
    this.dispatchEvent(createEvent('editLink', null));
    this._disableConfirm = false;
  }

  private _onInput(e: InputEvent) {
    if (!this.linkInput) {
      throw new Error('Failed to update link! Link input not found!');
    }
    const isValid = isValidLink(this.linkInput.value);
    this._disableConfirm = isValid ? false : true;
  }

  private _onKeydown(e: KeyboardEvent) {
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
              ${LinkToCardIcon}
              <tool-tip inert role="tooltip">Turn into Card view</tool-tip>
            </icon-button>
            <span class="affine-link-popover-dividing-line"></span>`
        : ''}
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
  | { type: 'toBookmark' }
  | { type: 'cancel' }
  | { type: 'confirm'; link: string; text?: string }
  | { type: 'remove' };
