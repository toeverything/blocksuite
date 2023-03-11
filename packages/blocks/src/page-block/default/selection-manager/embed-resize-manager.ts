import { assertExists } from '@blocksuite/global/utils';

import type { DefaultSelectionSlots } from '../../../index.js';
import {
  getModelByElement,
  type IPoint,
  type SelectionEvent,
} from '../../../std.js';
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

  onStart(e: SelectionEvent) {
    this._originPosition.x = e.raw.pageX;
    this._originPosition.y = e.raw.pageY;
    this._dropContainer = (e.raw.target as HTMLElement).closest('.resizes');
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

  onMove(e: SelectionEvent) {
    let width = 0;
    let height = 0;
    let left = 0;
    if (this._dragMoveTarget === 'right') {
      width =
        this._dropContainerSize.w + (e.raw.pageX - this._originPosition.x);
    } else {
      width =
        this._dropContainerSize.w - (e.raw.pageX - this._originPosition.x);
    }
    if (width <= 700 && width >= 50) {
      if (this._dragMoveTarget === 'right') {
        left =
          this._dropContainerSize.left -
          (e.raw.pageX - this._originPosition.x) / 2;
      } else {
        left =
          this._dropContainerSize.left +
          (e.raw.pageX - this._originPosition.x) / 2;
      }

      height = width * (this._dropContainerSize.h / this._dropContainerSize.w);
      if (this._dropContainer) {
        this.slots.embedRectsUpdated.emit([
          new DOMRect(
            left,
            this._dropContainer.getBoundingClientRect().top,
            width,
            height
          ),
        ]);
        const activeImg = this.state.activeComponent?.querySelector(
          '.resizable-img'
        ) as HTMLDivElement;
        if (activeImg) {
          activeImg.style.width = width + 'px';
          activeImg.style.height = height + 'px';
        }
      }
    }
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
