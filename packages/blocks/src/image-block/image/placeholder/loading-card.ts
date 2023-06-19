import './circle-loading.js';

import { ShadowlessElement } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

const ELEMENT_TAG = 'affine-image-block-loading-card' as const;

@customElement(ELEMENT_TAG)
export class AffineImageBlockLoadingCard extends ShadowlessElement {
  static override styles = css`
    .affine-image-block-loading-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      margin: 0 auto;
      border: 1px solid #ebeeff;
      border-radius: 10px;
      background: #fbfbff;
    }

    .affine-image-block-content {
      height: 30px;
      line-height: 22px;
      padding-top: 8px;
      color: var(--affine-primary-color);
      font-size: 16px;
      font-weight: 400;
    }
  `;

  @property()
  content = 'Loading content...';

  override render() {
    return html`
      <div class="affine-image-block-loading-card">
        <affine-image-block-circle-loading></affine-image-block-circle-loading>
        <div class="affine-image-block-content">${this.content}</div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [ELEMENT_TAG]: AffineImageBlockLoadingCard;
  }
}
