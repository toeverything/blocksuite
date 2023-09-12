import { WidgetElement } from '@blocksuite/lit';
import { offset, shift } from '@floating-ui/dom';
import { customElement } from 'lit/decorators.js';

import { PAGE_HEADER_HEIGHT } from '../../__internal__/consts.js';
import { WhenHoverController } from '../../components/when-hover.js';
import type { ImageBlockComponent } from '../../image-block/image-block.js';
import { ImageOptionsTemplate } from './image-options.js';

@customElement('affine-image-toolbar-widget')
export class AffineImageToolbarWidget extends WidgetElement {
  private _whenHover = new WhenHoverController(
    this,
    ({ setFloating, abortController }) => {
      const imageBlock = this.pageElement as ImageBlockComponent;
      return {
        template: ImageOptionsTemplate({
          ref: setFloating,
          model: imageBlock.model,
          blob: imageBlock.blob,
          abortController,
          root: this.pageElement.root,
        }),
        computePosition: {
          referenceElement: imageBlock.resizeImg,
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
    const imageBlock = this.pageElement as ImageBlockComponent;
    this._whenHover.setReference(imageBlock);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-image-toolbar-widget': AffineImageToolbarWidget;
  }
}
