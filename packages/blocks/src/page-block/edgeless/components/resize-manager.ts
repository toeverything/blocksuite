import { Bound, getCommonBound } from '@blocksuite/phasor';

import { HandleDirection } from './resize-handles.js';

type ResizeMoveHandler = (newShapeBounds: Record<string, Bound>) => void;

type ResizeEndHandler = () => void;

export class HandleResizeManager {
  private _onResizeMove: ResizeMoveHandler;
  private _onResizeEnd: ResizeEndHandler;

  private _dragDirection: HandleDirection = HandleDirection.Left;
  private _startDragPos: { x: number; y: number } = { x: 0, y: 0 };

  private _bounds: Record<string, Bound> = {};
  private _commonBoundPosition = [
    /* minX */ 0, /* minY */ 0, /* maxX */ 0, /* maxY */ 0,
  ];

  constructor(onResizeMove: ResizeMoveHandler, onResizeEnd: ResizeEndHandler) {
    this._onResizeMove = onResizeMove;
    this._onResizeEnd = onResizeEnd;
  }

  private _onMouseMove = (e: MouseEvent) => {
    const direction = this._dragDirection;
    const { x: startX, y: startY } = this._startDragPos;

    const [oldCommonMinX, oldCommonMinY, oldCommonMaxX, oldCommonMaxY] =
      this._commonBoundPosition;
    const oldCommonWidth = oldCommonMaxX - oldCommonMinX;
    const oldCommonHeight = oldCommonMaxY - oldCommonMinY;

    let [minX, minY, maxX, maxY] = this._commonBoundPosition;

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

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

    const newBounds = Object.entries(this._bounds).reduce(
      (acc, [id, oldShapeBound]) => {
        const {
          x: oldShapeX,
          y: oldShapeY,
          w: oldShapeW,
          h: oldShapeH,
        } = oldShapeBound;
        const nx =
          (flipX
            ? oldCommonMaxX - oldShapeX - oldShapeW
            : oldShapeX - oldCommonMinX) / oldCommonWidth;
        const ny =
          (flipY
            ? oldCommonMaxY - oldShapeY - oldShapeH
            : oldShapeY - oldCommonMinY) / oldCommonHeight;

        const shapeX = newCommonBound.w * nx + newCommonBound.x;
        const shapeY = newCommonBound.h * ny + newCommonBound.y;
        const shapeW = newCommonBound.w * (oldShapeW / oldCommonWidth);
        const shapeH = newCommonBound.h * (oldShapeH / oldCommonHeight);

        acc[id] = { x: shapeX, y: shapeY, w: shapeW, h: shapeH };

        return acc;
      },
      {} as Record<string, Bound>
    );

    this._onResizeMove(newBounds);
  };

  private _onMouseUp = (_: MouseEvent) => {
    this._onResizeEnd();

    this._startDragPos = { x: 0, y: 0 };
    this._bounds = {};
    this._commonBoundPosition = [0, 0, 0, 0];

    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('mouseup', this._onMouseUp);
  };

  onMouseDown = (
    e: MouseEvent,
    direction: HandleDirection,
    bounds: Record<string, Bound>
  ) => {
    // Prevent selection action from being triggered
    e.stopPropagation();

    this._bounds = bounds;
    const { x, y, w, h } = getCommonBound(Object.values(bounds)) as Bound;
    this._commonBoundPosition = [x, y, x + w, y + h];

    this._dragDirection = direction;
    this._startDragPos = {
      x: e.clientX,
      y: e.clientY,
    };

    window.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('mouseup', this._onMouseUp);
  };
}
