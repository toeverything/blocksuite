import {
  EMBED_CARD_HEIGHT,
  EMBED_CARD_WIDTH,
} from '@blocksuite/affine-shared/consts';
import { toGfxBlockComponent } from '@blocksuite/block-std';
import { customElement } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EdgelessRootService } from '../root-block/index.js';

import { BookmarkBlockComponent } from './bookmark-block.js';

@customElement('affine-edgeless-bookmark')
export class BookmarkEdgelessBlockComponent extends toGfxBlockComponent(
  BookmarkBlockComponent
) {
  override rootServiceFlavour: string = 'affine:page';

  override getRenderingRect() {
    const elementBound = this.model.elementBound;
    const style = this.model.style$.value;

    return {
      x: elementBound.x,
      y: elementBound.y,
      w: EMBED_CARD_WIDTH[style],
      h: EMBED_CARD_HEIGHT[style],
      zIndex: this.toZIndex(),
    };
  }

  override renderGfxBlock() {
    const style = this.model.style$.value;
    const width = EMBED_CARD_WIDTH[style];
    const height = EMBED_CARD_HEIGHT[style];
    const bound = this.model.elementBound;
    const scaleX = bound.w / width;
    const scaleY = bound.h / height;

    this.containerStyleMap = styleMap({
      width: `100%`,
      height: `100%`,
      transform: `scale(${scaleX}, ${scaleY})`,
      transformOrigin: '0 0',
    });

    return this.renderPageContent();
  }

  override toZIndex() {
    return `${this.rootService.layer.getZIndex(this.model)}`;
  }

  override get rootService() {
    return super.rootService as EdgelessRootService;
  }

  protected override accessor blockContainerStyles = {};
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-edgeless-bookmark': BookmarkEdgelessBlockComponent;
  }
}
