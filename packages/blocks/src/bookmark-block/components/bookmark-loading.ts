import { ShadowlessElement } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { getThemeMode } from '../../_common/utils/query.js';
import { BookmarkDefaultBanner } from './bookmark-default-banner.js';

@customElement('bookmark-loading')
export class BookmarkLoading extends ShadowlessElement {
  static override styles = css`
    .affine-bookmark-loading {
      width: 100%;
      height: 112px;
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      box-shadow: var(--affine-shadow-1);
      background: var(--affine-hover-color);
      border: 3px solid var(--affine-background-secondary-color);
      color: var(--affine-placeholder-color);
      border-radius: 12px;
    }
  `;

  override render() {
    const theme = getThemeMode();
    return html`<div
      class="affine-bookmark-loading ${theme === 'light' ? '' : 'dark'}"
    >
      <div class="affine-bookmark-title">
        <bookmark-loading-circle
          .size=${'15px'}
          .color=${'var(--affine-primary-color)'}
        ></bookmark-loading-circle>
        <div class="affine-bookmark-title-content">Loading...</div>
      </div>
      <div class="affine-bookmark-banner">${BookmarkDefaultBanner()}</div>
    </div>`;
  }
}

@customElement('bookmark-loading-circle')
class BookmarkLoadingCircle extends LitElement {
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

  @property({ attribute: false })
  size: string | number = '50px';

  @property({ attribute: false })
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
    'bookmark-loading': BookmarkLoading;
    'bookmark-loading-circle': BookmarkLoadingCircle;
  }
}
