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
      box-sizing: border-box;
      display: flex;
      justify-content: center;
      align-items: center;
      border: none;
      width: var(--button-width);
      height: var(--button-height);
      border-radius: 5px;
      background: transparent;
      cursor: pointer;
      user-select: none;
      fill: var(--affine-icon-color);
      font-family: var(--affine-font-family);
      color: var(--affine-popover-color);
    }

    :host(:hover) {
      background: var(--affine-hover-background);
      fill: var(--affine-primary-color);
      color: var(--affine-primary-color);
    }

    :host(:active) {
      background: transparent;
      fill: var(--affine-primary-color);
      color: var(--affine-primary-color);
    }

    :host([disabled]),
    :host(:disabled) {
      background: transparent;
      color: var(--affine-popover-color);
      fill: var(--affine-icon-color);
      cursor: not-allowed;
    }

    /* You can add a 'hover' attribute to the button to show the hover style */
    :host([hover]) {
      background: var(--affine-hover-background);
      fill: var(--affine-primary-color);
      color: var(--affine-primary-color);
    }

    /* You can add a 'active' attribute to the button to revert the active style */
    :host([active]) {
      fill: var(--affine-primary-color);
      color: var(--affine-primary-color);
    }

    :host(:active[active]) {
      background: transparent;
      fill: var(--affine-icon-color);
    }
  `;

  @property()
  size: string | number | null = null;

  @property()
  width: string | number = '28px';

  @property()
  height: string | number = '28px';

  @property()
  text: string | null = null;

  @property()
  disabled = false;

  constructor() {
    super();
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
    this.tabIndex = 0;

    if (this.size && (this.width || this.height)) {
      throw new Error(
        'Cannot set both size and width/height on an icon-button'
      );
    }

    let width = this.width;
    let height = this.height;
    if (this.size) {
      width = this.size;
      height = this.size;
    }

    this.style.setProperty(
      '--button-width',
      typeof width === 'string' ? width : `${width}px`
    );
    this.style.setProperty(
      '--button-height',
      typeof height === 'string' ? height : `${height}px`
    );
  }

  override render() {
    return html`<slot></slot>${this.text
        ? html`<span style="margin-left: 12px;">${this.text}</span>`
        : ''}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'icon-button': IconButton;
  }
}
