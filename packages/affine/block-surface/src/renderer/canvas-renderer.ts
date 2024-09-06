import type {
  GridManager,
  LayerManager,
  Viewport,
} from '@blocksuite/block-std/gfx';
import type { IBound } from '@blocksuite/global/utils';

import { type Color, ColorScheme } from '@blocksuite/affine-model';
import { requestConnectedFrame } from '@blocksuite/affine-shared/utils';
import {
  DisposableGroup,
  getBoundsWithRotation,
  intersects,
  last,
  Slot,
} from '@blocksuite/global/utils';

import type { ElementRenderer } from './elements/index.js';

import { SurfaceElementModel } from '../element-model/base.js';
import { RoughCanvas } from '../utils/rough/canvas.js';

/**
 * An overlay is a layer covered on top of elements,
 * can be used for rendering non-CRDT state indicators.
 */
export abstract class Overlay {
  protected _renderer: CanvasRenderer | null = null;

  constructor() {}

  clear() {}

  abstract render(ctx: CanvasRenderingContext2D, rc: RoughCanvas): void;

  setRenderer(renderer: CanvasRenderer | null) {
    this._renderer = renderer;
  }
}

type EnvProvider = {
  generateColorProperty: (color: Color, fallback: string) => string;
  getColorScheme: () => ColorScheme;
  getColorValue: (color: Color, fallback?: string, real?: boolean) => string;
  getPropertyValue: (property: string) => string;
  selectedElements?: () => string[];
};

type RendererOptions = {
  viewport: Viewport;
  layerManager: LayerManager;
  provider?: Partial<EnvProvider>;
  enableStackingCanvas?: boolean;
  onStackingCanvasCreated?: (canvas: HTMLCanvasElement) => void;
  elementRenderers: Record<string, ElementRenderer>;
  gridManager: GridManager;
};

export class CanvasRenderer {
  private _container!: HTMLElement;

  private _disposables = new DisposableGroup();

  private _overlays = new Set<Overlay>();

  private _refreshRafId: number | null = null;

  private _stackingCanvas: HTMLCanvasElement[] = [];

  canvas: HTMLCanvasElement;

  ctx: CanvasRenderingContext2D;

  elementRenderers: Record<string, ElementRenderer>;

  grid: GridManager;

  layerManager: LayerManager;

  provider: Partial<EnvProvider>;

  stackingCanvasUpdated = new Slot<{
    canvases: HTMLCanvasElement[];
    added: HTMLCanvasElement[];
    removed: HTMLCanvasElement[];
  }>();

  viewport: Viewport;

  get stackingCanvas() {
    return this._stackingCanvas;
  }

  constructor(options: RendererOptions) {
    const canvas = document.createElement('canvas');

    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    this.viewport = options.viewport;
    this.layerManager = options.layerManager;
    this.grid = options.gridManager;
    this.provider = options.provider ?? {};
    this.elementRenderers = options.elementRenderers;
    this._initViewport();

    options.enableStackingCanvas = options.enableStackingCanvas ?? false;
    if (options.enableStackingCanvas) {
      this._initStackingCanvas(options.onStackingCanvasCreated);
    }
  }

  /**
   * Specifying the actual size gives better results and more consistent behavior across browsers.
   *
   * Make sure the main canvas and the offscreen canvas or layer canvas are the same size.
   *
   * It is not recommended to set width and height to 100%.
   */
  private _canvasSizeUpdater(dpr = window.devicePixelRatio) {
    const { width, height } = this.viewport;
    const actualWidth = Math.ceil(width * dpr);
    const actualHeight = Math.ceil(height * dpr);

    return {
      filter({ width, height }: HTMLCanvasElement) {
        return width !== actualWidth || height !== actualHeight;
      },
      update(canvas: HTMLCanvasElement) {
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        canvas.width = actualWidth;
        canvas.height = actualHeight;
      },
    };
  }

  private _initStackingCanvas(onCreated?: (canvas: HTMLCanvasElement) => void) {
    const layer = this.layerManager;
    const updateStackingCanvasSize = (canvases: HTMLCanvasElement[]) => {
      this._stackingCanvas = canvases;

      const sizeUpdater = this._canvasSizeUpdater();

      canvases.filter(sizeUpdater.filter).forEach(sizeUpdater.update);
    };
    const updateStackingCanvas = () => {
      /**
       * we already have a main canvas, so the last layer should be skipped
       */
      const canvasLayers = layer.getCanvasLayers().slice(0, -1);
      const canvases = [];
      const currentCanvases = this._stackingCanvas;
      const lastLayer = last(this.layerManager.layers);
      const maximumZIndex = lastLayer
        ? lastLayer.zIndex + lastLayer.elements.length + 1
        : 1;

      this.canvas.style.zIndex = maximumZIndex.toString();

      for (let i = 0; i < canvasLayers.length; ++i) {
        const layer = canvasLayers[i];
        const created = i < currentCanvases.length;
        const canvas = created
          ? currentCanvases[i]
          : document.createElement('canvas');

        if (!created) {
          onCreated?.(canvas);
        }

        canvas.dataset.layerId = `[${layer.indexes[0]}--${layer.indexes[1]}]`;
        canvas.style.zIndex = layer.zIndex.toString();
        canvases.push(canvas);
      }

      this._stackingCanvas = canvases;
      updateStackingCanvasSize(canvases);

      if (currentCanvases.length !== canvases.length) {
        const diff = canvases.length - currentCanvases.length;
        const payload: {
          canvases: HTMLCanvasElement[];
          removed: HTMLCanvasElement[];
          added: HTMLCanvasElement[];
        } = {
          canvases,
          removed: [],
          added: [],
        };

        if (diff > 0) {
          payload.added = canvases.slice(-diff);
        } else {
          payload.removed = currentCanvases.slice(diff);
        }

        this.stackingCanvasUpdated.emit(payload);
      }

      this.refresh();
    };

    this._disposables.add(
      this.layerManager.slots.layerUpdated.on(() => {
        updateStackingCanvas();
      })
    );

    updateStackingCanvas();
  }

  private _initViewport() {
    let sizeUpdatedRafId: number | null = null;

    this._disposables.add(
      this.viewport.viewportUpdated.on(() => {
        this.refresh();
      })
    );

    this._disposables.add(
      this.viewport.sizeUpdated.on(() => {
        if (sizeUpdatedRafId) return;
        sizeUpdatedRafId = requestConnectedFrame(() => {
          sizeUpdatedRafId = null;
          this._resetSize();
          this._render();
          this.refresh();
        }, this._container);
      })
    );
  }

  private _render() {
    const { viewportBounds, zoom } = this.viewport;
    const { ctx } = this;
    const dpr = window.devicePixelRatio;
    const scale = zoom * dpr;
    const matrix = new DOMMatrix().scaleSelf(scale);
    /**
     * if a layer does not have a corresponding canvas
     * its element will be add to this array and drawing on the
     * main canvas
     */
    let fallbackElement: SurfaceElementModel[] = [];

    this.layerManager.getCanvasLayers().forEach((layer, idx) => {
      if (!this._stackingCanvas[idx]) {
        fallbackElement = fallbackElement.concat(layer.elements);
        return;
      }

      const canvas = this._stackingCanvas[idx];
      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
      const rc = new RoughCanvas(ctx.canvas);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.setTransform(matrix);

      this._renderByBound(ctx, matrix, rc, viewportBounds, layer.elements);
    });

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.save();

    ctx.setTransform(matrix);

    this._renderByBound(
      ctx,
      matrix,
      new RoughCanvas(ctx.canvas),
      viewportBounds,
      fallbackElement,
      true
    );
  }

  private _renderByBound(
    ctx: CanvasRenderingContext2D | null,
    matrix: DOMMatrix,
    rc: RoughCanvas,
    bound: IBound,
    surfaceElements?: SurfaceElementModel[],
    overLay: boolean = false
  ) {
    if (!ctx) return;

    const elements =
      surfaceElements ??
      (this.grid.search(bound, undefined, {
        filter: el => el instanceof SurfaceElementModel,
      }) as SurfaceElementModel[]);
    for (const element of elements) {
      ctx.save();

      const display = element.display ?? true;
      if (display && intersects(getBoundsWithRotation(element), bound)) {
        const renderFn =
          this.elementRenderers[
            element.type as keyof typeof this.elementRenderers
          ];

        if (!renderFn) {
          console.warn(`Cannot find renderer for ${element.type}`);
          ctx.restore();
          continue;
        }

        ctx.globalAlpha = element.opacity ?? 1;
        const dx = element.x - bound.x;
        const dy = element.y - bound.y;

        renderFn(element, ctx, matrix.translate(dx, dy), this, rc, bound);
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

  private _resetSize() {
    const sizeUpdater = this._canvasSizeUpdater();

    sizeUpdater.update(this.canvas);

    this._stackingCanvas.forEach(sizeUpdater.update);
    this.refresh();
  }

  addOverlay(overlay: Overlay) {
    overlay.setRenderer(this);
    this._overlays.add(overlay);
    this.refresh();
  }

  /**
   * Used to attach main canvas, main canvas will always exist
   * @param container
   */
  attach(container: HTMLElement) {
    this._container = container;
    container.append(this.canvas);

    this._resetSize();
    this.refresh();
  }

  dispose(): void {
    this._disposables.dispose();
  }

  generateColorProperty(color: Color, fallback: string) {
    return (
      this.provider.generateColorProperty?.(color, fallback) ??
      (fallback.startsWith('--') ? `var(${fallback})` : fallback)
    );
  }

  getCanvasByBound(
    bound: IBound = this.viewport.viewportBounds,
    surfaceElements?: SurfaceElementModel[],
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
    const matrix = new DOMMatrix().scaleSelf(
      withZoom ? dpr * this.viewport.zoom : dpr
    );
    const rc = new RoughCanvas(canvas);

    if (clearBeforeDrawing) ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(matrix);

    this._renderByBound(ctx, matrix, rc, bound, surfaceElements);

    return canvas;
  }

  getColorScheme() {
    return this.provider.getColorScheme?.() ?? ColorScheme.Light;
  }

  getColorValue(color: Color, fallback?: string, real?: boolean) {
    return (
      this.provider.getColorValue?.(color, fallback, real) ?? 'transparent'
    );
  }

  getPropertyValue(property: string) {
    return this.provider.getPropertyValue?.(property) ?? '';
  }

  refresh() {
    if (this._refreshRafId !== null) return;

    this._refreshRafId = requestConnectedFrame(() => {
      this._refreshRafId = null;
      this._render();
    }, this._container);
  }

  removeOverlay(overlay: Overlay) {
    if (!this._overlays.has(overlay)) {
      return;
    }

    overlay.setRenderer(null);
    this._overlays.delete(overlay);
    this.refresh();
  }
}
