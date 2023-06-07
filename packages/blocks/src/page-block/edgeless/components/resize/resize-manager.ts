import { Bound } from '@blocksuite/phasor';
import { getCommonBound } from '@blocksuite/phasor';
import { assertExists } from '@blocksuite/store';

import type { IPoint } from '../../../std.js';
import { HandleDirection, type ResizeMode } from './resize-handles.js';

type ResizeMoveHandler = (
  bounds: Map<
    string,
    {
      bound: Bound;
      flip: IPoint;
    }
  >
) => void;

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

  private _bounds = new Map<
    string,
    {
      bound: Bound;
      flip: IPoint;
    }
  >();
  /** Use [minX, minY, maxX, maxY] for convenience */
  private _commonBound = [0, 0, 0, 0];

  private _aspectRatio = 1;
  private _resizeMode = 'none';
  private _zoom = 1;

  private _shiftKey = false;

  private _rotate = 0;
  private _rotated = false;

  private _target: HTMLElement | null = null;

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
  private _onResize(shift = false) {
    const {
      _aspectRatio: aspectRatio,
      _dragDirection: direction,
      _dragPos: dragPos,
      _resizeMode,
      _zoom,
      _commonBound,
      _rotate,
      _target,
    } = this;

    assertExists(_target);

    const isCorner = _resizeMode === 'corner';
    const { x: startX, y: startY } = dragPos.start;
    const { x: endX, y: endY } = dragPos.end;

    let minX = _commonBound[0];
    let maxX = _commonBound[2];
    const minY = _commonBound[1];
    const maxY = _commonBound[3];
    const originalWidth = maxX - minX;
    const originalHeight = maxY - minY;
    const originalCenterX = minX + originalWidth / 2;
    const originalCenterY = minY + originalHeight / 2;
    const scale = { x: 1, y: 1 };
    const origin = { x: 0, y: 0 };
    let newWidth = originalWidth;
    let newHeight = originalHeight;
    let centerX = originalCenterX;
    let centerY = originalCenterY;

    const targetParent = _target.parentElement;
    assertExists(targetParent);

    const deltaX = (endX - startX) / _zoom;

    const m0 = new DOMMatrix()
      .translateSelf(originalCenterX, originalCenterY)
      .rotateSelf(_rotate)
      .translateSelf(-originalCenterX, -originalCenterY);

    if (isCorner) {
      const deltaY = (endY - startY) / _zoom;

      switch (direction) {
        case HandleDirection.TopLeft: {
          const a = { x: minX, y: minY };
          const c = { x: maxX, y: maxY };

          origin.x = c.x;
          origin.y = c.y;

          const a1 = new DOMPoint(a.x, a.y).matrixTransform(m0);
          const c1 = new DOMPoint(c.x, c.y).matrixTransform(m0);

          a1.x += deltaX;
          a1.y += deltaY;

          const cx1 = (a1.x + c1.x) / 2;
          const cy1 = (a1.y + c1.y) / 2;

          const m1 = new DOMMatrix()
            .translateSelf(cx1, cy1)
            .rotateSelf(-_rotate)
            .translateSelf(-cx1, -cy1);

          const a2 = new DOMPoint(a1.x, a1.y).matrixTransform(m1);
          const c2 = new DOMPoint(c1.x, c1.y).matrixTransform(m1);

          newWidth = c2.x - a2.x;
          newHeight = c2.y - a2.y;
          centerX = (c2.x + a2.x) / 2;
          centerY = (c2.y + a2.y) / 2;

          scale.x = newWidth / originalWidth;
          scale.y = newHeight / originalHeight;
          break;
        }
        case HandleDirection.TopRight: {
          const b = { x: maxX, y: minY };
          const d = { x: minX, y: maxY };

          origin.x = d.x;
          origin.y = d.y;

          const b1 = new DOMPoint(b.x, b.y).matrixTransform(m0);
          const d1 = new DOMPoint(d.x, d.y).matrixTransform(m0);

          b1.x += deltaX;
          b1.y += deltaY;

          const cx1 = (b1.x + d1.x) / 2;
          const cy1 = (b1.y + d1.y) / 2;

          const m1 = new DOMMatrix()
            .translateSelf(cx1, cy1)
            .rotateSelf(-_rotate)
            .translateSelf(-cx1, -cy1);

          const b2 = new DOMPoint(b1.x, b1.y).matrixTransform(m1);
          const d2 = new DOMPoint(d1.x, d1.y).matrixTransform(m1);

          newWidth = b2.x - d2.x;
          newHeight = d2.y - b2.y;
          centerX = (b2.x + d2.x) / 2;
          centerY = (b2.y + d2.y) / 2;

          scale.x = newWidth / originalWidth;
          scale.y = newHeight / originalHeight;
          break;
        }
        case HandleDirection.BottomRight: {
          const a = { x: minX, y: minY };
          const c = { x: maxX, y: maxY };

          origin.x = a.x;
          origin.y = a.y;

          const a1 = new DOMPoint(a.x, a.y).matrixTransform(m0);
          const c1 = new DOMPoint(c.x, c.y).matrixTransform(m0);

          c1.x += deltaX;
          c1.y += deltaY;

          const cx1 = (a1.x + c1.x) / 2;
          const cy1 = (a1.y + c1.y) / 2;

          const m1 = new DOMMatrix()
            .translateSelf(cx1, cy1)
            .rotateSelf(-_rotate)
            .translateSelf(-cx1, -cy1);

          const a2 = new DOMPoint(a1.x, a1.y).matrixTransform(m1);
          const c2 = new DOMPoint(c1.x, c1.y).matrixTransform(m1);

          newWidth = c2.x - a2.x;
          newHeight = c2.y - a2.y;
          centerX = (c2.x + a2.x) / 2;
          centerY = (c2.y + a2.y) / 2;

          scale.x = newWidth / originalWidth;
          scale.y = newHeight / originalHeight;
          break;
        }
        case HandleDirection.BottomLeft: {
          const b = { x: maxX, y: minY };
          const d = { x: minX, y: maxY };

          origin.x = b.x;
          origin.y = b.y;

          const b1 = new DOMPoint(b.x, b.y).matrixTransform(m0);
          const d1 = new DOMPoint(d.x, d.y).matrixTransform(m0);

          d1.x += deltaX;
          d1.y += deltaY;

          const cx1 = (b1.x + d1.x) / 2;
          const cy1 = (b1.y + d1.y) / 2;

          const m1 = new DOMMatrix()
            .translateSelf(cx1, cy1)
            .rotateSelf(-_rotate)
            .translateSelf(-cx1, -cy1);

          const b2 = new DOMPoint(b1.x, b1.y).matrixTransform(m1);
          const d2 = new DOMPoint(d1.x, d1.y).matrixTransform(m1);

          newWidth = b2.x - d2.x;
          newHeight = d2.y - b2.y;
          centerX = (b2.x + d2.x) / 2;
          centerY = (b2.y + d2.y) / 2;

          scale.x = newWidth / originalWidth;
          scale.y = newHeight / originalHeight;
          break;
        }
      }

      if (shift) {
        const newAspectRatio = Math.abs(newWidth / newHeight);
        const isTall = aspectRatio < newAspectRatio;
        if (isTall) {
          scale.y = Math.abs(scale.x) * (scale.y < 0 ? -1 : 1);
        } else {
          scale.x = Math.abs(scale.y) * (scale.x < 0 ? -1 : 1);
        }
      }
    } else {
      switch (direction) {
        case HandleDirection.Left:
          minX += deltaX;
          origin.x = maxX;
          break;
        case HandleDirection.Right:
          maxX += deltaX;
          origin.x = minX;
          break;
      }

      newWidth = maxX - minX;
      newHeight = maxY - minY;
      scale.x = newWidth / originalWidth;
      scale.y = newHeight / originalHeight;
    }

    const newBounds = new Map<
      string,
      {
        bound: Bound;
        flip: IPoint;
      }
    >();

    // TODO: on same rotate
    if (isCorner && this._bounds.size === 1) {
      this._bounds.forEach(({ bound: { x, y, w, h }, flip }, id) => {
        const newWidth = Math.abs(w * scale.x);
        const newHeight = Math.abs(h * scale.y);

        newBounds.set(id, {
          bound: new Bound(
            centerX - newWidth / 2,
            centerY - newHeight / 2,
            newWidth,
            newHeight
          ),
          flip: {
            x: flip.x,
            y: flip.y,
          },
        });
      });

      this._onResizeMove(newBounds);
      return;
    }

    const m2 = new DOMMatrix().scaleSelf(
      scale.x,
      scale.y,
      1,
      origin.x,
      origin.y,
      0
    );

    this._bounds.forEach(({ bound: { x, y, w, h }, flip }, id) => {
      const cx = x + w / 2;
      const cy = y + h / 2;
      const center = new DOMPoint(cx, cy).matrixTransform(m2);
      const newWidth = Math.abs(w * scale.x);
      const newHeight = Math.abs(h * scale.y);

      newBounds.set(id, {
        bound: new Bound(
          center.x - newWidth / 2,
          center.y - newHeight / 2,
          newWidth,
          newHeight
        ),
        flip: {
          x: flip.x * (scale.x < 0 ? -1 : 1),
          y: flip.y * (scale.y < 0 ? -1 : 1),
        },
      });
    });

    this._onResizeMove(newBounds);
  }

  private _onRotate(x: number, y: number, shift = false) {
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
    bounds: Map<
      string,
      {
        bound: Bound;
        flip: IPoint;
      }
    >,
    resizeMode: ResizeMode,
    zoom: number,
    rotate: number
  ) => {
    // Prevent selection action from being triggered
    e.stopPropagation();

    this._target = e.target as HTMLElement;

    this._bounds = bounds;

    const { x, y, w, h } = getCommonBound([
      ...Array.from(bounds.values()).map(value => value.bound),
    ]) as Bound;
    this._commonBound = [x, y, x + w, y + h];

    this._dragDirection = direction;
    this._dragPos.start = { x: e.x, y: e.y };
    this._dragPos.end = { x: e.x, y: e.y };
    this._aspectRatio = w / h;
    this._resizeMode = resizeMode;
    this._zoom = zoom;
    this._rotate = rotate;

    this._rotated = this._target.classList.contains('rotate');
    // console.log(this._rotated);

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
        this._onRotate(x, y, this._shiftKey);
        return;
      }

      this._dragPos.end = { x, y };

      this._onResize(this._shiftKey);
    };

    const _onPointerUp = (_: PointerEvent) => {
      this._onResizeEnd();

      this._bounds.clear();
      this._dragPos = { start: { x: 0, y: 0 }, end: { x: 0, y: 0 } };
      this._commonBound = [0, 0, 0, 0];
      this._rotate = 0;
      this._target = null;

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
      this._onRotate(x, y, this._shiftKey);
      return;
    }

    this._onResize(this._shiftKey);
  }
}
