import { Bound } from '@blocksuite/phasor';
import { assertExists } from '@blocksuite/store';

import type { IPoint } from '../../../std.js';
import { NOTE_MIN_WIDTH } from '../utils.js';
import { HandleDirection, type ResizeMode } from './resize-handles.js';

// 15deg
const SHIFT_LOCKING_ANGLE = Math.PI / 12;

type DragStartHandler = () => void;
type DragEndHandler = () => void;

type ResizeMoveHandler = (
  bounds: Map<
    string,
    {
      bound: Bound;
      flip: IPoint;
      rotate: number;
    }
  >,
  rect?: Bound
) => void;

type RotateMoveHandler = (point: IPoint, rotate: number) => void;

export class HandleResizeManager {
  private _onDragStart: DragStartHandler;
  private _onResizeMove: ResizeMoveHandler;
  private _onRotateMove: RotateMoveHandler;
  private _onDragEnd: DragEndHandler;
  private _dragDirection: HandleDirection = HandleDirection.Left;
  private _dragPos: {
    start: { x: number; y: number };
    end: { x: number; y: number };
  } = {
    start: { x: 0, y: 0 },
    end: { x: 0, y: 0 },
  };

  private _rotate = 0;
  private _originalRect = new DOMRect();
  private _currentRect = new DOMRect();
  private _origin: { x: number; y: number } = { x: 0, y: 0 };
  private _resizeMode = 'none';
  private _zoom = 1;

  private _bounds = new Map<
    string,
    {
      bound: Bound;
      flip: IPoint;
      rotate: number;
    }
  >();

  private _aspectRatio = 1;
  private _locked = false;
  private _shiftKey = false;
  private _rotation = false;
  private _target: HTMLElement | null = null;

  constructor(
    onDragStart: DragStartHandler,
    onResizeMove: ResizeMoveHandler,
    onRotateMove: RotateMoveHandler,
    onDragEnd: DragEndHandler
  ) {
    this._onDragStart = onDragStart;
    this._onResizeMove = onResizeMove;
    this._onRotateMove = onRotateMove;
    this._onDragEnd = onDragEnd;
  }

  get currentRect() {
    return this._currentRect;
  }

  get originalRect() {
    return this._originalRect;
  }

  set originalRect(rect: DOMRect) {
    this._originalRect = rect;
    this._aspectRatio = rect.width / rect.height;
    this._currentRect = new DOMRect(rect.x, rect.y, rect.width, rect.height);
  }

  updateState(
    resizeMode: ResizeMode,
    rotate: number,
    zoom: number,
    originalRect?: DOMRect
  ) {
    this._resizeMode = resizeMode;
    this._rotate = rotate;
    this._zoom = zoom;

    if (originalRect) {
      this.originalRect = originalRect;
    }
  }

  updateRect(delta: { x: number; y: number }) {
    this._currentRect.x += delta.x;
    this._currentRect.y += delta.y;
    this._originalRect.x = this._currentRect.x;
    this._originalRect.y = this._currentRect.y;
    return this._originalRect;
  }

  updateBounds(
    bounds: Map<
      string,
      {
        bound: Bound;
        flip: IPoint;
        rotate: number;
      }
    >
  ) {
    this._bounds = bounds;
  }

  private _onResize(shiftKey = false) {
    const {
      _aspectRatio,
      _dragDirection,
      _dragPos,
      _rotate,
      _resizeMode,
      _zoom,
      _target,
      _originalRect,
      _currentRect,
    } = this;

    assertExists(_target);

    const isCorner = _resizeMode === 'corner';
    const {
      start: { x: startX, y: startY },
      end: { x: endX, y: endY },
    } = _dragPos;

    const { left: minX, top: minY, right: maxX, bottom: maxY } = _originalRect;
    const original = {
      w: maxX - minX,
      h: maxY - minY,
      cx: (minX + maxX) / 2,
      cy: (minY + maxY) / 2,
    };
    const rect = { ...original };
    const scale = { x: 1, y: 1 };
    const flip = { x: 1, y: 1 };
    const direction = { x: 1, y: 1 };
    const fixedPoint = new DOMPoint(0, 0);
    const draggingPoint = new DOMPoint(0, 0);

    const deltaX = (endX - startX) / _zoom;

    const m0 = new DOMMatrix()
      .translateSelf(original.cx, original.cy)
      .rotateSelf(_rotate)
      .translateSelf(-original.cx, -original.cy);

    if (isCorner) {
      switch (_dragDirection) {
        case HandleDirection.TopLeft: {
          direction.x = -1;
          direction.y = -1;
          fixedPoint.x = maxX;
          fixedPoint.y = maxY;
          draggingPoint.x = minX;
          draggingPoint.y = minY;
          break;
        }
        case HandleDirection.TopRight: {
          direction.x = 1;
          direction.y = -1;
          fixedPoint.x = minX;
          fixedPoint.y = maxY;
          draggingPoint.x = maxX;
          draggingPoint.y = minY;
          break;
        }
        case HandleDirection.BottomRight: {
          direction.x = 1;
          direction.y = 1;
          fixedPoint.x = minX;
          fixedPoint.y = minY;
          draggingPoint.x = maxX;
          draggingPoint.y = maxY;
          break;
        }
        case HandleDirection.BottomLeft: {
          direction.x = -1;
          direction.y = 1;
          fixedPoint.x = maxX;
          fixedPoint.y = minY;
          draggingPoint.x = minX;
          draggingPoint.y = maxY;
          break;
        }
      }

      // force adjustment by aspect ratio
      shiftKey ||= this._bounds.size > 1;

      const deltaY = (endY - startY) / _zoom;
      const fp = fixedPoint.matrixTransform(m0);
      let dp = draggingPoint.matrixTransform(m0);

      dp.x += deltaX;
      dp.y += deltaY;

      const cx = (fp.x + dp.x) / 2;
      const cy = (fp.y + dp.y) / 2;

      const m1 = new DOMMatrix()
        .translateSelf(cx, cy)
        .rotateSelf(-_rotate)
        .translateSelf(-cx, -cy);

      const f = fp.matrixTransform(m1);
      const d = dp.matrixTransform(m1);

      switch (_dragDirection) {
        case HandleDirection.TopLeft: {
          rect.w = f.x - d.x;
          rect.h = f.y - d.y;
          break;
        }
        case HandleDirection.TopRight: {
          rect.w = d.x - f.x;
          rect.h = f.y - d.y;
          break;
        }
        case HandleDirection.BottomRight: {
          rect.w = d.x - f.x;
          rect.h = d.y - f.y;
          break;
        }
        case HandleDirection.BottomLeft: {
          rect.w = f.x - d.x;
          rect.h = d.y - f.y;
          break;
        }
      }

      rect.cx = (d.x + f.x) / 2;
      rect.cy = (d.y + f.y) / 2;
      scale.x = rect.w / original.w;
      scale.y = rect.h / original.h;
      flip.x = scale.x < 0 ? -1 : 1;
      flip.y = scale.y < 0 ? -1 : 1;

      // lock aspect ratio
      if (shiftKey) {
        const newAspectRatio = Math.abs(rect.w / rect.h);
        if (_aspectRatio < newAspectRatio) {
          scale.y = Math.abs(scale.x) * flip.y;
          rect.h = scale.y * original.h;
        } else {
          scale.x = Math.abs(scale.y) * flip.x;
          rect.w = scale.x * original.w;
        }
        draggingPoint.x = fixedPoint.x + rect.w * direction.x;
        draggingPoint.y = fixedPoint.y + rect.h * direction.y;

        dp = draggingPoint.matrixTransform(m0);

        rect.cx = (fp.x + dp.x) / 2;
        rect.cy = (fp.y + dp.y) / 2;
      }
    } else {
      // handle frames
      switch (_dragDirection) {
        case HandleDirection.Left: {
          direction.x = -1;
          fixedPoint.x = maxX;
          draggingPoint.x = minX + deltaX;
          rect.w = fixedPoint.x - draggingPoint.x;
          break;
        }
        case HandleDirection.Right: {
          direction.x = 1;
          fixedPoint.x = minX;
          draggingPoint.x = maxX + deltaX;
          rect.w = draggingPoint.x - fixedPoint.x;
          break;
        }
      }

      scale.x = rect.w / original.w;
      flip.x = scale.x < 0 ? -1 : 1;

      if (Math.abs(rect.w) < NOTE_MIN_WIDTH) {
        rect.w = NOTE_MIN_WIDTH * flip.x;
        scale.x = rect.w / original.w;
        draggingPoint.x = fixedPoint.x + rect.w * direction.x;
      }

      rect.cx = (draggingPoint.x + fixedPoint.x) / 2;
    }

    const { x: flipX, y: flipY } = flip;

    const width = Math.abs(rect.w);
    const height = Math.abs(rect.h);
    const x = rect.cx - width / 2;
    const y = rect.cy - height / 2;

    _currentRect.x = x;
    _currentRect.y = y;
    _currentRect.width = width;
    _currentRect.height = height;

    const newBounds = new Map<
      string,
      {
        bound: Bound;
        flip: IPoint;
        rotate: number;
      }
    >();

    let process: (
      value: { bound: Bound; flip: IPoint; rotate: number },
      key: string
    ) => void;

    if (isCorner) {
      if (this._bounds.size === 1) {
        process = ({ flip, rotate = 0 }, id) => {
          newBounds.set(id, {
            bound: new Bound(x, y, width, height),
            flip: {
              x: flipX * flip.x,
              y: flipY * flip.y,
            },
            rotate,
          });
        };
      } else {
        const fp = fixedPoint.matrixTransform(m0);
        const m2 = new DOMMatrix()
          .translateSelf(fp.x, fp.y)
          .rotateSelf(_rotate)
          .translateSelf(-fp.x, -fp.y)
          .scaleSelf(scale.x, scale.y, 1, fp.x, fp.y, 0)
          .translateSelf(fp.x, fp.y)
          .rotateSelf(-_rotate)
          .translateSelf(-fp.x, -fp.y);

        // see https://www.mathworks.com/help/images/matrix-representation-of-geometric-transformations.html
        const flipXY = flipX * flipY;
        const flipAngle = flipXY < 0 ? _rotate * 2 : 0;

        // TODO: on same rotate
        process = ({ bound: { x, y, w, h }, flip, rotate = 0 }, id) => {
          const cx = x + w / 2;
          const cy = y + h / 2;
          const center = new DOMPoint(cx, cy).matrixTransform(m2);
          const newWidth = Math.abs(w * scale.x);
          const newHeight = Math.abs(h * scale.y);

          // adjust angle
          rotate -= flipAngle;
          rotate *= flipXY;

          newBounds.set(id, {
            bound: new Bound(
              center.x - newWidth / 2,
              center.y - newHeight / 2,
              newWidth,
              newHeight
            ),
            flip: {
              x: flipX * flip.x,
              y: flipY * flip.y,
            },
            rotate,
          });
        };
      }
    } else {
      // include notes, <---->
      const m2 = new DOMMatrix().scaleSelf(
        scale.x,
        scale.y,
        1,
        fixedPoint.x,
        fixedPoint.y,
        0
      );
      process = ({ bound: { x, y, w, h }, flip, rotate = 0 }, id) => {
        const cx = x + w / 2;
        const cy = y + h / 2;

        const center = new DOMPoint(cx, cy).matrixTransform(m2);

        let newWidth: number;
        let newHeight: number;

        // TODO: determine if it is a note
        if (rotate) {
          const m = new DOMMatrix()
            .translateSelf(cx, cy)
            .rotateSelf(rotate)
            .translateSelf(-cx, -cy);

          const { width: rw } = new DOMQuad(
            new DOMPoint(x, y).matrixTransform(m),
            new DOMPoint(x + w, y).matrixTransform(m),
            new DOMPoint(x + w, y + h).matrixTransform(m),
            new DOMPoint(x, y + h).matrixTransform(m)
          ).getBounds();
          const hrw = rw / 2;

          center.y = cy;

          if (_currentRect.width <= rw) {
            newWidth = w * (_currentRect.width / rw);
            newHeight = newWidth / (w / h);
            center.x = _currentRect.left + _currentRect.width / 2;
          } else {
            const p = (cx - hrw - _originalRect.left) / _originalRect.width;
            const lx = _currentRect.left + p * _currentRect.width + hrw;
            center.x = Math.max(
              _currentRect.left + hrw,
              Math.min(lx, _currentRect.left + _currentRect.width - hrw)
            );
            newWidth = w;
            newHeight = h;
          }
        } else {
          newWidth = Math.abs(w * scale.x);
          newHeight = Math.abs(h * scale.y);
        }

        newBounds.set(id, {
          bound: new Bound(
            center.x - newWidth / 2,
            center.y - newHeight / 2,
            newWidth,
            newHeight
          ),
          flip: {
            x: flipX * flip.x,
            y: flipY * flip.y,
          },
          rotate,
        });
      };
    }

    this._bounds.forEach(process);
    this._onResizeMove(newBounds);
  }

  private _onRotate(shiftKey = false) {
    const {
      _originalRect: { left: minX, top: minY, right: maxX, bottom: maxY },
      _dragPos: {
        start: { x: startX, y: startY },
        end: { x: endX, y: endY },
      },
      _origin: { x: centerX, y: centerY },
      _rotate,
    } = this;

    const startRad = Math.atan2(startY - centerY, startX - centerX);
    const endRad = Math.atan2(endY - centerY, endX - centerX);
    let deltaRad = endRad - startRad;

    // snap angle
    // 15deg * n = 0, 15, 30, 45, ... 360
    if (shiftKey) {
      const prevRad = (_rotate * Math.PI) / 180;
      let angle = prevRad + deltaRad;
      angle += SHIFT_LOCKING_ANGLE / 2;
      angle -= angle % SHIFT_LOCKING_ANGLE;
      deltaRad = angle - prevRad;
    }

    const delta = (deltaRad * 180) / Math.PI;

    let x = endX;
    let y = endY;
    if (shiftKey) {
      const point = new DOMPoint(startX, startY).matrixTransform(
        new DOMMatrix()
          .translateSelf(centerX, centerY)
          .rotateSelf(delta)
          .translateSelf(-centerX, -centerY)
      );
      x = point.x;
      y = point.y;
    }

    this._onRotateMove(
      // center of element in suface
      { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
      delta
    );

    this._dragPos.start = { x, y };
    this._rotate += delta;
  }

  onPointerDown = (e: PointerEvent, direction: HandleDirection) => {
    // Prevent selection action from being triggered
    e.stopPropagation();

    this._locked = false;
    this._target = e.target as HTMLElement;
    this._dragDirection = direction;
    this._dragPos.start = { x: e.x, y: e.y };
    this._dragPos.end = { x: e.x, y: e.y };
    this._rotation = this._target.classList.contains('rotate');

    if (this._rotation) {
      const rect = this._target
        .closest('.affine-edgeless-selected-rect')
        ?.getBoundingClientRect();
      assertExists(rect);
      const { left, top, right, bottom } = rect;
      const x = (left + right) / 2;
      const y = (top + bottom) / 2;
      // center of `selected-rect` in viewport
      this._origin = { x, y };
    }

    this._onDragStart();

    const _onPointerMove = ({ x, y, shiftKey }: PointerEvent) => {
      if (this._resizeMode === 'none') return;

      this._shiftKey ||= shiftKey;
      this._dragPos.end = { x, y };

      if (this._rotation) {
        this._onRotate(this._shiftKey);
        return;
      }

      this._onResize(this._shiftKey);
    };

    const _onPointerUp = (_: PointerEvent) => {
      this._onDragEnd();

      const { x, y, width, height } = this._currentRect;
      this._originalRect = new DOMRect(x, y, width, height);

      this._locked = true;
      this._shiftKey = false;
      this._rotation = false;
      this._dragPos = {
        start: { x: 0, y: 0 },
        end: { x: 0, y: 0 },
      };

      document.removeEventListener('pointermove', _onPointerMove);
      document.removeEventListener('pointerup', _onPointerUp);
    };

    document.addEventListener('pointermove', _onPointerMove);
    document.addEventListener('pointerup', _onPointerUp);
  };

  onPressShiftKey(pressed: boolean) {
    if (this._locked) return;

    if (this._shiftKey === pressed) return;
    this._shiftKey = pressed;

    if (this._rotation) {
      this._onRotate(this._shiftKey);
      return;
    }

    this._onResize(this._shiftKey);
  }
}
