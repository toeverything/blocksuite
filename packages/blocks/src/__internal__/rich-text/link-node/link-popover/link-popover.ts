import { css, html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { createEvent } from '../../../utils';
import { ConfirmIcon, CopyIcon, EditIcon } from './button';

const editLinkStyle = css`
  .affine-link-edit-popover {
    box-sizing: border-box;
    width: 382px;
    height: 128px;
    padding: 24px;
    box-shadow: var(--affine-popover-shadow);
    border-radius: 0px 10px 10px 10px;

    display: grid;
    grid-template-columns: auto auto auto;
    grid-template-rows: repeat(2, 1fr);
    gap: 12px;
    grid-template-areas:
      'text text-input .'
      'link link-input btn';
    justify-items: center;
    align-items: center;
  }

  input {
    box-sizing: border-box;
    padding: 6px 12px;
    width: 260px;
    height: 34px;
    color: inherit;

    border: 1px solid #e0e6eb;
    border-radius: 10px;
    outline-color: var(--affine-primary-color);
  }

  input::placeholder {
    color: var(--affine-placeholder-color);
  }

  .affine-edit-text-text {
    grid-area: text;
  }

  .affine-edit-text-input {
    grid-area: text-input;
  }

  .affine-edit-link-text {
    grid-area: link;
  }

  .affine-edit-link-input {
    grid-area: link-input;
  }

  .affine-confirm-button {
    grid-area: btn;
  }
`;

@customElement('edit-link-panel')
export class LinkPopover extends LitElement {
  static styles = css`
    .overlay-container {
      font-family: var(--affine-font-family);
      font-style: normal;
      line-height: 24px;
      font-size: var(--affine-font-sm);
      color: var(--affine-popover-color);
      z-index: var(--affine-z-index-popover);
    }

    .overlay-mask {
      position: fixed;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
    }

    .affine-link-popover {
      display: flex;
      align-items: center;
      width: 316px;
      height: 34px;
      padding: 0 12px;

      background: var(--affine-popover-background);
      box-shadow: var(--affine-popover-shadow);
      border-radius: 0px 10px 10px 10px;
    }

    .affine-link-popover-input {
      flex: 1;
      border: 0;
      outline-width: 0;
    }

    .affine-link-popover-input:disabled {
      background-color: transparent;
    }

    .affine-link-popover-input::placeholder {
      color: var(--affine-placeholder-color);
    }

    .affine-link-popover-dividing-line {
      margin: 0 6px;
      width: 1px;
      height: 20px;
      background-color: #e0e6eb;
    }

    ${editLinkStyle}
  `;

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
      >${ConfirmIcon({
        width: '11px',
        height: '8px',
      })}</icon-button
    >`;
  }

  createTemplate() {
    const buttons = this.previewLink
      ? html`<icon-button @click=${this.onCopy}
            >${CopyIcon({ width: '10px', height: '11px' })}</icon-button
          ><icon-button @click=${this.onEdit}
            >${EditIcon({ width: '11px', height: '11px' })}</icon-button
          >`
      : this.confirmBtnTemplate();
    return html`<div class="affine-link-popover" style=${this.style.cssText}>
      <input
        class="affine-link-popover-input"
        ?disabled=${this.previewLink}
        ?autofocus=${!this.previewLink}
        id="link-input"
        type="text"
        spellcheck="false"
        placeholder="Paste or type a link"
        value=${this.previewLink}
        @keyup=${this.onKeyup}
      />
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

declare global {
  interface HTMLElementTagNameMap {
    'edit-link-panel': LinkPopover;
  }
}

export type LinkDetail =
  | { type: 'cancel' }
  | { type: 'confirm'; link: string; text?: string }
  | { type: 'remove' };

declare global {
  interface HTMLElementEventMap {
    updateLink: CustomEvent<LinkDetail>;
    editLink: CustomEvent<null>;
  }
}
