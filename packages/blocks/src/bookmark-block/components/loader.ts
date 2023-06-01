import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('bookmark-loader')
export class Loader extends LitElement {
  static override styles = css`
    .bookmark-loader-wrapper {
      display: flex;
      width: var(--loader-size);
      height: var(--loader-size);
    }
    .bookmark-loader {
      width: var(--loader-size);
      animation: loading 3s linear infinite;
    }
    .bookmark-loader-block {
      animation: loading-circle 2s linear infinite;
      stroke-dashoffset: 0;
      stroke-dasharray: 300;
      stroke-width: 15;
      stroke-miterlimit: 10;
      stroke-linecap: round;
      stroke: var(--loader-color);
      fill: transparent;
    }

    @keyframes loading {
      0% {
        transform: rotate(0);
      }
      100% {
        transform: rotate(360deg);
      }
    }
    @keyframes loading-circle {
      0% {
        stroke-dashoffset: 0;
      }
      100% {
        stroke-dashoffset: -600;
      }
    }
  `;

  @property()
  size: string | number = '50px';

  @property()
  color = 'blue';

  override firstUpdated() {
    this.updateComplete.then(() => {
      const { size, color } = this;

      this.style.setProperty(
        '--loader-size',
        typeof size === 'string' ? size : `${size}px`
      );
      this.style.setProperty('--loader-color', color);
    });
  }

  override render() {
    return html`<div class="bookmark-loader-wrapper">
      <svg class="bookmark-loader" x="0px" y="0px" viewBox="0 0 150 150">
        <circle class="bookmark-loader-block" cx="75" cy="75" r="60" />
      </svg>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bookmark-loader': Loader;
  }
}
