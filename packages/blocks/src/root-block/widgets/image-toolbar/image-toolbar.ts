import { WidgetElement } from '@blocksuite/block-std';
import { limitShift, offset, shift } from '@floating-ui/dom';
import { customElement } from 'lit/decorators.js';

import { HoverController } from '../../../_common/components/hover/controller.js';
import { PAGE_HEADER_HEIGHT } from '../../../_common/consts.js';
import type { ImageBlockComponent } from '../../../image-block/image-block.js';
import type { ImageBlockModel } from '../../../image-block/index.js';
import { ImageOptionsTemplate } from './image-options.js';

export const AFFINE_IMAGE_TOOLBAR_WIDGET = 'affine-image-toolbar-widget';

@customElement(AFFINE_IMAGE_TOOLBAR_WIDGET)
export class AffineImageToolbarWidget extends WidgetElement<
  ImageBlockModel,
  ImageBlockComponent
> {
  private _hoverController = new HoverController(
    this,
    ({ abortController }) => {
      const imageBlock = this.blockElement;
      const selection = this.host.selection;

      const textSelection = selection.find('text');
      if (
        !!textSelection &&
        (!!textSelection.to || !!textSelection.from.length)
      ) {
        return null;
      }

      const blockSelections = selection.filter('block');
      if (
        blockSelections.length > 1 ||
        (blockSelections.length === 1 &&
          blockSelections[0].blockId !== imageBlock.blockId)
      ) {
        return null;
      }

      const imageContainer = imageBlock.resizeImg ?? imageBlock.imageCard;
      if (!imageContainer) {
        return null;
      }

      return {
        template: ImageOptionsTemplate({
          blockElement: imageBlock,
          abortController,
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
              limiter: limitShift(),
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
