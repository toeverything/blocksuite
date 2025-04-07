import { toGfxBlockComponent } from '@blocksuite/std';
import { css } from 'lit';

import { ImagePlaceholderBlockComponent } from './page.js';

export class ImageEdgelessPlaceholderBlockComponent extends toGfxBlockComponent(
  ImagePlaceholderBlockComponent
) {
  static override styles = css`
    affine-edgeless-placeholder-preview-image
      .affine-placeholder-preview-container {
      border: 1px solid var(--affine-background-tertiary-color);
    }
  `;

  override renderGfxBlock(): unknown {
    return super.renderGfxBlock();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-edgeless-placeholder-preview-image': ImageEdgelessPlaceholderBlockComponent;
  }
}
