import type { Color } from '@blocksuite/affine-model';
import type { EditorHost, SurfaceSelection } from '@blocksuite/block-std';
import type { GfxModel, Viewport } from '@blocksuite/block-std/gfx';
import type { Slot } from '@blocksuite/global/utils';

import { ThemeObserver } from '@blocksuite/affine-shared/theme';
import { BlockComponent, RANGE_SYNC_EXCLUDE_ATTR } from '@blocksuite/block-std';
import { Bound, values } from '@blocksuite/global/utils';
import { css, html } from 'lit';
import { customElement, query } from 'lit/decorators.js';

import type { LayerManager } from './managers/layer-manager.js';
import type { Overlay } from './renderer/canvas-renderer.js';
import type { ElementRenderer } from './renderer/elements/index.js';
import type { SurfaceBlockModel } from './surface-model.js';
import type { SurfaceBlockService } from './surface-service.js';

import { ConnectorElementModel } from './element-model/index.js';
import { CanvasRenderer } from './renderer/canvas-renderer.js';

export interface SurfaceContext {
  viewport: Viewport;
  layer: LayerManager;
  host: EditorHost;
  overlays: Record<string, Overlay>;
  elementRenderers: Record<string, ElementRenderer>;
  selection: {
    selectedIds: string[];
    slots: {
      updated: Slot<SurfaceSelection[]>;
    };
  };
  pickElementsByBound: (bound: Bound) => GfxModel[];
}

@customElement('affine-surface')
export class SurfaceBlockComponent extends BlockComponent<
  SurfaceBlockModel,
  SurfaceBlockService
> {
  private _cachedViewport = new Bound();

  private _initCanvasTransform = () => {
    const refresh = () => {
      this._surfaceContainer.style.setProperty(
        '--canvas-transform',
        this._getReversedTransform()
      );
    };

    this._disposables.add(
      this._context.viewport.viewportUpdated.on(() => {
        refresh();
      })
    );

    refresh();
  };

  private _initThemeObserver = () => {
    this.disposables.add(ThemeObserver.subscribe(() => this.requestUpdate()));
  };

  private _lastTime = 0;

  private _renderer!: CanvasRenderer;

  static isConnector = (element: unknown): element is ConnectorElementModel => {
    return element instanceof ConnectorElementModel;
  };

  static override styles = css`
    .affine-edgeless-surface-block-container {
      width: 100%;
      height: 100%;
    }

    .affine-edgeless-surface-block-container canvas {
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      position: absolute;
      z-index: 1;
      pointer-events: none;
      transform-origin: 0 0;
      transform: var(--canvas-transform);
    }

    edgeless-block-portal-container {
      position: relative;
      box-sizing: border-box;
      overflow: hidden;
      display: block;
      height: 100%;
      font-family: var(--affine-font-family);
      font-size: var(--affine-font-base);
      line-height: var(--affine-line-height);
      color: var(--affine-text-primary-color);
      font-weight: 400;
    }

    .affine-block-children-container.edgeless {
      padding-left: 0;
      position: relative;
      overflow: hidden;
      height: 100%;
      /**
       * Fix: pointerEvent stops firing after a short time.
       * When a gesture is started, the browser intersects the touch-action values of the touched element and its ancestors,
       * up to the one that implements the gesture (in other words, the first containing scrolling element)
       * https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action
       */
      touch-action: none;
      background-color: var(--affine-background-primary-color);
      background-image: radial-gradient(
        var(--affine-edgeless-grid-color) 1px,
        var(--affine-background-primary-color) 1px
      );
      z-index: 0;
    }

    .affine-edgeless-block-child {
      position: absolute;
      transform-origin: center;
      box-sizing: border-box;
      border: 2px solid var(--affine-white-10);
      border-radius: 8px;
      box-shadow: var(--affine-shadow-3);
      pointer-events: all;
    }
  `;

  fitToViewport = (bound: Bound) => {
    const { viewport } = this._context;
    bound = bound.expand(30);
    if (Date.now() - this._lastTime > 200)
      this._cachedViewport = viewport.viewportBounds;
    this._lastTime = Date.now();

    if (this._cachedViewport.contains(bound)) return;

    this._cachedViewport = this._cachedViewport.unite(bound);
    viewport.setViewportByBound(this._cachedViewport, [0, 0, 0, 0], true);
  };

  refresh = () => {
    this._renderer?.refresh();
  };

  private get _context(): SurfaceContext {
    return this.parentComponent?.service as unknown as SurfaceContext;
  }

  private _getReversedTransform() {
    const { translateX, translateY, zoom } = this._context.viewport;

    return `scale(${1 / zoom}) translate(${-translateX}px, ${-translateY}px)`;
  }

  private _initOverlays() {
    values(this._context.overlays).forEach(overlay => {
      this._renderer.addOverlay(overlay);
    });
  }

  private _initRenderer() {
    const context = this._context;
    this._renderer = new CanvasRenderer({
      viewport: context.viewport,
      layerManager: context.layer,
      enableStackingCanvas: true,
      provider: {
        generateColorProperty: (color: Color, fallback: string) =>
          ThemeObserver.generateColorProperty(color, fallback),
        getColorValue: (color: Color, fallback?: string, real?: boolean) =>
          ThemeObserver.getColorValue(color, fallback, real),
        getColorScheme: () => ThemeObserver.mode,
        getPropertyValue: (property: string) =>
          ThemeObserver.getPropertyValue(property),
        selectedElements: () => context.selection.selectedIds,
      },
      onStackingCanvasCreated(canvas) {
        canvas.className = 'indexable-canvas';
      },
      elementRenderers: this._context.elementRenderers,
    });

    this._disposables.add(
      this.model.elementUpdated.on(payload => {
        // ignore externalXYWH update cause it's updated by the renderer
        if (payload.props['externalXYWH']) return;
        this._renderer.refresh();
      })
    );
    this._disposables.add(
      this.model.elementAdded.on(() => {
        this._renderer.refresh();
      })
    );
    this._disposables.add(
      this.model.elementRemoved.on(() => {
        this._renderer.refresh();
      })
    );
    this._disposables.add(() => {
      this._renderer.dispose();
    });
    this._disposables.add(
      this._renderer.stackingCanvasUpdated.on(payload => {
        if (payload.added.length) {
          this._surfaceContainer.append(...payload.added);
        }

        if (payload.removed.length) {
          payload.removed.forEach(canvas => {
            canvas.remove();
          });
        }
      })
    );
    this._disposables.add(
      context.selection.slots.updated.on(() => {
        this._renderer.refresh();
      })
    );
  }

  override connectedCallback() {
    super.connectedCallback();

    this.setAttribute(RANGE_SYNC_EXCLUDE_ATTR, 'true');

    this._initThemeObserver();
    this._initRenderer();
    this._initOverlays();
  }

  override firstUpdated() {
    this._renderer.attach(this._surfaceContainer);
    this._surfaceContainer.append(...this._renderer.stackingCanvas);
    this._initCanvasTransform();
  }

  override render() {
    return html`
      <div class="affine-edgeless-surface-block-container">
        <!-- attach canvas later in renderer -->
      </div>
    `;
  }

  get renderer() {
    return this._renderer;
  }

  @query('.affine-edgeless-surface-block-container')
  private accessor _surfaceContainer!: HTMLElement;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-surface': SurfaceBlockComponent;
  }
}
