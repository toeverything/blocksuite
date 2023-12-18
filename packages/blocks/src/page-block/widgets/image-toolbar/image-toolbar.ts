import { WidgetElement } from '@blocksuite/lit';
import { offset, shift } from '@floating-ui/dom';
import { customElement } from 'lit/decorators.js';

import { HoverController } from '../../../_common/components/hover/controller.js';
import { PAGE_HEADER_HEIGHT } from '../../../_common/consts.js';
import type { ImageBlockComponent } from '../../../image-block/image-block.js';
import { ImageOptionsTemplate } from './image-options.js';

export const AFFINE_IMAGE_TOOLBAR_WIDGET = 'affine-image-toolbar-widget';

//TODO(Flrande): move to image-block widget
@customElement(AFFINE_IMAGE_TOOLBAR_WIDGET)
export class AffineImageToolbarWidget extends WidgetElement<ImageBlockComponent> {
  private _hoverController = new HoverController(
    this,
    ({ abortController }) => {
      const imageBlock = this.blockElement;
      const imageContainer = imageBlock.resizeImg;
      if (!imageContainer) return null;
      return {
        template: ImageOptionsTemplate({
          editorHost: this.host,
          model: imageBlock.model,
          blob: imageBlock.blob,
          abortController,
          host: this.blockElement.host,
        }),
        computePosition: {
          referenceElement: imageContainer,
          placement: 'right-start',
          middleware: [
            offset({
              mainAxis: 12,
              crossAxis: 10,
            }),
            shift({
              crossAxis: true,
              padding: {
                top: PAGE_HEADER_HEIGHT + 12,
                bottom: 12,
                right: 12,
              },
            }),
          ],
          autoUpdate: true,
        },
      };
    }
  );

  override connectedCallback() {
    super.connectedCallback();
    const imageBlock = this.blockElement;
    this._hoverController.setReference(imageBlock);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_IMAGE_TOOLBAR_WIDGET]: AffineImageToolbarWidget;
  }
}
