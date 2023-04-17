import type { Bound } from '@blocksuite/phasor';
import { getCommonBound } from '@blocksuite/phasor';

import { HandleDirection } from './resize-handles.js';

type ResizeMoveHandler = (bounds: Map<string, Bound>) => void;

type ResizeEndHandler = () => void;

export class HandleResizeManager {
  private _onResizeMove: ResizeMoveHandler;
  private _onResizeEnd: ResizeEndHandler;

  private _dragDirection: HandleDirection = HandleDirection.Left;
  private _startDragPos: { x: number; y: number } = { x: 0, y: 0 };

  private _bounds = new Map<string, Bound>();
  /** Use [minX, minY, maxX, maxY] for convenience */
  private _commonBound = [0, 0, 0, 0];

  constructor(onResizeMove: ResizeMoveHandler, onResizeEnd: ResizeEndHandler) {
    this._onResizeMove = onResizeMove;
    this._onResizeEnd = onResizeEnd;
  }

  private _onPointerMove = (e: PointerEvent) => {
    const direction = this._dragDirection;
    const { x: startX, y: startY } = this._startDragPos;

    const [oldCommonMinX, oldCommonMinY, oldCommonMaxX, oldCommonMaxY] =
      this._commonBound;
    const oldCommonW = oldCommonMaxX - oldCommonMinX;
    const oldCommonH = oldCommonMaxY - oldCommonMinY;

    let [minX, minY, maxX, maxY] = this._commonBound;

    let deltaX = e.clientX - startX;
    let deltaY = e.clientY - startY;
    if (e.shiftKey) {
      const { w, h } = getCommonBound([...this._bounds.values()]) as Bound;
      const aspectRatio = w / h;
      deltaX = deltaX > deltaY ? deltaX : deltaY * aspectRatio;
      deltaY = deltaY > deltaX ? deltaY : deltaX / aspectRatio;
    }

    switch (direction) {
      case HandleDirection.TopLeft:
      case HandleDirection.TopRight: {
        minY += deltaY;
        break;
      }
      case HandleDirection.BottomLeft:
      case HandleDirection.BottomRight: {
        maxY += deltaY;
        break;
      }
    }

    switch (direction) {
      case HandleDirection.Left:
      case HandleDirection.TopLeft:
      case HandleDirection.BottomLeft: {
        minX += deltaX;
        break;
      }
      case HandleDirection.Right:
      case HandleDirection.TopRight:
      case HandleDirection.BottomRight: {
        maxX += deltaX;
        break;
      }
    }

    const flipX = maxX < minX;
    if (flipX) {
      [maxX, minX] = [minX, maxX];
    }

    const flipY = maxY < minY;
    if (flipY) {
      [maxY, minY] = [minY, maxY];
    }

    const newCommonBound = {
      x: minX,
      y: minY,
      w: maxX - minX,
      h: maxY - minY,
    };

    const newBounds = new Map<string, Bound>();

    this._bounds.forEach((oldSelectableBound, id) => {
      const {
        x: oldSelectableX,
        y: oldSelectableY,
        w: oldSelectableW,
        h: oldSelectableH,
      } = oldSelectableBound;

      const nx =
        (flipX
          ? oldCommonMaxX - oldSelectableX - oldSelectableW
          : oldSelectableX - oldCommonMinX) / oldCommonW;
      const ny =
        (flipY
          ? oldCommonMaxY - oldSelectableY - oldSelectableH
          : oldSelectableY - oldCommonMinY) / oldCommonH;

      const shapeX = newCommonBound.w * nx + newCommonBound.x;
      const shapeY = newCommonBound.h * ny + newCommonBound.y;
      const shapeW = newCommonBound.w * (oldSelectableW / oldCommonW);
      const shapeH = newCommonBound.h * (oldSelectableH / oldCommonH);

      newBounds.set(id, { x: shapeX, y: shapeY, w: shapeW, h: shapeH });
    });
    this._onResizeMove(newBounds);
  };

  private _onPointerUp = (e: PointerEvent) => {
    this._onResizeEnd();

    this._startDragPos = { x: 0, y: 0 };
    this._bounds.clear();
    this._commonBound = [0, 0, 0, 0];

    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
  };

  onPointerDown = (
    e: PointerEvent,
    direction: HandleDirection,
    bounds: Map<string, Bound>
  ) => {
    // Prevent selection action from being triggered
    e.stopPropagation();

    this._bounds = bounds;

    const { x, y, w, h } = getCommonBound([...bounds.values()]) as Bound;
    this._commonBound = [x, y, x + w, y + h];

    this._dragDirection = direction;
    this._startDragPos = {
      x: e.clientX,
      y: e.clientY,
    };

    window.addEventListener('pointermove', this._onPointerMove);
    window.addEventListener('pointerup', this._onPointerUp);
  };
}
