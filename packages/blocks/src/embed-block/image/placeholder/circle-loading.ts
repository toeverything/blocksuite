import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { ShadowlessElement } from '../../../__internal__/index.js';

const ELEMENT_TAG = 'affine-image-block-circle-loading' as const;
@customElement(ELEMENT_TAG)
export class AffineImageBlockCircleLoading extends ShadowlessElement {
  static styles = css`
    @keyframes affine-image-block-rotate {
      from {
        rotate: 0deg;
      }
      to {
        rotate: 360deg;
      }
    }

    .affine-image-block-container {
      width: 24px;
      height: 24px;
      overflow: hidden;
    }

    .affine-image-block-loading {
      display: inline-block;
      width: 24px;
      height: 24px;
      position: relative;
      background: conic-gradient(rgba(255, 255, 255, 0.31), #6880ff);
      border-radius: 50%;
      animation: affine-image-block-rotate 1s infinite ease-in;
    }

    .affine-image-block-loading::before {
      content: '';
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background-color: white;
      position: absolute;
      top: 2px;
      left: 2px;
    }
  `;

  render() {
    return html`<div class="affine-image-block-container">
      <div class="affine-image-block-loading"></div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [ELEMENT_TAG]: AffineImageBlockCircleLoading;
  }
}
