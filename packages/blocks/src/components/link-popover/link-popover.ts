import { html, LitElement, type PropertyValues } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { createEvent } from '../../__internal__/utils';
import { toast } from '../toast';
import { ConfirmIcon, EditIcon, UnlinkIcon } from '../button';
import { linkPopoverStyle } from './styles';

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
const URL_REGEX =
  /^(?:(?:(?:https?|s?ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i;

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
  static styles = linkPopoverStyle;

  @property()
  left = '0px';

  @property()
  top = '0px';

  @property()
  type: 'create' | 'edit' = 'create';

  @property()
  showMask = true;

  @property()
  text = '';

  @property()
  previewLink = '';

  @state()
  link = '';

  @state()
  bodyOverflowStyle = '';

  @state()
  disableConfirm = true;

  @query('#text-input')
  textInput: HTMLInputElement | undefined;

  @query('#link-input')
  linkInput: HTMLInputElement | undefined;

  override connectedCallback() {
    super.connectedCallback();

    if (this.showMask) {
      // Disable body scroll
      this.bodyOverflowStyle = document.body.style.overflow;
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
      document.body.style.overflow = this.bodyOverflowStyle;
    }
  }

  private hide() {
    this.dispatchEvent(
      new CustomEvent<LinkDetail>('updateLink', {
        detail: { type: 'cancel' },
      })
    );
  }

  private onConfirm() {
    if (this.disableConfirm) {
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

  private onCopy(e: MouseEvent) {
    navigator.clipboard.writeText(this.previewLink);
    toast('Copied link to clipboard');
  }

  private onUnlink(e: MouseEvent) {
    this.dispatchEvent(createEvent('updateLink', { type: 'remove' }));
  }

  private onEdit(e: MouseEvent) {
    this.dispatchEvent(createEvent('editLink', null));
    this.disableConfirm = false;
  }

  private onKeyup(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      this.onConfirm();
    }
    if (!this.linkInput) {
      throw new Error('Failed to update link! Link input not found!');
    }
    const isValid = isValidLink(this.linkInput.value);
    this.disableConfirm = isValid ? false : true;
    return;
  }

  confirmBtnTemplate() {
    return html`<icon-button
      class="affine-confirm-button"
      ?disabled=${this.disableConfirm}
      @click=${this.onConfirm}
      >${ConfirmIcon()}</icon-button
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
        @keyup=${this.onKeyup}
      />
      <span class="affine-link-popover-dividing-line"></span>
      ${this.confirmBtnTemplate()}
    </div>`;
  }

  previewTemplate() {
    return html`<div class="affine-link-popover">
      <div class="affine-link-preview has-tool-tip" @click=${this.onCopy}>
        <tool-tip inert role="tooltip">Click to copy link</tool-tip>
        ${this.previewLink}
      </div>
      <span class="affine-link-popover-dividing-line"></span>
      <icon-button class="has-tool-tip" @click=${this.onUnlink}>
        ${UnlinkIcon()}
        <tool-tip inert role="tooltip">Remove</tool-tip>
      </icon-button>
      <icon-button class="has-tool-tip" @click=${this.onEdit}>
        ${EditIcon()}
        <tool-tip inert role="tooltip">Edit link</tool-tip>
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
      <input
        class="affine-edit-text-input"
        id="text-input"
        type="text"
        placeholder="Enter text"
        value=${this.text}
        @keyup=${this.onKeyup}
      />
      <label class="affine-edit-text-text" for="text-input">Text</label>
      <input
        id="link-input"
        class="affine-edit-link-input"
        type="url"
        spellcheck="false"
        placeholder="Paste or type a link"
        value=${this.previewLink}
        @keyup=${this.onKeyup}
      />
      <label class="affine-edit-link-text" for="link-input">Link</label>
      ${this.confirmBtnTemplate()}
    </div>`;
  }

  render() {
    const mask = this.showMask
      ? html`<div class="overlay-mask" @click="${this.hide}"></div>`
      : html``;

    const popover =
      this.type === 'create' ? this.simpleTemplate() : this.editTemplate();

    return html`
      <div class="overlay-root">
        ${mask}
        <div
          class="overlay-container"
          style="position: absolute; left: ${this.left}; top: ${this.top};${this
            .style.cssText}"
        >
          ${popover}
        </div>
      </div>
    `;
  }
}

// TODO use signal to control the popover
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
  | { type: 'cancel' }
  | { type: 'confirm'; link: string; text?: string }
  | { type: 'remove' };
