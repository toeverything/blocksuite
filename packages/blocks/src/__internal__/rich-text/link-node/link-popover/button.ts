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
  viewBox="0 0 12 9"
  xmlns="http://www.w3.org/2000/svg"
  ${Object.entries(props)
    .map(([key, value]) => `${key}="${value}"`)
    .join('\n')}
>
  <path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M11.371 1.20435L4.25021 8.32516L0.629395 4.70435L1.45435 3.87939L4.25021 6.67525L10.5461 0.379395L11.371 1.20435Z"
  />
</svg>`)}`;

// TODO hover style, this svg is no similar to other icons, it has special fill rules
// maybe should ask designer to provide a new one
export const CopyIcon = (props: SvgIconProps = {}) =>
  svg`${unsafeSVG(`<svg
  viewBox="0 0 12 12"
  xmlns="http://www.w3.org/2000/svg"
  ${Object.entries(props)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')}
  fill="none"
>
  <path
    d="M7.75016 0.75V2.73333C7.75016 3.06003 7.75016 3.22338 7.81374 3.34816C7.86967 3.45792 7.95891 3.54716 8.06867 3.60309C8.19345 3.66667 8.3568 3.66667 8.6835 3.66667H10.6668M4.8335 3.66667H2.50016C1.85583 3.66667 1.3335 4.189 1.3335 4.83333V10.0833C1.3335 10.7277 1.85583 11.25 2.50016 11.25H6.00016C6.6445 11.25 7.16683 10.7277 7.16683 10.0833V8.33333M8.3335 0.75H6.70016C6.04677 0.75 5.72007 0.75 5.47051 0.877159C5.25099 0.989011 5.07251 1.16749 4.96066 1.38701C4.8335 1.63657 4.8335 1.96327 4.8335 2.61667V6.46667C4.8335 7.12006 4.8335 7.44676 4.96066 7.69632C5.07251 7.91585 5.25099 8.09432 5.47051 8.20617C5.72007 8.33333 6.04677 8.33333 6.70016 8.33333H8.80016C9.45356 8.33333 9.78026 8.33333 10.0298 8.20617C10.2493 8.09432 10.4278 7.91585 10.5397 7.69632C10.6668 7.44676 10.6668 7.12006 10.6668 6.46667V3.08333L8.3335 0.75Z"
    stroke="#9096A5"
    stroke-width="0.875"
    stroke-linejoin="round"
  />
</svg>`)}`;

/**
 * 🖊️
 */
export const EditIcon = (props: SvgIconProps = {}) =>
  svg`${unsafeSVG(`<svg
    viewBox="0 0 11 11"
    xmlns="http://www.w3.org/2000/svg"
    ${Object.entries(props)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')}
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M1.73255 8.25418L1.50881 8.92538L2.07475 9.49132L2.74595 9.26758L7.5485 4.46503L6.5351 3.45163L1.73255 8.25418ZM7.19507 2.79166L8.20847 3.80506L9.00682 3.00671C9.28666 2.72687 9.28666 2.27316 9.00682 1.99331C8.72697 1.71347 8.27326 1.71347 7.99342 1.99331L7.19507 2.79166ZM7.33345 1.33335L0.994682 7.67211C0.943453 7.72334 0.904856 7.7858 0.881946 7.85453L0.0452625 10.3646C-0.0763443 10.7294 0.270734 11.0765 0.635554 10.9549L3.1456 10.1182C3.21433 10.0953 3.27679 10.0567 3.32802 10.0054L9.66678 3.66668C10.3111 3.02235 10.3111 1.97768 9.66678 1.33335C9.02245 0.689015 7.97778 0.689015 7.33345 1.33335Z"
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
      width: 20px;
      height: 20px;
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

  render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'icon-button': IconButton;
  }
}
