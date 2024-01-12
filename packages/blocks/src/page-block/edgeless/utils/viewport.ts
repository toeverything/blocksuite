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
  protected _container!: HTMLElement;

  viewportUpdated = new Slot<{ zoom: number; center: IVec2 }>();

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
      w: viewportMaxXY.x - viewportMinXY.x,
      h: viewportMaxXY.y - viewportMinXY.y,
    });
  }

  get boundingClientRect() {
    return this._container.getBoundingClientRect();
  }

  setContainer(container: HTMLElement) {
    const { width, height } = container.getBoundingClientRect();

    this._container = container;
    this._width = width;
    this._height = height;
  }

  toModelCoord(viewX: number, viewY: number): [number, number] {
    const { viewportX, viewportY, zoom } = this;
    return [viewportX + viewX / zoom, viewportY + viewY / zoom];
  }

  toViewCoord(modelX: number, modelY: number): [number, number] {
    const { viewportX, viewportY, zoom } = this;
    return [(modelX - viewportX) * zoom, (modelY - viewportY) * zoom];
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
    this._zoom = clamp(zoom, ZOOM_MIN, ZOOM_MAX);
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
      ZOOM_MIN,
      (this.height - (pt + pb)) / bound.h
    );
    const center = [
      bound.x + (bound.w + pr / zoom) / 2 - pl / zoom / 2,
      bound.y + (bound.h + pb / zoom) / 2 - pt / zoom / 2,
    ];

    this.setViewport(zoom, center, smooth);
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
}
