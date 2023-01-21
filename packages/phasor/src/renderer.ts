import { IBound, MIN_ZOOM } from './consts.js';
import { GridManager } from './grid.js';
import type { Element } from './elements/index.js';

function intersects(a: IBound, b: IBound): boolean {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}

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

  setCenterZoom(centerX: number, centerY: number, zoom: number) {
    this._centerX = centerX;
    this._centerY = centerY;
    this._zoom = zoom;
    this._shouldUpdate = true;
  }

  addElement(element: Element) {
    this.gridManager.add(element);
    this._shouldUpdate = true;
  }

  removeElement(element: Element) {
    this.gridManager.remove(element);
    this._shouldUpdate = true;
  }

  invalidateElement(element: Element, newBound: IBound) {
    const { gridManager } = this;
    if (gridManager.boundHasChanged(element, newBound)) {
      gridManager.remove(element);
      gridManager.add(element);
    }
    element.x = newBound.x;
    element.y = newBound.y;
    element.w = newBound.w;
    element.h = newBound.h;
    this._shouldUpdate = true;
  }

  load(elements: Element[]) {
    for (let i = 0; i < elements.length; i++) {
      this.gridManager.add(elements[i]);
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
}
