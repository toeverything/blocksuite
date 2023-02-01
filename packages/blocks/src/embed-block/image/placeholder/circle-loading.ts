import { html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { NonShadowLitElement } from '../../../__internal__/index.js';

@customElement('affine-image-block-circle-loading')
export class AffineImageBlockCircleLoading extends NonShadowLitElement {
  static styles = css`
    @keyframes rotate {
      from {
        rotate: 0deg;
      }
      to {
        rotate: 360deg;
      }
    }

    .container {
      width: 24px;
      height: 24px;
      overflow: hidden;
    }

    .loading {
      display: inline-block;
      width: 24px;
      height: 24px;
      position: relative;
      background: conic-gradient(rgba(255, 255, 255, 0.31), #6880ff);
      border-radius: 50%;
      animation: rotate 1s infinite ease-in;
    }

    .loading::before {
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
    return html`<div class="container"><div class="loading"></div></div>`;
  }
}
