import { Bound } from '@blocksuite/phasor';
import { getCommonBound } from '@blocksuite/phasor';
import { assertExists } from '@blocksuite/store';

import type { IPoint } from '../../../std.js';
import { HandleDirection, type ResizeMode } from './resize-handles.js';

type ResizeMoveHandler = (bounds: Map<string, Bound>) => void;

type RotateMoveHandler = (point: IPoint, rotate: number) => void;

type ResizeEndHandler = () => void;

export class HandleResizeManager {
  private _onResizeMove: ResizeMoveHandler;
  private _onRotateMove: RotateMoveHandler;
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

  private _shiftKey = false;

  private _rotated = false;

  constructor(
    onResizeMove: ResizeMoveHandler,
    onRotateMove: RotateMoveHandler,
    onResizeEnd: ResizeEndHandler
  ) {
    this._onResizeMove = onResizeMove;
    this._onRotateMove = onRotateMove;
    this._onResizeEnd = onResizeEnd;
  }

  // TODO: move to vec2
  // private _resize(shift = false) {
  //   const {
  //     _aspectRatio: aspectRatio,
  //     _dragDirection: direction,
  //     _dragPos: dragPos,
  //     _resizeMode: resizeMode,
  //     _zoom: zoom,
  //     _commonBound,
  //   } = this;
  //
  //   const isCorner = resizeMode === 'corner';
  //   const { x: startX, y: startY } = dragPos.start;
  //   const { x: endX, y: endY } = dragPos.end;
  //
  //   const deltaX = (endX - startX) / zoom;
  //
  //   const [oldMinX, oldMinY, oldMaxX, oldMaxY] = _commonBound;
  //   const oldCommonW = oldMaxX - oldMinX;
  //   const oldCommonH = oldMaxY - oldMinY;
  //   let [minX, minY, maxX, maxY] = _commonBound;
  //   let width = 0;
  //   let height = 0;
  //   let flipX = false;
  //   let flipY = false;
  //
  //   if (isCorner) {
  //     // force equal scaling when multiple elements are selected
  //     shift ||= this._bounds.size > 0;
  //
  //     const deltaY = (endY - startY) / zoom;
  //
  //     switch (direction) {
  //       // TODO
  //       // case HandleDirection.Top: {
  //       //   minY += deltaY;
  //       //   break;
  //       // }
  //       // case HandleDirection.Right: {
  //       //   maxX += deltaX;
  //       //   break;
  //       // }
  //       // case HandleDirection.Bottom: {
  //       //   maxY += deltaY;
  //       //   break;
  //       // }
  //       // case HandleDirection.Left: {
  //       //   minX += deltaX;
  //       //   break;
  //       // }
  //       case HandleDirection.TopLeft: {
  //         minX += deltaX;
  //         minY += deltaY;
  //         break;
  //       }
  //       case HandleDirection.BottomRight: {
  //         maxX += deltaX;
  //         maxY += deltaY;
  //         break;
  //       }
  //       case HandleDirection.TopRight:
  //         maxX += deltaX;
  //         minY += deltaY;
  //         break;
  //       case HandleDirection.BottomLeft: {
  //         minX += deltaX;
  //         maxY += deltaY;
  //         break;
  //       }
  //     }
  //
  //     const dw = maxX - minX;
  //     const dh = maxY - minY;
  //     const scaleX = dw / oldCommonW;
  //     const scaleY = dh / oldCommonH;
  //
  //     flipX = scaleX < 0;
  //     flipY = scaleY < 0;
  //
  //     if (shift && isCorner) {
  //       const bw = Math.abs(dw);
  //       const bh = Math.abs(dh);
  //       const isTall = aspectRatio < bw / bh;
  //       const th = (bw / aspectRatio) * (flipY ? 1 : -1);
  //       const tw = bh * aspectRatio * (flipX ? 1 : -1);
  //
  //       switch (direction) {
  //         // TODO
  //         // case HandleDirection.Top: {
  //         //   break;
  //         // }
  //         // case HandleDirection.Right: {
  //         //   break;
  //         // }
  //         // case HandleDirection.Bottom: {
  //         //   break;
  //         // }
  //         // case HandleDirection.Left: {
  //         //   break;
  //         // }
  //         case HandleDirection.TopLeft: {
  //           if (isTall) minY = maxY + th;
  //           else minX = maxX + tw;
  //           break;
  //         }
  //         case HandleDirection.BottomRight: {
  //           if (isTall) maxY = minY - th;
  //           else maxX = minX - tw;
  //           break;
  //         }
  //         case HandleDirection.TopRight:
  //           if (isTall) minY = maxY + th;
  //           else maxX = minX - tw;
  //           break;
  //         case HandleDirection.BottomLeft: {
  //           if (isTall) maxY = minY - th;
  //           else minX = maxX + tw;
  //           break;
  //         }
  //       }
  //     }
  //   } else {
  //     switch (direction) {
  //       case HandleDirection.Left:
  //         minX += deltaX;
  //         break;
  //       case HandleDirection.Right:
  //         maxX += deltaX;
  //         break;
  //     }
  //
  //     flipX = maxX < minX;
  //   }
  //
  //   if (flipX) {
  //     const t = maxX;
  //     maxX = minX;
  //     minX = t;
  //   }
  //
  //   if (flipY) {
  //     const t = maxY;
  //     maxY = minY;
  //     minY = t;
  //   }
  //
  //   width = Math.abs(maxX - minX);
  //   height = Math.abs(maxY - minY);
  //
  //   const newCommonBound = {
  //     x: minX,
  //     y: minY,
  //     w: width,
  //     h: height,
  //   };
  //
  //   const newBounds = new Map<string, Bound>();
  //
  //
  //   this._bounds.forEach((bound, id) => {
  //     const { x: oldX, y: oldY, w: oldW, h: oldH } = bound;
  //
  //     const nx = (flipX ? oldMaxX - oldX - oldW : oldX - oldMinX) / oldCommonW;
  //     const ny = (flipY ? oldMaxY - oldY - oldH : oldY - oldMinY) / oldCommonH;
  //
  //     const shapeX = newCommonBound.w * nx + newCommonBound.x;
  //     const shapeY = newCommonBound.h * ny + newCommonBound.y;
  //     const shapeW = newCommonBound.w * (oldW / oldCommonW);
  //     const shapeH = newCommonBound.h * (oldH / oldCommonH);
  //
  //     newBounds.set(id, new Bound(shapeX, shapeY, shapeW, shapeH));
  //   });
  //
  //   this._onResizeMove(newBounds);
  // }

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

    let [minX, minY, maxX, maxY] = _commonBound;
    const originalWidth = maxX - minX;
    const originalheight = maxY - minY;
    let originX = 0;
    let originY = 0;
    let scaleX = 1;
    let scaleY = 1;
    let newWidth = originalWidth;
    let newHeight = originalheight;

    const matrix = new DOMMatrix();

    const newBounds = new Map<string, Bound>();

    if (isCorner) {
      // force equal scaling when multiple elements are selected
      // shift ||= this._bounds.size > 1;

      const deltaY = (endY - startY) / zoom;

      console.log(deltaX, deltaY);

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
          originX = maxX;
          originY = maxY;
          break;
        }
        case HandleDirection.BottomRight: {
          maxX += deltaX;
          maxY += deltaY;
          originX = minX;
          originY = minY;
          break;
        }
        case HandleDirection.TopRight: {
          maxX += deltaX;
          minY += deltaY;
          originX = minX;
          originY = maxY;
          break;
        }
        case HandleDirection.BottomLeft: {
          minX += deltaX;
          maxY += deltaY;
          originX = maxX;
          originY = minY;
          break;
        }
      }

      newWidth = maxX - minX;
      newHeight = maxY - minY;
      scaleX = newWidth / originalWidth;
      scaleY = newHeight / originalheight;

      if (shift) {
        const newAspectRatio = Math.abs(newWidth / newHeight);
        const isTall = aspectRatio < newAspectRatio;
        if (isTall) {
          scaleY = Math.abs(scaleX) * (scaleY < 0 ? -1 : 1);
        } else {
          scaleX = Math.abs(scaleY) * (scaleX < 0 ? -1 : 1);
        }
      }
    } else {
      switch (direction) {
        case HandleDirection.Left:
          minX += deltaX;
          originX = maxX;
          break;
        case HandleDirection.Right:
          maxX += deltaX;
          originX = minX;
          break;
      }

      newWidth = maxX - minX;
      newHeight = maxY - minY;
      scaleX = newWidth / originalWidth;
      scaleY = newHeight / originalheight;
    }

    matrix.scaleSelf(scaleX, scaleY, 1, originX, originY, 0);

    this._bounds.forEach((bound, id) => {
      const { x: oldX, y: oldY, w: oldW, h: oldH } = bound;
      const cx = oldX + oldW / 2;
      const cy = oldY + oldH / 2;

      const newWidth = Math.abs(oldW * scaleX);
      const newHeight = Math.abs(oldH * scaleY);
      const point = new DOMPoint(cx, cy).matrixTransform(matrix);

      newBounds.set(
        id,
        new Bound(
          point.x - newWidth / 2,
          point.y - newHeight / 2,
          newWidth,
          newHeight
        )
      );
    });

    this._onResizeMove(newBounds);
  }

  private _rotate(x: number, y: number, shift = false) {
    const {
      _commonBound: [minX, minY, maxX, maxY],
      _dragPos: {
        start: { x: startX, y: startY },
        end: { x: centerX, y: centerY },
      },
    } = this;

    // start radius, end radius, diff radius
    const sr = Math.atan2(startY - centerY, startX - centerX);
    const er = Math.atan2(y - centerY, x - centerX);
    const dr = ((er - sr) * 180) / Math.PI;

    this._onRotateMove(
      // center of element in suface
      { x: minX + (maxX - minX) / 2, y: minY + (maxY - minY) / 2 },
      dr
    );

    this._dragPos.start = { x, y };
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

    this._rotated = direction.startsWith('rotate-');

    if (this._rotated) {
      const rect = document
        .querySelector('edgeless-selected-rect')
        ?.shadowRoot?.querySelector('.affine-edgeless-selected-rect')
        ?.getBoundingClientRect();
      assertExists(rect);
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      // center of `selected-rect` in viewport
      this._dragPos.end = { x, y };
    }

    const _onPointerMove = ({ x, y, shiftKey }: PointerEvent) => {
      if (resizeMode === 'none') return;

      this._shiftKey ||= shiftKey;

      if (this._rotated) {
        this._rotate(x, y, this._shiftKey);
        return;
      }

      this._dragPos.end = { x, y };

      this._resize(this._shiftKey);
    };

    const _onPointerUp = (_: PointerEvent) => {
      this._onResizeEnd();

      this._bounds.clear();
      this._dragPos = { start: { x: 0, y: 0 }, end: { x: 0, y: 0 } };
      this._commonBound = [0, 0, 0, 0];

      document.removeEventListener('pointermove', _onPointerMove);
      document.removeEventListener('pointerup', _onPointerUp);
    };
    document.addEventListener('pointermove', _onPointerMove);
    document.addEventListener('pointerup', _onPointerUp);
  };

  onPressShiftKey(pressed: boolean) {
    if (this._shiftKey === pressed) return;
    this._shiftKey = pressed;

    if (this._rotated) {
      const { x, y } = this._dragPos.end;
      this._rotate(x, y, this._shiftKey);
      return;
    }

    this._resize(this._shiftKey);
  }
}
