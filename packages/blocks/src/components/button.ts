import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * Default size is 32px, you can override it by setting `size` property.
 * For example, `<icon-button size="32px"></icon-button>`.
 *
 * You can also set `width` or `height` property to override the size.
 *
 * Set `text` property to show a text label.
 *
 * @example
 * ```ts
 * html`<icon-button class="has-tool-tip" @click=${this.onUnlink}>
 *   ${UnlinkIcon}
 * </icon-button>`
 *
 * html`<icon-button size="32px" text="HTML" @click=${this._importHtml}>
 *   ${ExportToHTMLIcon}
 * </icon-button>`
 * ```
 */
@customElement('icon-button')
export class IconButton extends LitElement {
  static override styles = css`
    :host {
      box-sizing: border-box;
      display: flex;
      justify-content: center;
      align-items: center;
      border: none;
      width: var(--button-width);
      height: var(--button-height);
      border-radius: 4px;
      background: transparent;
      cursor: pointer;
      user-select: none;
      font-family: var(--affine-font-family);
      color: var(--affine-text-primary-color);
      pointer-events: auto;
    }

    :host > span {
      flex: 1;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }

    :host(:hover) {
      background: var(--affine-hover-color);
    }

    :host(:active) {
      background: transparent;
    }

    :host([disabled]),
    :host(:disabled) {
      background: transparent;
      color: var(--affine-text-disable-color);
      fill: var(--affine-text-disable-color);
      cursor: not-allowed;
    }

    /* You can add a 'hover' attribute to the button to show the hover style */
    :host([hover]) {
      background: var(--affine-hover-color);
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
  width: string | number | null = null;

  @property()
  height: string | number | null = null;

  @property()
  text: string | null = null;

  // Do not add `{ attribute: false }` option here, otherwise the `disabled` styles will not work
  @property({ attribute: true })
  disabled?: '' = undefined;

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

    // Prevent click event when disabled
    this.addEventListener(
      'click',
      event => {
        // when disabled is '', it means the attribute is present
        if (this.disabled === '') {
          event.preventDefault();
          event.stopPropagation();
        }
      },
      { capture: true }
    );
  }

  override connectedCallback() {
    super.connectedCallback();
    this.tabIndex = 0;

    const DEFAULT_SIZE = '28px';
    if (this.size && (this.width || this.height)) {
      throw new Error(
        'Cannot set both size and width/height on an icon-button'
      );
    }

    let width = this.width ?? DEFAULT_SIZE;
    let height = this.height ?? DEFAULT_SIZE;
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
        ? // wrap a span around the text so we can ellipsis it automatically
          html`<span>${this.text}</span>`
        : ''}<slot name="suffix"></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'icon-button': IconButton;
  }
}
