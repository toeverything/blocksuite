import { ShadowlessElement } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { humanFileSize } from '../../_common/utils/math.js';
import { FailedImageIcon, ImageIcon, LoadingIcon } from '../styles.js';

const ELEMENT_TAG = 'affine-image-card' as const;

export enum ImageState {
  Loading,
  Ready,
  Failed,
}

@customElement(ELEMENT_TAG)
export class AffinePageImageCard extends ShadowlessElement {
  static override styles = css`
    .affine-image-card {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background-color: var(--affine-background-secondary-color, #f4f4f5);
      border-radius: 8px;
      border: 1px solid var(--affine-background-tertiary-color, #eee);
      padding: 12px;
    }

    .affine-image-card-content {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--affine-placeholder-color);
      text-align: justify;
      font-family: var(--affine-font-family);
      font-size: var(--affine-font-sm);
      font-style: normal;
      font-weight: 600;
      line-height: var(--affine-line-height);
      user-select: none;
    }

    .affine-image-card-size {
      overflow: hidden;
      padding-top: 12px;
      color: var(--affine-text-secondary-color);
      text-overflow: ellipsis;
      font-size: 10px;
      font-style: normal;
      font-weight: 400;
      line-height: 20px;
      user-select: none;
    }
  `;

  @property({ type: Boolean })
  isInSurface = false;

  @property({ type: Number })
  imageState = 0;

  @property()
  imageName: string | null = null;

  @property({ type: Number })
  imageSize = -1;

  override render() {
    const width = this.isInSurface ? '220px' : '100%';
    const height = this.isInSurface ? '122px' : '78px';

    const contentIcon =
      this.imageState === ImageState.Loading
        ? LoadingIcon
        : this.imageState === ImageState.Failed
          ? FailedImageIcon
          : ImageIcon;

    const contentText =
      this.imageState === ImageState.Loading
        ? 'Loading image...'
        : this.imageState === ImageState.Failed
          ? 'Image loading failed.'
          : this.imageName ?? 'Image';

    const size =
      !isNaN(this.imageSize) && this.imageSize > 0
        ? humanFileSize(this.imageSize)
        : null;

    return html`
      <div class="affine-image-card" style="width:${width};height:${height};">
        <div class="affine-image-card-content">
          ${contentIcon}
          <span class="affine-image-card-title">${contentText}</span>
        </div>
        <div class="affine-image-card-size">${size}</div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [ELEMENT_TAG]: AffinePageImageCard;
  }
}
