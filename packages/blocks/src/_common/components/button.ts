import { baseTheme } from '@toeverything/theme';
import { css, html, LitElement, nothing, unsafeCSS } from 'lit';
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
 * html`<icon-button @click=${this.onUnlink}>
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
      justify-content: flex-start;
      align-items: center;
      border: none;
      width: var(--button-width);
      height: var(--button-height);
      border-radius: 4px;
      background: transparent;
      cursor: pointer;
      user-select: none;
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
      color: var(--affine-text-primary-color);
      pointer-events: auto;
      padding: 4px;
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
      cursor: not-allowed;
    }

    /* You can add a 'hover' attribute to the button to show the hover style */
    :host([hover]) {
      background: var(--affine-hover-color);
    }
    :host([hover='false']) {
      background: transparent;
    }

    :host(:active[active]) {
      background: transparent;
    }

    /* not supported "until-found" yet */
    :host([hidden]) {
      display: none;
    }

    :host > .text-container {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    :host .text {
      font-size: var(--affine-font-sm);
      line-height: var(--affine-line-height);
    }

    :host .sub-text {
      font-size: var(--affine-font-xs);
      color: var(
        --light-textColor-textSecondaryColor,
        var(--textColor-textSecondaryColor, #8e8d91)
      );
      line-height: var(--affine-line-height);
      text-overflow: ellipsis;
      overflow: hidden;
      margin-top: -2px;
    }

    ::slotted(svg) {
      color: var(--svg-icon-color);
    }

    ::slotted([slot='suffix']) {
      margin-left: auto;
    }
  `;

  @property()
  accessor size: string | number | null = null;

  @property()
  accessor width: string | number | null = null;

  @property()
  accessor height: string | number | null = null;

  @property()
  accessor text: string | null = null;

  @property()
  accessor subText: string | null = null;

  @property({ attribute: true, type: Boolean })
  accessor active: boolean = false;

  @property({ attribute: true, type: Boolean })
  accessor hover: boolean | undefined = undefined;

  // Do not add `{ attribute: false }` option here, otherwise the `disabled` styles will not work
  @property({ attribute: true, type: Boolean })
  accessor disabled: boolean | undefined = undefined;

  constructor() {
    super();
    // Allow activate button by pressing Enter key
    this.addEventListener('keypress', event => {
      if (this.disabled) {
        return;
      }
      if (event.key === 'Enter' && !event.isComposing) {
        this.click();
      }
    });

    // Prevent click event when disabled
    this.addEventListener(
      'click',
      event => {
        if (this.disabled === true) {
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
    if (this.hidden) return nothing;
    if (this.disabled) {
      const disabledColor = 'var(--affine-text-disable-color)';
      this.style.setProperty('--svg-icon-color', disabledColor);
      this.dataset.testDisabled = 'true';
    } else {
      this.dataset.testDisabled = 'false';
      const iconColor = this.active
        ? 'var(--affine-primary-color)'
        : 'var(--affine-icon-color)';
      this.style.setProperty('--svg-icon-color', iconColor);
    }

    const text = this.text
      ? // wrap a span around the text so we can ellipsis it automatically
        html`<div class="text">${this.text}</div>`
      : nothing;

    const subText = this.subText
      ? html`<div class="sub-text">${this.subText}</div>`
      : nothing;

    const textContainer =
      this.text || this.subText
        ? html`<div class="text-container">${text}${subText}</div>`
        : nothing;

    return html` <slot></slot>
      ${textContainer}
      <slot name="suffix"></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'icon-button': IconButton;
  }
}
