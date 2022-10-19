import { css, html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { ConfirmIcon, CopyIcon, EditIcon } from './button';

@customElement('edit-link-panel')
export class LinkPopover extends LitElement {
  static styles = css`
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
      box-shadow: var(--affine-box-shadow);
      border-radius: 0px 10px 10px 10px;
    }

    .affine-link-popover-input {
      flex: 1;
      font-family: var(--affine-font-family);
      font-style: normal;
      line-height: 24px;
      font-size: var(--affine-font-sm);
      color: var(--affine-popover-color);
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

    .affine-link-popover-btn-container {
      display: flex;
    }
  `;

  @property()
  left = '0px';

  @property()
  top = '0px';

  @property()
  showMask = true;

  @property()
  preview = '';

  @state()
  link = '';

  @state()
  bodyOverflowStyle = '';

  @query('input')
  input: HTMLInputElement | undefined;

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
      new CustomEvent<ConfirmDetail>('confirmLink', { detail: { link: null } })
    );
  }

  private onConfirm() {
    const link = this.input?.value?.trim() ?? null;
    if (!link) {
      // TODO invalid link checking
      return;
    }
    const options = {
      detail: { link },
    };
    this.dispatchEvent(new CustomEvent<ConfirmDetail>('confirmLink', options));
    return;
  }

  private onCopy(e: MouseEvent) {
    navigator.clipboard.writeText(this.preview);
    // TODO show toast
    // Toast.show('Copied link to clipboard');
    console.log('Copied link to clipboard');
  }

  private onEdit(e: MouseEvent) {
    this.dispatchEvent(new CustomEvent('editLink'));
  }

  private onKeyup(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      this.onConfirm();
    }
    this.link = (e.target as HTMLInputElement).value;
    return;
  }

  render() {
    const mask = this.showMask
      ? html`<div class="overlay-mask" @click="${this.hide}"></div>`
      : html``;

    const buttons = this.preview
      ? html`<icon-button @click=${this.onCopy}
            >${CopyIcon({ width: '10px', height: '11px' })}</icon-button
          ><icon-button @click=${this.onEdit}
            >${EditIcon({ width: '11px', height: '11px' })}</icon-button
          >`
      : html`<icon-button @click=${this.onConfirm}
          >${ConfirmIcon({
            width: '11px',
            height: '8px',
          })}</icon-button
        >`;

    return html`
      <div class="overlay-root">
        ${mask}
        <div
          class="overlay-container"
          style="position: absolute; left: ${this.left}; top: ${this.top};"
        >
          <div class="affine-link-popover">
            <input
              class="affine-link-popover-input"
              disabled=${this.preview ? true : false}
              autofocus=${this.preview ? false : true}
              type="text"
              spellcheck="false"
              placeholder="Paste or type a link"
              value=${this.preview}
              @keyup=${this.onKeyup}
            />
            <span class="affine-link-popover-dividing-line"></span>
            <div class="affine-link-popover-btn-container">${buttons}</div>
          </div>
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

type ConfirmDetail = { link: string | null };

declare global {
  interface HTMLElementEventMap {
    confirmLink: CustomEvent<ConfirmDetail>;
    editLink: CustomEvent<null>;
  }
}
