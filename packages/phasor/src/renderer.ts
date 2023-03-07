import { assertNotExists } from '@blocksuite/global/utils';

import { MIN_ZOOM } from './consts.js';
import type { PhasorElement } from './elements/index.js';
import { GridManager } from './grid.js';
import { intersects } from './utils/hit-utils.js';

export interface SurfaceViewport {
  readonly width: number;
  readonly height: number;
  readonly centerX: number;
  readonly centerY: number;
  readonly zoom: number;
  readonly viewportX: number;
  readonly viewportY: number;

  toModelCoord(viewX: number, viewY: number): [number, number];
  toViewCoord(logicalX: number, logicalY: number): [number, number];

  setCenter(centerX: number, centerY: number): void;
  setZoom(zoom: number): void;
  applyDeltaZoom(delta: number): void;
  applyDeltaCenter(deltaX: number, deltaY: number): void;
}

export class Renderer implements SurfaceViewport {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  gridManager = new GridManager();

  private _container!: HTMLElement;
  private _width = 0;
  private _height = 0;

  private _zoom = 1.0;
  private _centerX = 0.0;
  private _centerY = 0.0;
  private _shouldUpdate = false;

  private _resizeObserver!: ResizeObserver;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
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
    return this._centerX;
  }

  get centerY() {
    return this._centerY;
  }

  get viewportX() {
    return this.centerX - this.width / 2 / this._zoom;
  }

  get viewportY() {
    return this.centerY - this.height / 2 / this._zoom;
  }

  toModelCoord(viewX: number, viewY: number): [number, number] {
    return [
      this.viewportX + viewX / this._zoom,
      this.viewportY + viewY / this._zoom,
    ];
  }

  toViewCoord(logicalX: number, logicalY: number): [number, number] {
    return [
      (logicalX - this.viewportX) * this._zoom,
      (logicalY - this.viewportY) * this._zoom,
    ];
  }

  setCenter(centerX: number, centerY: number) {
    this._centerX = centerX;
    this._centerY = centerY;
    this._shouldUpdate = true;
  }

  setZoom(zoom: number) {
    this._zoom = zoom;
    this._shouldUpdate = true;
  }

  applyDeltaZoom(delta: number) {
    const val = (this.zoom * (100 + delta)) / 100;
    const newZoom = Math.max(val, MIN_ZOOM);
    this.setZoom(newZoom);
  }

  applyDeltaCenter = (deltaX: number, deltaY: number) => {
    this.setCenter(this._centerX + deltaX, this._centerY + deltaY);
  };

  addElement(element: PhasorElement) {
    this.gridManager.add(element);
    this._shouldUpdate = true;
  }

  removeElement(element: PhasorElement) {
    this.gridManager.remove(element);
    this._shouldUpdate = true;
  }

  load(elements: PhasorElement[]) {
    for (let i = 0; i < elements.length; i++) {
      this.gridManager.add(elements[i]);
    }
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
    this._resizeObserver = new ResizeObserver(() => this._onResize());
    this._resizeObserver.observe(this.canvas);

    this._loop();
  }

  private _onResize() {
    const oldWidth = this.width;
    const oldHeight = this.height;

    this._resetSize();

    this.setCenter(
      this._centerX - (oldWidth - this.width) / 2,
      this._centerY - (oldHeight - this.height) / 2
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
    const { ctx, centerX, centerY, width, height, zoom } = this;
    const dpr = window.devicePixelRatio;
    const viewportLeft = centerX - width / 2 / zoom;
    const viewportTop = centerY - height / 2 / zoom;
    const viewportRight = centerX + width / 2 / zoom;
    const viewportBottom = centerY + height / 2 / zoom;
    const viewBound = {
      x: viewportLeft,
      y: viewportTop,
      w: viewportRight - viewportLeft,
      h: viewportBottom - viewportTop,
    };

    ctx.clearRect(0, 0, width * dpr, height * dpr);
    ctx.save();

    ctx.setTransform(zoom * dpr, 0, 0, zoom * dpr, width, height);
    ctx.translate(-width / dpr / zoom, -height / dpr / zoom);

    const elements = this.gridManager.search(viewBound);
    for (const element of elements) {
      const dx = element.x - viewBound.x;
      const dy = element.y - viewBound.y;
      this.ctx.save();
      this.ctx.translate(dx, dy);

      if (intersects(element, viewBound)) {
        element.render(this.ctx);
      }

      this.ctx.restore();
    }

    ctx.restore();
  }

  dispose() {
    this._resizeObserver.disconnect();
  }
}
