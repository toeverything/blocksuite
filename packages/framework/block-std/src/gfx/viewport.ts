import {
  Bound,
  clamp,
  type IPoint,
  type IVec,
  Slot,
  Vec,
} from '@blocksuite/global/utils';

function cutoff(value: number, ref: number, sign: number) {
  if (sign > 0 && value > ref) return ref;
  if (sign < 0 && value < ref) return ref;
  return value;
}

export const ZOOM_MAX = 6.0;
export const ZOOM_MIN = 0.1;

export class Viewport {
  protected _center: IPoint = { x: 0, y: 0 };

  protected _el!: HTMLElement;

  protected _height = 0;

  protected _left = 0;

  protected _locked = false;

  protected _rafId: number | null = null;

  protected _top = 0;

  protected _width = 0;

  protected _zoom: number = 1.0;

  sizeUpdated = new Slot<{
    width: number;
    height: number;
    left: number;
    top: number;
  }>();

  viewportMoved = new Slot<IVec>();

  viewportUpdated = new Slot<{ zoom: number; center: IVec }>();

  ZOOM_MAX = ZOOM_MAX;

  ZOOM_MIN = ZOOM_MIN;

  get boundingClientRect() {
    return this._el.getBoundingClientRect();
  }

  get center() {
    return this._center;
  }

  get centerX() {
    return this._center.x;
  }

  get centerY() {
    return this._center.y;
  }

  get height() {
    return this._height;
  }

  get left() {
    return this._left;
  }

  // Does not allow the user to move and zoom the canvas in copilot tool
  get locked() {
    return this._locked;
  }

  set locked(locked: boolean) {
    this._locked = locked;
  }

  /**
   * Note this is different from the zoom property.
   * The editor itself may be scaled by outer container which is common in nested editor scenarios.
   * This property is used to calculate the scale of the editor.
   */
  get scale() {
    return this.boundingClientRect.width / this._el.offsetWidth;
  }

  get top() {
    return this._top;
  }

  get translateX() {
    return -this.viewportX * this.zoom;
  }

  get translateY() {
    return -this.viewportY * this.zoom;
  }

  get viewportBounds() {
    const { viewportMinXY, viewportMaxXY } = this;

    return Bound.from({
      ...viewportMinXY,
      w: viewportMaxXY.x - viewportMinXY.x,
      h: viewportMaxXY.y - viewportMinXY.y,
    });
  }

  get viewportMaxXY() {
    const { centerX, centerY, width, height, zoom } = this;
    return {
      x: centerX + width / 2 / zoom,
      y: centerY + height / 2 / zoom,
    };
  }

  get viewportMinXY() {
    const { centerX, centerY, width, height, zoom } = this;
    return {
      x: centerX - width / 2 / zoom,
      y: centerY - height / 2 / zoom,
    };
  }

  get viewportX() {
    const { centerX, width, zoom } = this;
    return centerX - width / 2 / zoom;
  }

  get viewportY() {
    const { centerY, height, zoom } = this;
    return centerY - height / 2 / zoom;
  }

  get width() {
    return this._width;
  }

  get zoom() {
    return this._zoom;
  }

  applyDeltaCenter(deltaX: number, deltaY: number) {
    this.setCenter(this.centerX + deltaX, this.centerY + deltaY);
  }

  dispose() {
    this.sizeUpdated.dispose();
    this.viewportMoved.dispose();
    this.viewportUpdated.dispose();
  }

  getFitToScreenData(
    bounds?: Bound | null,
    padding: [number, number, number, number] = [0, 0, 0, 0],
    maxZoom = ZOOM_MAX,
    fitToScreenPadding = 100
  ) {
    let { centerX, centerY, zoom } = this;

    if (!bounds) {
      return { zoom, centerX, centerY };
    }

    const { x, y, w, h } = bounds;
    const [pt, pr, pb, pl] = padding;
    const { width, height } = this;

    zoom = Math.min(
      (width - fitToScreenPadding - (pr + pl)) / w,
      (height - fitToScreenPadding - (pt + pb)) / h
    );
    zoom = clamp(zoom, ZOOM_MIN, clamp(maxZoom, ZOOM_MIN, ZOOM_MAX));

    centerX = x + (w + pr / zoom) / 2 - pl / zoom / 2;
    centerY = y + (h + pb / zoom) / 2 - pt / zoom / 2;

    return { zoom, centerX, centerY };
  }

  isInViewport(bound: Bound) {
    const viewportBounds = Bound.from(this.viewportBounds);
    return (
      viewportBounds.contains(bound) ||
      viewportBounds.isIntersectWithBound(bound)
    );
  }

  onResize() {
    const { centerX, centerY, zoom, width: oldWidth, height: oldHeight } = this;
    const { left, top } = this._el.getBoundingClientRect();
    const { offsetWidth: width, offsetHeight: height } = this._el;

    this.setRect(left, top, width, height);
    this.setCenter(
      centerX - (oldWidth - width) / zoom / 2,
      centerY - (oldHeight - height) / zoom / 2
    );
  }

  setCenter(centerX: number, centerY: number) {
    this._center.x = centerX;
    this._center.y = centerY;
    this.viewportUpdated.emit({
      zoom: this.zoom,
      center: Vec.toVec(this.center) as IVec,
    });
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
        const center = [this.centerX, this.centerY] as IVec;
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
    ] as IVec;

    this.setViewport(zoom, center, smooth);
  }

  setViewportElm(elm: HTMLElement) {
    const rect = elm.getBoundingClientRect();

    this._el = elm;

    this.setRect(rect.left, rect.top, rect.width, rect.height);
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
      center: Vec.toVec(this.center) as IVec,
    });
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

  toModelBound(bound: Bound) {
    const { w, h } = bound;
    const [x, y] = this.toModelCoord(bound.x, bound.y);

    return new Bound(x, y, w / this.zoom, h / this.zoom);
  }

  toModelCoord(viewX: number, viewY: number): IVec {
    const { viewportX, viewportY, zoom, scale } = this;
    return [viewportX + viewX / zoom / scale, viewportY + viewY / zoom / scale];
  }

  toModelCoordFromClientCoord([x, y]: IVec): IVec {
    const { left, top } = this;
    return this.toModelCoord(x - left, y - top);
  }

  toViewBound(bound: Bound) {
    const { w, h } = bound;
    const [x, y] = this.toViewCoord(bound.x, bound.y);

    return new Bound(x, y, w * this.zoom, h * this.zoom);
  }

  toViewCoord(modelX: number, modelY: number): IVec {
    const { viewportX, viewportY, zoom, scale } = this;
    return [
      (modelX - viewportX) * zoom * scale,
      (modelY - viewportY) * zoom * scale,
    ];
  }

  toViewCoordFromClientCoord([x, y]: IVec): IVec {
    const { left, top } = this;
    return [x - left, y - top];
  }
}
