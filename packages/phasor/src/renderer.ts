import { assertNotExists } from '@blocksuite/global/utils';
import { RoughCanvas } from 'roughjs/bin/canvas.js';

import { type IBound, ZOOM_MAX, ZOOM_MIN } from './consts.js';
import type { SurfaceElement } from './elements/surface-element.js';
import { GridManager } from './grid.js';
import { intersects } from './utils/math-utils.js';
import { clamp } from './utils/math-utils.js';
import { type IPoint, Point } from './utils/point.js';

export interface SurfaceViewport {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  readonly center: Point;
  readonly centerX: number;
  readonly centerY: number;
  readonly zoom: number;
  readonly viewportX: number;
  readonly viewportY: number;
  readonly viewportMinXY: IPoint;
  readonly viewportMaxXY: IPoint;
  readonly viewportBounds: IBound;

  toModelCoord(viewX: number, viewY: number): [number, number];
  toViewCoord(logicalX: number, logicalY: number): [number, number];

  setCenter(centerX: number, centerY: number): void;
  setZoom(zoom: number, focusPoint?: Point): void;
  applyDeltaCenter(deltaX: number, deltaY: number): void;
}

export class Renderer implements SurfaceViewport {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  rc: RoughCanvas;
  gridManager = new GridManager();

  private _container!: HTMLElement;
  private _left = 0;
  private _top = 0;
  private _width = 0;
  private _height = 0;

  private _zoom = 1.0;
  private _center = new Point();
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

  toModelCoord(viewX: number, viewY: number): [number, number] {
    const { viewportX, viewportY, zoom } = this;
    return [viewportX + viewX / zoom, viewportY + viewY / zoom];
  }

  toViewCoord(logicalX: number, logicalY: number): [number, number] {
    const { viewportX, viewportY, zoom } = this;
    return [(logicalX - viewportX) * zoom, (logicalY - viewportY) * zoom];
  }

  setCenter(centerX: number, centerY: number) {
    this._center.set(centerX, centerY);
    this._shouldUpdate = true;
  }

  /**
   *
   * @param zoom zoom
   * @param focusPoint canvas coordinate
   */
  setZoom(zoom: number, focusPoint?: Point) {
    const prevZoom = this.zoom;
    focusPoint = focusPoint ?? this._center;
    this._zoom = clamp(zoom, ZOOM_MIN, ZOOM_MAX);
    const newZoom = this.zoom;

    const offset = this.center.subtract(focusPoint);
    const newCenter = focusPoint.add(offset.scale(prevZoom / newZoom));
    this.setCenter(newCenter.x, newCenter.y);
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
    const { ctx, gridManager, viewportBounds, width, height, rc, zoom } = this;
    const dpr = window.devicePixelRatio;

    ctx.clearRect(0, 0, width * dpr, height * dpr);
    ctx.save();

    ctx.setTransform(zoom * dpr, 0, 0, zoom * dpr, 0, 0);

    const elements = gridManager.search(viewportBounds);
    for (const element of elements) {
      const dx = element.x - viewportBounds.x;
      const dy = element.y - viewportBounds.y;
      ctx.save();
      ctx.translate(dx, dy);

      if (intersects(element, viewportBounds) && element.display) {
        element.render(ctx, rc);
      }

      ctx.restore();
    }

    ctx.restore();
  }
}
