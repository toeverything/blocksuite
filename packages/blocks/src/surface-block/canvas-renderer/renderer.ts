import { requestConnectedFrame } from '../../_common/utils/event.js';
import { Viewport } from '../../page-block/edgeless/utils/viewport.js';
import { type IBound } from '../consts.js';
import type { ElementModel } from '../element-model/base.js';
import type { LayerManager } from '../managers/layer-manager.js';
import { RoughCanvas } from '../rough/canvas.js';
import { intersects } from '../utils/math-utils.js';
import { getBoundsWithRotation } from '../utils/math-utils.js';
import { modelRenderer } from './element-renderer/index.js';

/**
 * An overlay is a layer covered on top of elements,
 * can be used for rendering non-CRDT state indicators.
 */
export abstract class Overlay {
  protected _renderer!: Renderer;

  constructor() {}

  abstract render(ctx: CanvasRenderingContext2D, rc: RoughCanvas): void;

  setRenderer(renderer: Renderer | null) {
    // @ts-ignore
    this._renderer = renderer;
  }
}

type EnvProvider = {
  getVariableColor: (val: string) => string;
  selectedElements?: () => string[];
};

export class Renderer extends Viewport {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  rc: RoughCanvas;
  indexedCanvases: HTMLCanvasElement[] = [];
  layerManager: LayerManager;

  provider: Partial<EnvProvider>;

  private _overlays: Set<Overlay> = new Set();
  private _shouldUpdate = false;

  constructor(options: { layerManager: LayerManager; provider: EnvProvider }) {
    super();

    const canvas = document.createElement('canvas');

    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    this.rc = new RoughCanvas(canvas);
    this.layerManager = options.layerManager;
    this.provider = options.provider ?? {};

    this.viewportUpdated.on(() => {
      this._shouldUpdate = true;
    });

    let sizeUpdatedRafId: number | null = null;
    this.sizeUpdated.on(() => {
      if (sizeUpdatedRafId) return;
      requestConnectedFrame(() => {
        this._resetSize();
        this._render();
        sizeUpdatedRafId = null;
        this._shouldUpdate = false;
      }, this._el);
    });
  }

  getVariableColor(val: string) {
    return this.provider.getVariableColor?.(val) ?? val;
  }

  refresh() {
    this._shouldUpdate = true;
  }

  /**
   * Used to attach main canvas, main canvas will always exist
   * @param container
   */
  attach(container: HTMLElement) {
    this.setContainer(container);
    container.appendChild(this.canvas);

    this._resetSize();
    this._loop();
  }

  setIndexedCanvas(canvases: HTMLCanvasElement[]) {
    this.indexedCanvases = canvases;

    const dpr = window.devicePixelRatio;
    const width = Math.ceil(this._width * dpr);
    const height = Math.ceil(this._height * dpr);

    canvases.forEach(canvas => {
      if (canvas.width === width && canvas.height === height) {
        return;
      }

      canvas.style.setProperty('width', `${this._width}px`);
      canvas.style.setProperty('height', `${this._height}px`);
      canvas.width = width;
      canvas.height = height;
    });
  }

  private _resetSize() {
    const { canvas } = this;
    const dpr = window.devicePixelRatio;

    canvas.style.width = '100%';
    canvas.style.height = '100%';

    const bbox = canvas.getBoundingClientRect();
    const actualWidth = Math.ceil(bbox.width * dpr);
    const actualHeight = Math.ceil(bbox.height * dpr);

    canvas.width = actualWidth;
    canvas.height = actualHeight;

    this.indexedCanvases.forEach(indexedCanvas => {
      indexedCanvas.width = actualWidth;
      indexedCanvas.height = actualHeight;

      indexedCanvas.style.width = `${bbox.width}px`;
      indexedCanvas.style.height = `${bbox.height}px`;
    });

    this._shouldUpdate = true;
  }

  private _loop() {
    requestConnectedFrame(() => {
      if (this._shouldUpdate) {
        this._render();
      }
      this._shouldUpdate = false;
      this._loop();
    }, this._el);
  }

  private _render() {
    const { ctx, viewportBounds, rc, zoom } = this;
    const dpr = window.devicePixelRatio;
    const scale = zoom * dpr;
    const matrix = new DOMMatrix().scaleSelf(scale);
    /**
     * if a layer does not have a corresponding canvas
     * its element will be add to this array and drawing on the
     * main canvas
     */
    let fallbackElement: ElementModel[] = [];

    this.layerManager.getCanvasLayers().forEach((layer, idx) => {
      if (!this.indexedCanvases[idx]) {
        fallbackElement = fallbackElement.concat(layer.elements);
        return;
      }

      const canvas = this.indexedCanvases[idx];
      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.setTransform(matrix);

      this._renderByBound(ctx, matrix, rc, viewportBounds, layer.elements);
    });

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.save();

    ctx.setTransform(matrix);

    this._renderByBound(ctx, matrix, rc, viewportBounds, fallbackElement, true);
  }

  private _renderByBound(
    ctx: CanvasRenderingContext2D | null,
    matrix: DOMMatrix,
    rc: RoughCanvas,
    bound: IBound,
    surfaceElements?: ElementModel[],
    overLay: boolean = false
  ) {
    if (!ctx) return;

    const elements =
      surfaceElements ?? this.layerManager.canvasGrid.search(bound);
    for (const element of elements) {
      ctx.save();

      const display = element.display ?? true;
      const opacity = element.opacity ?? 1;
      if (intersects(getBoundsWithRotation(element), bound) && display) {
        ctx.globalAlpha = opacity;
        const dx = element.x - bound.x;
        const dy = element.y - bound.y;

        const renderFn =
          modelRenderer[element.type as keyof typeof modelRenderer];

        if (!renderFn) {
          console.warn(`Cannot find renderer for ${element.type}`);
          continue;
        }

        renderFn(element, ctx, matrix.translate(dx, dy), this);
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
    surfaceElements?: ElementModel[],
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
    overlay.setRenderer(this);
    this._overlays.add(overlay);
    this._shouldUpdate = true;
  }

  public removeOverlay(overlay: Overlay) {
    overlay.setRenderer(null);
    this._overlays.delete(overlay);
    this._shouldUpdate = true;
  }
}
