import type { PointerEventState } from '@blocksuite/block-std';

import { assertExists } from '@blocksuite/global/utils';

import {
  type BlockComponent,
  getClosestBlockElementByElement,
  getModelByElement,
  isEdgelessPage,
} from '../_common/utils/query.js';
import { getClosestRootBlockComponent } from '../root-block/utils/query.js';

export class ImageResizeManager {
  private _activeComponent: BlockComponent | null = null;

  private _dragMoveTarget = 'right';

  private _imageCenterX = 0;

  private _imageContainer: HTMLElement | null = null;

  private _zoom = 1;

  onEnd() {
    assertExists(this._activeComponent);
    assertExists(this._imageContainer);

    const dragModel = getModelByElement(this._activeComponent);
    dragModel.page.captureSync();
    const { width, height } = this._imageContainer.getBoundingClientRect();
    dragModel.page.updateBlock(dragModel, {
      width: width / this._zoom,
      height: height / this._zoom,
    });
  }

  onMove(e: PointerEventState) {
    assertExists(this._activeComponent);
    const activeComponent = this._activeComponent;
    const activeImgContainer = this._imageContainer;
    assertExists(activeImgContainer);
    const activeImg = activeComponent.querySelector('img');
    assertExists(activeImg);

    let width = 0;
    if (this._dragMoveTarget === 'right') {
      width = (e.raw.pageX - this._imageCenterX) * 2;
    } else {
      width = (this._imageCenterX - e.raw.pageX) * 2;
    }

    const MIN_WIDTH = 50;
    if (width < MIN_WIDTH) {
      width = MIN_WIDTH;
    }
    if (width > activeComponent.getBoundingClientRect().width) {
      width = activeComponent.getBoundingClientRect().width;
    }

    const height = width * (activeImg.naturalHeight / activeImg.naturalWidth);

    const containerRect = activeImgContainer.getBoundingClientRect();
    if (containerRect.width === width && containerRect.height === height)
      return;

    requestAnimationFrame(() => {
      activeImgContainer.style.width = (width / this._zoom).toFixed(2) + 'px';
    });
  }

  onStart(e: PointerEventState) {
    const eventTarget = e.raw.target as HTMLElement;
    this._activeComponent = getClosestBlockElementByElement(
      eventTarget
    ) as BlockComponent;

    const rootElement = getClosestRootBlockComponent(this._activeComponent);
    if (rootElement && isEdgelessPage(rootElement)) {
      this._zoom = rootElement.service.viewport.zoom;
    } else {
      this._zoom = 1;
    }

    this._imageContainer = eventTarget.closest('.resizable-img');
    assertExists(this._imageContainer);
    const rect = this._imageContainer.getBoundingClientRect() as DOMRect;
    this._imageCenterX = rect.left + rect.width / 2;
    if (eventTarget.className.includes('right')) {
      this._dragMoveTarget = 'right';
    } else {
      this._dragMoveTarget = 'left';
    }
  }
}
