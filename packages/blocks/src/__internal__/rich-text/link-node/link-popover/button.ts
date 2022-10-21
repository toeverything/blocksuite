import { css, CSSResult, html, LitElement, svg } from 'lit';
import { customElement } from 'lit/decorators.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';

type SvgIconProps = Partial<{
  readonly height: SVGAnimatedLength | string | number;
  readonly width: SVGAnimatedLength | string | number;
  readonly x: SVGAnimatedLength;
  readonly y: SVGAnimatedLength;
  readonly style: Partial<CSSStyleDeclaration> | CSSResult;
}>;

/**
 * ✅
 */
export const ConfirmIcon = (props: SvgIconProps = {}) =>
  svg`${unsafeSVG(`<svg
    viewBox="0 0 20 20"
    xmlns="http://www.w3.org/2000/svg"
    ${Object.entries(props)
      .map(([key, value]) => `${key}="${value}"`)
      .join('\n')}
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M17.6726 6.0059L7.49998 16.1785L2.32739 11.0059L3.5059 9.82739L7.49998 13.8215L16.4941 4.82739L17.6726 6.0059Z"
    />
  </svg>`)}`;

export const CopyIcon = (props: SvgIconProps = {}) =>
  svg`${unsafeSVG(`<svg
    viewBox="0 0 20 20"
    xmlns="http://www.w3.org/2000/svg"
    ${Object.entries(props)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')}
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M9.72206 2.6665C9.18226 2.6665 8.66128 2.87542 8.27457 3.25246C7.88728 3.63007 7.6665 4.14585 7.6665 4.68734V5.1665H4.72206C4.16827 5.1665 3.64271 5.39554 3.25941 5.79417C2.87697 6.1919 2.6665 6.72597 2.6665 7.27762V15.2221C2.6665 15.7737 2.87697 16.3078 3.25941 16.7055C3.64271 17.1041 4.16827 17.3332 4.72206 17.3332H10.2776C10.8314 17.3332 11.357 17.1041 11.7403 16.7055C12.1227 16.3078 12.3332 15.7737 12.3332 15.2221V14.8332H15.2776C15.8174 14.8332 16.3384 14.6243 16.7251 14.2472C17.1124 13.8696 17.3332 13.3538 17.3332 12.8123V6.88236C17.3331 6.61073 17.2774 6.34228 17.1697 6.09292C17.0621 5.84367 16.9049 5.61891 16.7084 5.43161L14.4064 3.23658C14.0213 2.86942 13.5074 2.66657 12.9755 2.6665H9.72206ZM10.9998 14.8332V15.2221C10.9998 15.4366 10.9176 15.6373 10.7792 15.7814C10.6415 15.9245 10.4605 15.9998 10.2776 15.9998H4.72206C4.53914 15.9998 4.35816 15.9245 4.22052 15.7814C4.08203 15.6373 3.99984 15.4366 3.99984 15.2221V7.27762C3.99984 7.06308 4.08203 6.86235 4.22052 6.71831C4.35816 6.57517 4.53914 6.49984 4.72206 6.49984H7.6665V12.8123C7.6665 13.3538 7.88728 13.8696 8.27457 14.2472C8.66128 14.6243 9.18226 14.8332 9.72206 14.8332H10.9998ZM8.99984 5.83317V12.8123C8.99984 12.9891 9.07172 13.1622 9.20537 13.2925C9.33959 13.4234 9.52515 13.4998 9.72206 13.4998H11.6665H15.2776C15.4745 13.4998 15.6601 13.4234 15.7943 13.2925C15.928 13.1622 15.9998 12.9891 15.9998 12.8123V6.88252C15.9998 6.79338 15.9816 6.70462 15.9456 6.62146C15.9097 6.53823 15.8566 6.46169 15.7885 6.39682L13.4863 4.20163C13.3526 4.0741 13.1695 3.99988 12.9755 3.99984H9.72206C9.52514 3.99984 9.33959 4.07626 9.20537 4.20713C9.07172 4.33744 8.99984 4.51053 8.99984 4.68734V5.83317Z"
    />
  </svg>`)}`;

/**
 * 🖊️
 */
export const EditIcon = (props: SvgIconProps = {}) =>
  svg`${unsafeSVG(`<svg
    viewBox="0 0 20 20"
    xmlns="http://www.w3.org/2000/svg"
    ${Object.entries(props)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')}
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M5.332 13.2203L5.01238 14.1792L5.82087 14.9877L6.77971 14.668L13.6405 7.80725L12.1928 6.35954L5.332 13.2203ZM13.1356 5.41673L14.5833 6.86444L15.7238 5.72395C16.1236 5.32417 16.1236 4.67601 15.7238 4.27623C15.324 3.87646 14.6759 3.87646 14.2761 4.27623L13.1356 5.41673ZM13.3333 3.33342L4.27791 12.3888C4.20472 12.462 4.14958 12.5512 4.11686 12.6494L2.92159 16.2352C2.74787 16.7563 3.2437 17.2522 3.76487 17.0785L7.35065 15.8832C7.44884 15.8505 7.53806 15.7953 7.61124 15.7221L16.6666 6.66676C17.5871 5.74628 17.5871 4.2539 16.6666 3.33342C15.7461 2.41295 14.2538 2.41295 13.3333 3.33342Z"
    />
  </svg>`)}`;

export const CashBinIcon = (props: SvgIconProps = {}) =>
  svg`${unsafeSVG(`<svg
    viewBox="0 0 20 20"
    xmlns="http://www.w3.org/2000/svg"
    ${Object.entries(props)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')}
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M18.3332 5.83333H1.6665V4.5H18.3332V5.83333Z"
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M6.66683 1.66667L13.3335 1.66667L13.3335 3L6.66683 3L6.66683 1.66667Z"
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M4.66683 5.8335V15.8335C4.66683 16.4778 5.18916 17.0002 5.83349 17.0002H14.1668C14.8112 17.0002 15.3335 16.4778 15.3335 15.8335V5.8335H16.6668V15.8335C16.6668 17.2142 15.5475 18.3335 14.1668 18.3335H5.83349C4.45278 18.3335 3.3335 17.2142 3.3335 15.8335V5.8335H4.66683Z"
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M7.50016 15L7.50016 7.5L8.8335 7.5L8.8335 15L7.50016 15Z"
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M12.4998 7.5L12.4998 15L11.1665 15L11.1665 7.5L12.4998 7.5Z"
    />
  </svg>`)}`;

@customElement('icon-button')
export class IconButton extends LitElement {
  static styles = css`
    :host {
      display: flex;
      justify-content: center;
      align-items: center;
      border: none;
      width: 28px;
      height: 28px;
      border-radius: 3px;
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

    :host(:disabled) {
      cursor: not-allowed;
    }
  `;

  constructor() {
    super();
    this.tabIndex = 0;
    this.addEventListener('keypress', function onEvent(event) {
      if (event.key === 'Enter') {
        this.click();
      }
    });
  }

  render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'icon-button': IconButton;
  }
}
