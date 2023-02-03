import { getModelByElement, IPoint, SelectionEvent } from '../../std.js';
import type { DefaultPageSignals } from '../index.js';
import type { PageSelectionState } from './selection-manager.js';
import { assertExists } from '@blocksuite/global/utils';

export class EmbedResizeManager {
  state: PageSelectionState;
  signals: DefaultPageSignals;
  private _originPosition: IPoint = { x: 0, y: 0 };
  private _dropContainer: HTMLElement | null = null;
  private _dropContainerSize: { w: number; h: number; left: number } = {
    w: 0,
    h: 0,
    left: 0,
  };
  private _dragMoveTarget = 'right';

  constructor(state: PageSelectionState, signals: DefaultPageSignals) {
    this.state = state;
    this.signals = signals;
  }

  onStart(e: SelectionEvent) {
    this._originPosition.x = e.raw.pageX;
    this._originPosition.y = e.raw.pageY;
    this._dropContainer = (e.raw.target as HTMLElement).closest('.resizes');
    this._dropContainerSize.w = this._dropContainer?.getBoundingClientRect()
      .width as number;
    this._dropContainerSize.h = this._dropContainer?.getBoundingClientRect()
      .height as number;
    this._dropContainerSize.left = this._dropContainer?.offsetLeft as number;
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
        this.signals.updateEmbedRects.emit([
          {
            width: width,
            height: height,
            left: left,
            top: this._dropContainer.getBoundingClientRect().top,
          },
        ]);
        const activeImg = this.state.activeComponent?.querySelector(
          '.resizable-img img'
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
