import { Slot } from '@blocksuite/store';

import type { IPoint } from '../../../_common/types.js';
import { clamp } from '../../../_common/utils/math.js';
import { Bound } from '../../../surface-block/utils/bound.js';
import { type IVec2, Vec } from '../../../surface-block/utils/vec.js';

function cutoff(value: number, ref: number, sign: number) {
  if (sign > 0 && value > ref) return ref;
  if (sign < 0 && value < ref) return ref;
  return value;
}

export type ZoomAction = 'fit' | 'out' | 'reset' | 'in';
export const ZOOM_MAX = 6.0;
export const ZOOM_MIN = 0.1;
export const ZOOM_STEP = 0.25;
export const ZOOM_INITIAL = 1.0;

export class Viewport {
  protected _left = 0;
  protected _top = 0;
  protected _width = 0;
  protected _height = 0;
  protected _center: IPoint = { x: 0, y: 0 };
  protected _zoom: number = 1.0;
  protected _rafId: number | null = null;
  protected _el!: HTMLElement;
  private _syncFlag = false;
  protected _cumulativeParentScale = 1;
  protected _locked = false;

  ZOOM_MAX = ZOOM_MAX;
  ZOOM_MIN = ZOOM_MIN;

  viewportUpdated = new Slot<{ zoom: number; center: IVec2 }>();
  viewportMoved = new Slot<IVec2>();
  sizeUpdated = new Slot<{
    width: number;
    height: number;
    left: number;
    top: number;
  }>();

  get left() {
    return this._left;
  }

  get top() {
    return this._top;
  }

  get width() {
    return this._width;
  }

  get height() {
    return this._height;
  }

  get centerX() {
    return this._center.x;
  }

  get centerY() {
    return this._center.y;
  }

  get center() {
    return this._center;
  }

  get zoom() {
    return this._zoom;
  }

  get cumulativeParentScale() {
    return this._cumulativeParentScale;
  }

  get viewportX() {
    const { centerX, width, zoom } = this;
    return centerX - width / 2 / zoom;
  }

  get viewportY() {
    const { centerY, height, zoom } = this;
    return centerY - height / 2 / zoom;
  }

  get translateX() {
    return -this.viewportX * this.zoom;
  }

  get translateY() {
    return -this.viewportY * this.zoom;
  }

  get viewportMinXY() {
    const { centerX, centerY, width, height, zoom } = this;
    return {
      x: centerX - width / 2 / zoom,
      y: centerY - height / 2 / zoom,
    };
  }

  get viewportMaxXY() {
    const { centerX, centerY, width, height, zoom } = this;
    return {
      x: centerX + width / 2 / zoom,
      y: centerY + height / 2 / zoom,
    };
  }

  get viewportBounds() {
    const { viewportMinXY, viewportMaxXY } = this;
    return Bound.from({
      ...viewportMinXY,
      w: (viewportMaxXY.x - viewportMinXY.x) / this._cumulativeParentScale,
      h: (viewportMaxXY.y - viewportMinXY.y) / this._cumulativeParentScale,
    });
  }

  get boundingClientRect() {
    return this._el.getBoundingClientRect();
  }

  // Does not allow the user to move and zoom the canvas in copilot tool
  get locked() {
    return this._locked;
  }

  set locked(locked: boolean) {
    this._locked = locked;
  }

  onResize() {
    const oldWidth = this.width;
    const oldHeight = this.height;
    const bbox = this._el.getBoundingClientRect();

    this.setRect(bbox.left, bbox.top, bbox.width, bbox.height);
    this.setCenter(
      this.centerX - (oldWidth - this.width) / 2,
      this.centerY - (oldHeight - this.height) / 2
    );
  }

  setContainer(container: HTMLElement) {
    const rect = container.getBoundingClientRect();

    this._el = container;

    this.setRect(rect.left, rect.top, rect.width, rect.height);
  }

  toViewPointFromClientPoint({ x, y }: IPoint): IPoint {
    const { left, top } = this;
    return {
      x: x - left,
      y: y - top,
    };
  }

  toModelCoord(viewX: number, viewY: number): [number, number] {
    const { viewportX, viewportY, zoom } = this;
    return [viewportX + viewX / zoom, viewportY + viewY / zoom];
  }

  toViewCoord(modelX: number, modelY: number): [number, number] {
    const { viewportX, viewportY, zoom } = this;
    return [(modelX - viewportX) * zoom, (modelY - viewportY) * zoom];
  }

  toModelBound(bound: Bound) {
    const { w, h } = bound;
    const [x, y] = this.toModelCoord(bound.x, bound.y);

    return new Bound(x, y, w / this.zoom, h / this.zoom);
  }

  toViewBound(bound: Bound) {
    const { w, h } = bound;
    const [x, y] = this.toViewCoord(bound.x, bound.y);

    return new Bound(x, y, w * this.zoom, h * this.zoom);
  }

  setCenter(centerX: number, centerY: number) {
    this._center.x = centerX;
    this._center.y = centerY;
    this.viewportUpdated.emit({
      zoom: this.zoom,
      center: Vec.toVec(this.center) as IVec2,
    });
  }

  setZoom(zoom: number, focusPoint?: IPoint) {
    const prevZoom = this.zoom;
    focusPoint = (focusPoint ?? this._center) as IPoint;
    this._zoom = clamp(zoom, this.ZOOM_MIN, this.ZOOM_MAX);
    const newZoom = this.zoom;

    const offset = Vec.sub(Vec.toVec(this.center), Vec.toVec(focusPoint));
    const newCenter = Vec.add(
      Vec.toVec(focusPoint),
      Vec.mul(offset, prevZoom / newZoom)
    );
    this.setCenter(newCenter[0], newCenter[1]);
    this.viewportUpdated.emit({
      zoom: this.zoom,
      center: Vec.toVec(this.center) as IVec2,
    });
  }

  setCumulativeParentScale(scale: number) {
    this._cumulativeParentScale = scale;
  }

  applyDeltaCenter(deltaX: number, deltaY: number) {
    this.setCenter(this.centerX + deltaX, this.centerY + deltaY);
  }

  isInViewport(bound: Bound) {
    const viewportBounds = Bound.from(this.viewportBounds);
    return (
      viewportBounds.contains(bound) ||
      viewportBounds.isIntersectWithBound(bound)
    );
  }

  setViewport(
    newZoom: number,
    newCenter = Vec.toVec(this.center),
    smooth = false
  ) {
    const preZoom = this._zoom;
    if (smooth) {
      const cofficient = preZoom / newZoom;
      if (cofficient === 1) {
        this.smoothTranslate(newCenter[0], newCenter[1]);
      } else {
        const center = [this.centerX, this.centerY];
        const focusPoint = Vec.mul(
          Vec.sub(newCenter, Vec.mul(center, cofficient)),
          1 / (1 - cofficient)
        );
        this.smoothZoom(newZoom, Vec.toPoint(focusPoint));
      }
    } else {
      this._center.x = newCenter[0];
      this._center.y = newCenter[1];
      this.setZoom(newZoom);
    }
  }

  setViewportByBound(
    bound: Bound,
    padding: [number, number, number, number] = [0, 0, 0, 0],
    smooth = false
  ) {
    const [pt, pr, pb, pl] = padding;
    const zoom = clamp(
      (this.width - (pr + pl)) / bound.w,
      this.ZOOM_MIN,
      (this.height - (pt + pb)) / bound.h
    );
    const center = [
      bound.x + (bound.w + pr / zoom) / 2 - pl / zoom / 2,
      bound.y + (bound.h + pb / zoom) / 2 - pt / zoom / 2,
    ];

    this.setViewport(zoom, center, smooth);
  }

  setRect(left: number, top: number, width: number, height: number) {
    this._left = left;
    this._top = top;
    this._width = width;
    this._height = height;
    this.sizeUpdated.emit({
      left,
      top,
      width,
      height,
    });
  }

  smoothZoom(zoom: number, focusPoint?: IPoint) {
    const delta = zoom - this.zoom;
    if (this._rafId) cancelAnimationFrame(this._rafId);

    const innerSmoothZoom = () => {
      this._rafId = requestAnimationFrame(() => {
        const sign = delta > 0 ? 1 : -1;
        const total = 10;
        const step = delta / total;
        const nextZoom = cutoff(this.zoom + step, zoom, sign);

        this.setZoom(nextZoom, focusPoint);
        if (nextZoom != zoom) innerSmoothZoom();
      });
    };
    innerSmoothZoom();
  }

  smoothTranslate(x: number, y: number) {
    const { center } = this;
    const delta = { x: x - center.x, y: y - center.y };
    const innerSmoothTranslate = () => {
      if (this._rafId) cancelAnimationFrame(this._rafId);
      this._rafId = requestAnimationFrame(() => {
        const rate = 10;
        const step = { x: delta.x / rate, y: delta.y / rate };
        const nextCenter = {
          x: this.centerX + step.x,
          y: this.centerY + step.y,
        };
        const signX = delta.x > 0 ? 1 : -1;
        const signY = delta.y > 0 ? 1 : -1;
        nextCenter.x = cutoff(nextCenter.x, x, signX);
        nextCenter.y = cutoff(nextCenter.y, y, signY);
        this.setCenter(nextCenter.x, nextCenter.y);
        if (nextCenter.x != x || nextCenter.y != y) innerSmoothTranslate();
      });
    };
    innerSmoothTranslate();
  }

  sync(viewport: Viewport) {
    const syncViewport = (from: Viewport, to: Viewport) => {
      to._syncFlag = true;
      to.setZoom(from.zoom);
      to.setCenter(from.centerX, from.centerY);
      to._syncFlag = false;
    };
    const syncSize = (from: Viewport, to: Viewport) => {
      to._syncFlag = true;
      to.setRect(from.left, from.top, from.width, from.height);
      to._syncFlag = false;
    };

    const disposables = [
      viewport.viewportUpdated.on(() => {
        if (viewport._syncFlag) return;
        syncViewport(viewport, this);
      }),
      this.viewportUpdated.on(() => {
        if (this._syncFlag) return;
        syncViewport(this, viewport);
      }),
      viewport.sizeUpdated.on(() => {
        if (viewport._syncFlag) return;
        syncSize(viewport, this);
      }),
      this.sizeUpdated.on(() => {
        if (this._syncFlag) return;
        syncSize(this, viewport);
      }),
    ];

    syncViewport(viewport, this);

    return () => {
      disposables.forEach(disposable => disposable.dispose());
    };
  }

  dispose() {
    this.sizeUpdated.dispose();
    this.viewportMoved.dispose();
    this.viewportUpdated.dispose();
  }
}
