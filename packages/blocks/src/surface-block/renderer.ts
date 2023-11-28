import { Slot } from '@blocksuite/global/utils';

import { type IBound, ZOOM_MAX, ZOOM_MIN } from './consts.js';
import type { SurfaceElement } from './elements/surface-element.js';
import { GridManager } from './grid.js';
import type { LayerManager } from './managers/layer-manager.js';
import { RoughCanvas } from './rough/canvas.js';
import { Bound, getElementsBound } from './utils/bound.js';
import { intersects } from './utils/math-utils.js';
import { clamp, getBoundsWithRotation } from './utils/math-utils.js';
import { type IPoint } from './utils/point.js';
import { type IVec, Vec } from './utils/vec.js';

export interface SurfaceViewport {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  readonly center: IPoint;
  readonly centerX: number;
  readonly centerY: number;
  readonly zoom: number;
  readonly viewportX: number;
  readonly viewportY: number;
  readonly viewportMinXY: IPoint;
  readonly viewportMaxXY: IPoint;
  readonly viewportBounds: Bound;
  readonly boundingClientRect: DOMRect;

  toModelCoord(viewX: number, viewY: number): [number, number];
  toViewCoord(logicalX: number, logicalY: number): [number, number];

  setCenter(centerX: number, centerY: number): void;
  setZoom(zoom: number, focusPoint?: IPoint): void;
  applyDeltaCenter(deltaX: number, deltaY: number): void;
  isInViewport(bound: Bound): boolean;

  addOverlay(overlay: Overlay): void;
  removeOverlay(overlay: Overlay): void;

  getCanvasByBound(
    bound: IBound,
    surfaceElements?: SurfaceElement[]
  ): HTMLCanvasElement;
}

function cutoff(value: number, ref: number, sign: number) {
  if (sign > 0 && value > ref) return ref;
  if (sign < 0 && value < ref) return ref;
  return value;
}

/**
 * An overlay is a layer covered on top of elements,
 * can be used for rendering non-CRDT state indicators.
 */
export abstract class Overlay {
  abstract render(ctx: CanvasRenderingContext2D, rc: RoughCanvas): void;
}

export class Renderer implements SurfaceViewport {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  rc: RoughCanvas;
  gridManager = new GridManager<SurfaceElement>();
  indexedCanvases: HTMLCanvasElement[] = [];
  layerManager: LayerManager;

  slots = {
    viewportUpdated: new Slot<{ zoom: number; center: IVec }>(),
  };

  private _overlays: Set<Overlay> = new Set();
  private _container!: HTMLElement;
  private _left = 0;
  private _top = 0;
  private _width = 0;
  private _height = 0;

  private _zoom = 1.0;
  private _center = { x: 0, y: 0 };
  private _shouldUpdate = false;
  private _rafId: number | null = null;

  constructor(options: { layerManager: LayerManager }) {
    const canvas = document.createElement('canvas');
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    this.rc = new RoughCanvas(canvas);
    this.layerManager = options.layerManager;
  }

  private _emitViewportUpdatedSlot() {
    this.slots.viewportUpdated.emit({
      zoom: this._zoom,
      center: Vec.toVec(this._center),
    });
  }

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

  get zoom() {
    return this._zoom;
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

  isInViewport(bound: Bound) {
    const viewportBounds = Bound.from(this.viewportBounds);
    return (
      viewportBounds.contains(bound) ||
      viewportBounds.isIntersectWithBound(bound)
    );
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
    this._shouldUpdate = true;
    this._emitViewportUpdatedSlot();
  }

  /**
   *
   * @param zoom zoom
   * @param focusPoint canvas coordinate
   */
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
    this._shouldUpdate = true;
    this._emitViewportUpdatedSlot();
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

    const innerSmoothZoom = () => {
      if (this._rafId) cancelAnimationFrame(this._rafId);
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

  applyDeltaCenter = (deltaX: number, deltaY: number) => {
    this.setCenter(this.centerX + deltaX, this.centerY + deltaY);
    this._emitViewportUpdatedSlot();
  };

  addElement(element: SurfaceElement) {
    this.gridManager.add(element);
    this._shouldUpdate = true;
  }

  removeElement(element: SurfaceElement) {
    this.gridManager.remove(element);
    this._shouldUpdate = true;
  }

  load(elements: SurfaceElement[]) {
    for (let i = 0; i < elements.length; i++) {
      this.gridManager.add(elements[i]);
    }
    this._shouldUpdate = true;
  }

  refresh() {
    this._shouldUpdate = true;
  }

  /**
   * Used to attach main canvas, main canvas will always exist
   * @param container
   */
  attach(container: HTMLElement) {
    this._container = container;
    container.appendChild(this.canvas);

    this._resetSize();
    this._loop();
  }

  onResize() {
    const oldWidth = this.width;
    const oldHeight = this.height;

    this._resetSize();

    this.setCenter(
      this.centerX - (oldWidth - this.width) / 2,
      this.centerY - (oldHeight - this.height) / 2
    );

    // Re-render once the canvas size changed. Otherwise it will flicker.
    // Because the observer will be called after DOM element rendered,
    // by the time the canvas content is stale.
    this._render();
    this._shouldUpdate = false;
  }

  setIndexedCanvas(canvas: HTMLCanvasElement[]) {
    this.indexedCanvases = canvas;
  }

  private _setIndexCanvasSize(canvas: HTMLCanvasElement, bound: IBound) {
    const dpr = window.devicePixelRatio;
    const width = bound.w;
    const height = bound.h;

    if (canvas.width !== width * dpr) canvas.width = width * dpr;
    if (canvas.height !== height * dpr) canvas.height = height * dpr;

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.style.transform = `translate(${bound.x * this.zoom}px, ${
      bound.y * this.zoom
    }px) scale(${this.zoom})`;
    canvas.style.transformOrigin = '0 0';
  }

  private _resetSize() {
    const { canvas } = this;
    const dpr = window.devicePixelRatio;

    canvas.style.width = '100%';
    canvas.style.height = '100%';

    const bbox = canvas.getBoundingClientRect();

    canvas.width = Math.ceil(bbox.width * dpr);
    canvas.height = Math.ceil(bbox.height * dpr);

    this._left = bbox.left;
    this._top = bbox.top;
    this._width = bbox.width;
    this._height = bbox.height;

    this._shouldUpdate = true;
  }

  private _loop() {
    requestAnimationFrame(() => {
      if (this._shouldUpdate) {
        this._render();
      }
      this._shouldUpdate = false;
      this._loop();
    });
  }

  private _render() {
    const { ctx, viewportBounds, width, height, rc, zoom } = this;
    const dpr = window.devicePixelRatio;
    const scale = zoom * dpr;
    const matrix = new DOMMatrix().scaleSelf(scale);
    /**
     * if a layer does not have a corresponding canvas
     * its element will be add to this array and drawing on the
     * main canvas
     */
    let fallbackElement: SurfaceElement[] = [];

    this.layerManager.getCanvasLayers().forEach((layer, idx) => {
      if (!this.indexedCanvases[idx]) {
        fallbackElement = fallbackElement.concat(layer.elements);
        return;
      }

      const canvas = this.indexedCanvases[idx];
      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
      const bound = getElementsBound(layer.elements);
      const layerTransform = new DOMMatrix().scaleSelf(dpr);

      this._setIndexCanvasSize(canvas, bound);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();

      if (intersects(viewportBounds, bound)) {
        this._renderByBound(ctx, layerTransform, rc, bound, layer.elements);
      }
    });

    ctx.clearRect(0, 0, width * dpr, height * dpr);
    ctx.save();

    ctx.setTransform(matrix);

    this._renderByBound(ctx, matrix, rc, viewportBounds, fallbackElement, true);
  }

  private _renderByBound(
    ctx: CanvasRenderingContext2D | null,
    matrix: DOMMatrix,
    rc: RoughCanvas,
    bound: IBound,
    surfaceElements?: SurfaceElement[],
    overLay: boolean = false
  ) {
    if (!ctx) return;

    const { gridManager } = this;
    const elements = surfaceElements ?? gridManager.search(bound);
    for (const element of elements) {
      ctx.save();

      const localRecord = element.localRecord;
      const display = localRecord?.display ?? true;
      const opacity = localRecord?.opacity ?? 1;
      if (intersects(getBoundsWithRotation(element), bound) && display) {
        ctx.globalAlpha = opacity;
        const dx = element.x - bound.x;
        const dy = element.y - bound.y;
        element.render(ctx, matrix.translate(dx, dy), rc);
      }

      ctx.restore();
    }

    if (overLay) {
      for (const overlay of this._overlays) {
        ctx.save();
        ctx.translate(-bound.x, -bound.y);
        overlay.render(ctx, rc);
        ctx.restore();
      }
    }

    ctx.restore();
  }

  public getCanvasByBound(
    bound: IBound = this.viewportBounds,
    surfaceElements?: SurfaceElement[],
    canvas?: HTMLCanvasElement,
    clearBeforeDrawing?: boolean,
    withZoom?: boolean
  ): HTMLCanvasElement {
    canvas = canvas || document.createElement('canvas');

    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== bound.w * dpr) canvas.width = bound.w * dpr;
    if (canvas.height !== bound.h * dpr) canvas.height = bound.h * dpr;

    canvas.style.width = `${bound.w}px`;
    canvas.style.height = `${bound.h}px`;

    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    const matrix = new DOMMatrix().scaleSelf(withZoom ? dpr * this.zoom : dpr);
    const rc = new RoughCanvas(canvas);

    if (clearBeforeDrawing) ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(matrix);

    this._renderByBound(ctx, matrix, rc, bound, surfaceElements);

    return canvas;
  }

  public addOverlay(overlay: Overlay) {
    this._overlays.add(overlay);
    this._shouldUpdate = true;
  }

  public removeOverlay(overlay: Overlay) {
    this._overlays.delete(overlay);
    this._shouldUpdate = true;
  }
}
