import { Bound, MIN_ZOOM } from './consts.js';
import { GridManager } from './grid.js';
import type { Model } from './models.js';
import { intersects } from './utils.js';

export class Renderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  gridManager = new GridManager();

  readonly width: number;
  readonly height: number;

  private _zoom = 1.0;
  private _centerX = 0.0;
  private _centerY = 0.0;
  private _shouldUpdate = false;

  constructor(canvas: HTMLCanvasElement) {
    const dpr = window.devicePixelRatio;

    canvas.style.width = '100%';
    canvas.style.height = '100%';

    const bbox = canvas.getBoundingClientRect();
    canvas.width = Math.ceil(bbox.width * dpr);
    canvas.height = Math.ceil(bbox.height * dpr);

    this.canvas = canvas;
    this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    this.width = bbox.width;
    this.height = bbox.height;
    this._centerX = this.width / 2;
    this._centerY = this.height / 2;

    this._loop();
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
    return this._centerX - this.width / 2 / this._zoom;
  }

  get viewportY() {
    return this._centerY - this.height / 2 / this._zoom;
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

  addModel(model: Model) {
    this.gridManager.add(model);
    this._shouldUpdate = true;
  }

  invalidateModel(model: Model, newBound: Bound) {
    const { gridManager } = this;
    if (gridManager.boundHasChanged(model, newBound)) {
      gridManager.remove(model);
      gridManager.add(model);
    }
    model.x = newBound.x;
    model.y = newBound.y;
    model.w = newBound.w;
    model.h = newBound.h;
    this._shouldUpdate = true;
  }

  load(models: Model[]) {
    for (let i = 0; i < models.length; i++) {
      this.gridManager.add(models[i]);
    }
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
    ctx.translate(-width / 2 / zoom, -height / 2 / zoom);

    const models = this.gridManager.search(viewBound);
    for (const model of models) {
      const dx = model.x - viewBound.x;
      const dy = model.y - viewBound.y;
      this.ctx.save();
      this.ctx.translate(dx, dy);

      if (intersects(model, viewBound)) {
        model.render(this.ctx);
      }

      this.ctx.restore();
    }

    ctx.restore();
  }
}
