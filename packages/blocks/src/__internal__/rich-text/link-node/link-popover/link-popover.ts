import { html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { createEvent } from '../../../utils';
import { ConfirmIcon, EditIcon, UnlinkIcon } from './button';
import { linkPopoverStyle } from './styles';

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

  @query('#text-input')
  textInput: HTMLInputElement | undefined;

  @query('#link-input')
  linkInput: HTMLInputElement | undefined;

  connectedCallback() {
    super.connectedCallback();
    if (this.showMask) {
      // Disable body scroll
      this.bodyOverflowStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
  }

  disconnectedCallback() {
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
    const link = this.linkInput?.value?.trim() ?? null;
    const text = this.textInput?.value ?? undefined;
    if (!link) {
      // TODO invalid link checking
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
    // TODO show toast
    // Toast.show('Copied link to clipboard');
    console.log('Copied link to clipboard');
  }

  private onUnlink(e: MouseEvent) {
    this.dispatchEvent(createEvent('updateLink', { type: 'remove' }));
  }

  private onEdit(e: MouseEvent) {
    this.dispatchEvent(createEvent('editLink', null));
  }

  private onKeyup(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      this.onConfirm();
    }
    this.link = (e.target as HTMLInputElement).value;
    return;
  }

  confirmBtnTemplate() {
    return html`<icon-button
      class="affine-confirm-button"
      @click=${this.onConfirm}
      >${ConfirmIcon()}</icon-button
    >`;
  }

  createTemplate() {
    const isCreateLink = !this.previewLink;

    const buttons = html`<icon-button @click=${this.onUnlink}
        >${UnlinkIcon()}</icon-button
      ><icon-button @click=${this.onEdit}>${EditIcon()}</icon-button>`;

    return isCreateLink
      ? html`<div class="affine-link-popover" style=${this.style.cssText}>
          <input
            class="affine-link-popover-input"
            autofocus
            id="link-input"
            type="text"
            spellcheck="false"
            placeholder="Paste or type a link"
            value=${this.previewLink}
            @keyup=${this.onKeyup}
            @click=${this.onCopy}
          />
          <span class="affine-link-popover-dividing-line"></span>
          ${this.confirmBtnTemplate()}
        </div>`
      : html`<div class="affine-link-popover" style=${this.style.cssText}>
          <div class="affine-link-preview" @click=${this.onCopy}>
            ${this.previewLink}
          </div>
          <span class="affine-link-popover-dividing-line"></span>
          ${buttons}
        </div>`;
  }

  editTemplate() {
    return html`<div
      class="affine-link-edit-popover"
      style=${this.style.cssText}
    >
      <label class="affine-edit-text-text" for="text-input">Text</label>
      <input
        class="affine-edit-text-input"
        id="text-input"
        type="text"
        placeholder="Enter text"
        value=${this.text}
        @keyup=${this.onKeyup}
      />
      <label class="affine-edit-link-text" for="link-input">Link</label>
      <input
        class="affine-edit-link-input"
        id="link-input"
        type="text"
        autofocus="true"
        spellcheck="false"
        placeholder="Paste or type a link"
        value=${this.previewLink}
        @keyup=${this.onKeyup}
      />
      ${this.confirmBtnTemplate()}
    </div>`;
  }

  render() {
    const mask = this.showMask
      ? html`<div class="overlay-mask" @click="${this.hide}"></div>`
      : html``;

    const popover =
      this.type === 'create' ? this.createTemplate() : this.editTemplate();

    return html`
      <div class="overlay-root">
        ${mask}
        <div
          class="overlay-container"
          style="position: absolute; left: ${this.left}; top: ${this.top};"
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
