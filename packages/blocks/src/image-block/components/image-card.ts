import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { humanFileSize } from '../../_common/utils/math.js';
import type { ImageBlockComponent } from '../image-block.js';
import { FailedImageIcon, ImageIcon, LoadingIcon } from '../styles.js';

export const SURFACE_IMAGE_CARD_WIDTH = 220;
export const SURFACE_IMAGE_CARD_HEIGHT = 122;
export const NOTE_IMAGE_CARD_WIDTH = 752;
export const NOTE_IMAGE_CARD_HEIGHT = 78;

@customElement('affine-image-block-card')
export class AffineImageCard extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .affine-image-block-card-container {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .affine-image-block-card {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background-color: var(--affine-background-secondary-color, #f4f4f5);
      border-radius: 8px;
      border: 1px solid var(--affine-background-tertiary-color, #eee);
      padding: 12px;
    }

    .affine-image-block-card-content {
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

  @property({ attribute: false })
  accessor block!: ImageBlockComponent;

  override render() {
    const { isInSurface, loading, error, model } = this.block;

    const width = isInSurface
      ? `${SURFACE_IMAGE_CARD_WIDTH}px`
      : `${NOTE_IMAGE_CARD_WIDTH}px`;

    const height = isInSurface
      ? `${SURFACE_IMAGE_CARD_HEIGHT}px`
      : `${NOTE_IMAGE_CARD_HEIGHT}px`;

    const rotate = isInSurface ? model.rotate : 0;

    const cardStyleMap = styleMap({
      transform: `rotate(${rotate}deg)`,
      transformOrigin: 'center',
      width,
      height,
    });

    const titleIcon = loading
      ? LoadingIcon
      : error
        ? FailedImageIcon
        : ImageIcon;

    const titleText = loading
      ? 'Loading image...'
      : error
        ? 'Image loading failed.'
        : 'Image';

    const size =
      !!model.size && model.size > 0
        ? humanFileSize(model.size, true, 0)
        : null;

    return html`
      <div class="affine-image-block-card-container">
        <div class="affine-image-block-card drag-target" style=${cardStyleMap}>
          <div class="affine-image-block-card-content">
            ${titleIcon}
            <span class="affine-image-block-card-title-text">${titleText}</span>
          </div>
          <div class="affine-image-card-size">${size}</div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-image-block-card': AffineImageCard;
  }
}
