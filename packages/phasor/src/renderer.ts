import { MIN_ZOOM } from './consts.js';
import type { PhasorElement } from './elements/index.js';
import { GridManager } from './grid.js';
import { intersects } from './utils/hit-utils.js';

export class Renderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  gridManager = new GridManager();

  private _width = 0;
  private _height = 0;

  private _zoom = 1.0;
  private _centerX = 0.0;
  private _centerY = 0.0;
  private _shouldUpdate = false;

  private _canvasResizeObserver!: ResizeObserver;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    this._initSize();
    this.setCenter(this.width / 2, this.height / 2);

    this._loop();

    this._canvasResizeObserver = new ResizeObserver(() => {
      const oldWidth = this.width;
      const oldHeight = this.height;

      this._initSize();

      this.setCenter(
        this._centerX - (oldWidth - this.width) / 2,
        this._centerY - (oldHeight - this.height) / 2
      );

      // Re-render once canvas's size changed. Otherwise, it will flicker.
      // Because the observer is called after the element rendered, but the canvas's content is not flush.
      this._render();
      this._shouldUpdate = false;
    });
    this._canvasResizeObserver.observe(this.canvas);
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

  applyDeltaZoom(delta: number) {
    const val = (this.zoom * (100 + delta)) / 100;
    const newZoom = Math.max(val, MIN_ZOOM);
    this._zoom = newZoom;
    this._shouldUpdate = true;
  }

  setViewport(centerX: number, centerY: number, zoom: number) {
    this._centerX = centerX;
    this._centerY = centerY;
    this._zoom = zoom;
    this._shouldUpdate = true;
  }

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

  private _initSize() {
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
    this._canvasResizeObserver.disconnect();
  }
}
