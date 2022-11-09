import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * @example
 * ```ts
 * html`<icon-button class="has-tool-tip" @click=${this.onUnlink}>
 *   ${UnlinkIcon}
 * </icon-button>`
 * ```
 */
@customElement('icon-button')
export class IconButton extends LitElement {
  static styles = css`
    :host {
      display: flex;
      justify-content: center;
      align-items: center;
      border: none;
      width: var(--button-size);
      height: var(--button-size);
      border-radius: 5px;
      background: transparent;
      cursor: pointer;
      user-select: none;
      fill: var(--affine-icon-color);
    }

    :host(:hover) {
      background: var(--affine-hover-background);
      fill: var(--affine-primary-color);
    }

    :host(:active) {
      background: transparent;
      fill: var(--affine-primary-color);
    }

    :host([disabled]),
    :host(:disabled) {
      background: transparent;
      fill: var(--affine-icon-color);
      cursor: not-allowed;
    }
  `;

  @property()
  size: string | number = '28px';

  @property({ type: Boolean })
  disabled = false;

  constructor() {
    super();
    this.tabIndex = 0;
    this.addEventListener('keypress', event => {
      if (this.disabled) {
        return;
      }
      if (event.key === 'Enter') {
        this.click();
      }
    });
  }

  override connectedCallback() {
    super.connectedCallback();

    this.style.setProperty(
      '--button-size',
      typeof this.size === 'string' ? this.size : `${this.size}px`
    );
  }

  override render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'icon-button': IconButton;
  }
}
