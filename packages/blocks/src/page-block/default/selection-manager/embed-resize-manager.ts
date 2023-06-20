import type { PointerEventState } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';

import type { IPoint } from '../../../__internal__/index.js';
import { throttle } from '../../../__internal__/index.js';
import type { DefaultSelectionSlots } from '../../../index.js';
import { getModelByElement } from '../../../index.js';
import type { PageSelectionState } from './selection-state.js';

export class EmbedResizeManager {
  readonly state: PageSelectionState;
  readonly slots: DefaultSelectionSlots;
  private _originPosition: IPoint = { x: 0, y: 0 };
  private _dropContainer: HTMLElement | null = null;
  private _dropContainerSize: { w: number; h: number; left: number } = {
    w: 0,
    h: 0,
    left: 0,
  };
  private _dragMoveTarget = 'right';

  constructor(state: PageSelectionState, slots: DefaultSelectionSlots) {
    this.state = state;
    this.slots = slots;
  }

  onStart(e: PointerEventState) {
    this._originPosition.x = e.raw.pageX;
    this._originPosition.y = e.raw.pageY;
    this._dropContainer = (e.raw.target as HTMLElement).closest(
      '.resizable-img'
    );
    const rect = this._dropContainer?.getBoundingClientRect() as DOMRect;
    this._dropContainerSize.w = rect.width;
    this._dropContainerSize.h = rect.height;
    this._dropContainerSize.left = rect.left;
    if ((e.raw.target as HTMLElement).className.includes('right')) {
      this._dragMoveTarget = 'right';
    } else {
      this._dragMoveTarget = 'left';
    }
  }

  onMove(e: PointerEventState) {
    const activeComponent =
      this.state.activeComponent || this.state.selectedEmbed;
    if (!activeComponent) return;
    const activeImgContainer = this._dropContainer;
    assertExists(activeImgContainer);
    const activeImg = activeComponent.querySelector('img');
    assertExists(activeImg);

    let width = 0;
    if (this._dragMoveTarget === 'right') {
      width =
        this._dropContainerSize.w + (e.raw.pageX - this._originPosition.x);
    } else {
      width =
        this._dropContainerSize.w - (e.raw.pageX - this._originPosition.x);
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
    assertExists(this.state.activeComponent);
    const dragModel = getModelByElement(this.state.activeComponent);
    dragModel.page.captureSync();
    assertExists(this._dropContainer);
    const { width, height } = this._dropContainer.getBoundingClientRect();
    dragModel.page.updateBlock(dragModel, { width: width, height: height });
  }
}
