import { assertNotExists } from '@blocksuite/global/utils';

import { type IBound, ZOOM_MAX, ZOOM_MIN } from './consts.js';
import type { SurfaceElement } from './elements/surface-element.js';
import { GridManager } from './grid.js';
import { RoughCanvas } from './rough/canvas.js';
import { Bound } from './utils/bound.js';
import { intersects } from './utils/math-utils.js';
import { clamp, getBoundsWithRotation } from './utils/math-utils.js';
import { type IPoint } from './utils/point.js';
import { Vec } from './utils/vec.js';

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
  readonly viewportBounds: IBound;
  readonly boundingClientRect: DOMRect;

  toModelCoord(viewX: number, viewY: number): [number, number];
  toViewCoord(logicalX: number, logicalY: number): [number, number];

  setCenter(centerX: number, centerY: number): void;
  setZoom(zoom: number, focusPoint?: IPoint): void;
  applyDeltaCenter(deltaX: number, deltaY: number): void;
  isInViewport(bound: Bound): boolean;

  addOverlay(overlay: Overlay): void;
  removeOverlay(overlay: Overlay): void;

  getCanvasByBound(bound: IBound): HTMLCanvasElement;
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
  gridManager = new GridManager();

  private _overlays: Set<Overlay> = new Set();

  private _container!: HTMLElement;
  private _left = 0;
  private _top = 0;
  private _width = 0;
  private _height = 0;

  private _zoom = 1.0;
  private _center = { x: 0, y: 0 };
  private _shouldUpdate = false;

  constructor() {
    const canvas = document.createElement('canvas');
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    this.rc = new RoughCanvas(canvas);
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
    return {
      ...viewportMinXY,
      w: viewportMaxXY.x - viewportMinXY.x,
      h: viewportMaxXY.y - viewportMinXY.y,
    };
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
  }

  applyDeltaCenter = (deltaX: number, deltaY: number) => {
    this.setCenter(this.centerX + deltaX, this.centerY + deltaY);
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

  attach(container: HTMLElement) {
    assertNotExists(
      this._container,
      'Phasor surface is attached multiple times'
    );

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

    ctx.clearRect(0, 0, width * dpr, height * dpr);
    ctx.save();

    ctx.setTransform(matrix);

    this._renderByBound(ctx, matrix, rc, viewportBounds);
  }

  private _renderByBound(
    ctx: CanvasRenderingContext2D | null,
    matrix: DOMMatrix,
    rc: RoughCanvas,
    bound: IBound
  ) {
    if (!ctx) return;

    const { gridManager } = this;
    const elements = gridManager.search(bound);
    for (const element of elements) {
      ctx.save();

      const localRecord = element.localRecord;
      if (
        intersects(getBoundsWithRotation(element), bound) &&
        localRecord.display
      ) {
        ctx.globalAlpha = localRecord.opacity;
        const dx = element.x - bound.x;
        const dy = element.y - bound.y;
        element.render(ctx, matrix.translate(dx, dy), rc);
      }

      ctx.restore();
    }

    for (const overlay of this._overlays) {
      ctx.save();
      ctx.translate(-bound.x, -bound.y);
      overlay.render(ctx, rc);
      ctx.restore();
    }

    ctx.restore();
  }

  public getCanvasByBound(bound: IBound): HTMLCanvasElement {
    const dpr = window.devicePixelRatio || 1;
    const canvas = document.createElement('canvas');
    canvas.width = bound.w * dpr;
    canvas.height = bound.h * dpr;

    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    const matrix = new DOMMatrix().scaleSelf(dpr);
    const rc = new RoughCanvas(canvas);

    ctx.setTransform(matrix);

    this._renderByBound(ctx, matrix, rc, bound);

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
