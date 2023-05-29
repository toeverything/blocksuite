import { Bound } from '@blocksuite/phasor';
import { getCommonBound } from '@blocksuite/phasor';

import { HandleDirection, type ResizeMode } from './resize-handles.js';

type ResizeMoveHandler = (bounds: Map<string, Bound>) => void;

type ResizeEndHandler = () => void;

export class HandleResizeManager {
  private _onResizeMove: ResizeMoveHandler;
  private _onResizeEnd: ResizeEndHandler;

  private _dragDirection: HandleDirection = HandleDirection.Left;
  private _dragPos: {
    start: { x: number; y: number };
    end: { x: number; y: number };
  } = {
    start: { x: 0, y: 0 },
    end: { x: 0, y: 0 },
  };

  private _bounds = new Map<string, Bound>();
  /** Use [minX, minY, maxX, maxY] for convenience */
  private _commonBound = [0, 0, 0, 0];

  private _aspectRatio = 1;
  private _resizeMode = 'none';
  private _zoom = 1;

  private _shift = false;

  constructor(onResizeMove: ResizeMoveHandler, onResizeEnd: ResizeEndHandler) {
    this._onResizeMove = onResizeMove;
    this._onResizeEnd = onResizeEnd;
  }

  // TODO: move to vec2
  private _resize(shift = false) {
    const {
      _aspectRatio: aspectRatio,
      _dragDirection: direction,
      _dragPos: dragPos,
      _resizeMode: resizeMode,
      _zoom: zoom,
      _commonBound,
    } = this;

    const isCorner = resizeMode === 'corner';
    const { x: startX, y: startY } = dragPos.start;
    const { x: endX, y: endY } = dragPos.end;

    const deltaX = (endX - startX) / zoom;

    const [oldMinX, oldMinY, oldMaxX, oldMaxY] = _commonBound;
    const oldCommonW = oldMaxX - oldMinX;
    const oldCommonH = oldMaxY - oldMinY;
    let [minX, minY, maxX, maxY] = _commonBound;
    let width = 0;
    let height = 0;
    let flipX = false;
    let flipY = false;

    if (isCorner) {
      const deltaY = (endY - startY) / zoom;

      switch (direction) {
        // TODO
        // case HandleDirection.Top: {
        //   minY += deltaY;
        //   break;
        // }
        // case HandleDirection.Right: {
        //   maxX += deltaX;
        //   break;
        // }
        // case HandleDirection.Bottom: {
        //   maxY += deltaY;
        //   break;
        // }
        // case HandleDirection.Left: {
        //   minX += deltaX;
        //   break;
        // }
        case HandleDirection.TopLeft: {
          minX += deltaX;
          minY += deltaY;
          break;
        }
        case HandleDirection.BottomRight: {
          maxX += deltaX;
          maxY += deltaY;
          break;
        }
        case HandleDirection.TopRight:
          maxX += deltaX;
          minY += deltaY;
          break;
        case HandleDirection.BottomLeft: {
          minX += deltaX;
          maxY += deltaY;
          break;
        }
      }

      const dw = maxX - minX;
      const dh = maxY - minY;
      const scaleX = dw / oldCommonW;
      const scaleY = dh / oldCommonH;

      flipX = scaleX < 0;
      flipY = scaleY < 0;

      if (shift && isCorner) {
        const bw = Math.abs(dw);
        const bh = Math.abs(dh);
        const isTall = aspectRatio < bw / bh;
        const th = (bw / aspectRatio) * (flipY ? 1 : -1);
        const tw = bh * aspectRatio * (flipX ? 1 : -1);

        switch (direction) {
          // TODO
          // case HandleDirection.Top: {
          //   break;
          // }
          // case HandleDirection.Right: {
          //   break;
          // }
          // case HandleDirection.Bottom: {
          //   break;
          // }
          // case HandleDirection.Left: {
          //   break;
          // }
          case HandleDirection.TopLeft: {
            if (isTall) minY = maxY + th;
            else minX = maxX + tw;
            break;
          }
          case HandleDirection.BottomRight: {
            if (isTall) maxY = minY - th;
            else maxX = minX - tw;
            break;
          }
          case HandleDirection.TopRight:
            if (isTall) minY = maxY + th;
            else maxX = minX - tw;
            break;
          case HandleDirection.BottomLeft: {
            if (isTall) maxY = minY - th;
            else minX = maxX + tw;
            break;
          }
        }
      }
    } else {
      switch (direction) {
        case HandleDirection.Left:
          minX += deltaX;
          break;
        case HandleDirection.Right:
          maxX += deltaX;
          break;
      }

      flipX = maxX < minX;
    }

    if (flipX) {
      const t = maxX;
      maxX = minX;
      minX = t;
    }

    if (flipY) {
      const t = maxY;
      maxY = minY;
      minY = t;
    }

    width = Math.abs(maxX - minX);
    height = Math.abs(maxY - minY);

    const newCommonBound = {
      x: minX,
      y: minY,
      w: width,
      h: height,
    };

    const newBounds = new Map<string, Bound>();

    this._bounds.forEach((bound, id) => {
      const { x: oldX, y: oldY, w: oldW, h: oldH } = bound;

      const nx = (flipX ? oldMaxX - oldX - oldW : oldX - oldMinX) / oldCommonW;
      const ny = (flipY ? oldMaxY - oldY - oldH : oldY - oldMinY) / oldCommonH;

      const shapeX = newCommonBound.w * nx + newCommonBound.x;
      const shapeY = newCommonBound.h * ny + newCommonBound.y;
      const shapeW = newCommonBound.w * (oldW / oldCommonW);
      const shapeH = newCommonBound.h * (oldH / oldCommonH);

      newBounds.set(id, new Bound(shapeX, shapeY, shapeW, shapeH));
    });
    this._onResizeMove(newBounds);
  }

  onPointerDown = (
    e: PointerEvent,
    direction: HandleDirection,
    bounds: Map<string, Bound>,
    resizeMode: ResizeMode,
    zoom: number
  ) => {
    // Prevent selection action from being triggered
    e.stopPropagation();

    this._bounds = bounds;

    const { x, y, w, h } = getCommonBound([...bounds.values()]) as Bound;
    this._commonBound = [x, y, x + w, y + h];

    this._dragDirection = direction;
    this._dragPos.start = { x: e.x, y: e.y };
    this._dragPos.end = { x: e.x, y: e.y };
    this._aspectRatio = w / h;
    this._resizeMode = resizeMode;
    this._zoom = zoom;

    const _onPointerMove = (e: PointerEvent) => {
      if (resizeMode === 'none') return;

      this._shift ||= e.shiftKey;
      this._dragPos.end = { x: e.x, y: e.y };

      this._resize(this._shift);
    };

    const _onPointerUp = (_: PointerEvent) => {
      this._onResizeEnd();

      this._bounds.clear();
      this._dragPos = { start: { x: 0, y: 0 }, end: { x: 0, y: 0 } };
      this._commonBound = [0, 0, 0, 0];

      window.removeEventListener('pointermove', _onPointerMove);
      window.removeEventListener('pointerup', _onPointerUp);
    };
    window.addEventListener('pointermove', _onPointerMove);
    window.addEventListener('pointerup', _onPointerUp);
  };

  onShift(pressed: boolean) {
    if (this._shift === pressed) return;

    this._shift = pressed;
    this._resize(pressed);
  }
}
