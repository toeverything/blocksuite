import type { PointerEventState } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';

import { throttle } from '../../__internal__/utils/common.js';
import {
  type BlockComponentElement,
  getClosestBlockElementByElement,
  getModelByElement,
} from '../../__internal__/utils/query.js';

export class ImageResizeManager {
  private _activeComponent: BlockComponentElement | null = null;
  private _imageContainer: HTMLElement | null = null;
  private _imageCenterX = 0;
  private _dragMoveTarget = 'right';

  onStart(e: PointerEventState) {
    const eventTarget = e.raw.target as HTMLElement;
    this._activeComponent = getClosestBlockElementByElement(
      eventTarget
    ) as BlockComponentElement;
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
    const updateImg = throttle(() => {
      activeImgContainer.style.width = width.toFixed(2) + 'px';
      activeImgContainer.style.height = height.toFixed(2) + 'px';
    }, 50);
    requestAnimationFrame(updateImg);
  }

  onEnd() {
    assertExists(this._activeComponent);
    assertExists(this._imageContainer);

    const dragModel = getModelByElement(this._activeComponent);
    dragModel.page.captureSync();
    const { width, height } = this._imageContainer.getBoundingClientRect();
    dragModel.page.updateBlock(dragModel, { width: width, height: height });
  }
}
