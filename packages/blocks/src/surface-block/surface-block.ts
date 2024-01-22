import '../page-block/edgeless/components/block-portal/edgeless-block-portal.js';

import { BlockElement, RangeManager } from '@blocksuite/lit';
import { css, html, nothing } from 'lit';
import { customElement, query } from 'lit/decorators.js';

import { ThemeObserver } from '../_common/theme/theme-observer.js';
import { isInsideEdgelessEditor } from '../_common/utils/index.js';
import { values } from '../_common/utils/iterable.js';
import type { EdgelessBlockPortalContainer } from '../page-block/edgeless/components/block-portal/edgeless-block-portal.js';
import type { EdgelessPageBlockComponent } from '../page-block/edgeless/edgeless-page-block.js';
import { EdgelessFrameManager } from '../page-block/edgeless/frame-manager.js';
import { EdgelessSnapManager } from '../page-block/edgeless/utils/snap-manager.js';
import { Renderer } from './canvas-renderer/renderer.js';
import { ConnectionOverlay } from './managers/connector-manager.js';
import type { SurfaceBlockModel } from './surface-model.js';
import type { SurfaceService } from './surface-service.js';
import { Bound } from './utils/bound.js';
import { normalizeWheelDeltaY } from './utils/index.js';

export type IndexedCanvasUpdateEvent = CustomEvent<{
  content: HTMLCanvasElement[];
}>;

@customElement('affine-surface')
export class SurfaceBlockComponent extends BlockElement<
  SurfaceBlockModel,
  SurfaceService
> {
  static override styles = css`
    .affine-edgeless-surface-block-container {
      position: absolute;
      width: 100%;
      height: 100%;
    }

    .affine-edgeless-surface-block-container canvas {
      width: 100%;
      height: 100%;
      position: relative;
      z-index: 1;
      pointer-events: none;
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

  private _renderer!: Renderer;

  indexedCanvases: HTMLCanvasElement[] = [];

  snap!: EdgelessSnapManager;
  frame!: EdgelessFrameManager;

  private _lastTime = 0;
  private _cachedViewport = new Bound();

  readonly themeObserver = new ThemeObserver();

  overlays!: {
    connector: ConnectionOverlay;
  };

  @query('edgeless-block-portal-container')
  portal!: EdgelessBlockPortalContainer;

  get renderer() {
    return this._renderer;
  }

  get edgeless() {
    return this.parentBlockElement as EdgelessPageBlockComponent;
  }

  private get _isEdgeless() {
    return isInsideEdgelessEditor(this.host);
  }

  override get service() {
    return super.service as SurfaceService;
  }

  @query('.affine-edgeless-surface-block-container')
  private _surfaceContainer!: HTMLElement;

  override connectedCallback() {
    super.connectedCallback();

    this.setAttribute(RangeManager.rangeSyncExcludeAttr, 'true');

    if (!this._isEdgeless) return;

    const { edgeless } = this;

    this._initThemeObserver();
    this._initRenderer();
    this._initEvents();
    this._initOverlay();

    this.frame = new EdgelessFrameManager(edgeless);
    this.snap = new EdgelessSnapManager(edgeless);
  }

  private _initOverlay() {
    this.overlays = {
      connector: new ConnectionOverlay(this.edgeless.service),
    };
    values(this.overlays).forEach(overlay => {
      this._renderer.addOverlay(overlay);
    });
  }

  private _initRenderer() {
    const service = this.edgeless.service!;

    this._renderer = new Renderer({
      layerManager: service.layer,
      provider: {
        selectedElements: () => service.selection.selectedIds,
        getVariableColor: (val: string) =>
          this.themeObserver.getVariableValue(val),
      },
    });

    this._disposables.add(
      this.model.elementUpdated.on(() => {
        this._renderer.refresh();
      })
    );
    this._disposables.add(
      this.edgeless.service.selection.slots.updated.on(() => {
        this._renderer.refresh();
      })
    );
    this._disposables.add(this._renderer.sync(this.edgeless.service.viewport));
    this._disposables.add(() => {
      this._renderer.dispose();
    });
  }

  private _initEvents() {
    const { _disposables, edgeless } = this;
    const edgelessService = edgeless.service!;

    _disposables.add(
      edgeless.slots.reorderingElements.on(({ elements, type }) => {
        elements.forEach(element => {
          this.edgeless.service.reorderElement(element, type);
        });
      })
    );

    _disposables.add(
      edgelessService.layer.slots.layerUpdated.on(() => {
        this._updateIndexCanvases();
      })
    );
    this._updateIndexCanvases();
  }

  private _initThemeObserver = () => {
    this.themeObserver.observe(document.documentElement);
    this.themeObserver.on(() => this.requestUpdate());
    this.disposables.add(() => this.themeObserver.dispose());
  };

  private _updateIndexCanvases() {
    const evt = new CustomEvent('indexedcanvasupdate', {
      detail: {
        content: this._createIndexedCanvases(),
      },
    }) as IndexedCanvasUpdateEvent;

    this.dispatchEvent(evt);
    this.refresh();
  }

  private _createIndexedCanvases() {
    /**
     * we already have a main canvas, so the last layer should be deleted
     */
    const canvasLayers = this.edgeless.service.layer
      .getCanvasLayers()
      .slice(0, -1);
    const canvases = [];
    const currentCanvases = this.indexedCanvases;

    for (let i = 0; i < canvasLayers.length; ++i) {
      const layer = canvasLayers[i];
      const created = i < currentCanvases.length;
      const canvas = created
        ? currentCanvases[i]
        : document.createElement('canvas');

      if (!created) {
        canvas.className = 'indexable-canvas';

        canvas.style.setProperty('transform-origin', '0 0');
        canvas.style.setProperty('position', 'absolute');
        canvas.style.setProperty('pointer-events', 'none');
      }

      canvas.setAttribute(
        'data-fractional',
        `${layer.indexes[0]}-${layer.indexes[1]}`
      );
      canvas.style.setProperty('z-index', layer.zIndexes.toString());

      canvases.push(canvas);
    }

    this.indexedCanvases = canvases;
    this._renderer.setIndexedCanvas(this.indexedCanvases);

    return this.indexedCanvases;
  }

  override renderBlock() {
    if (!this._isEdgeless) return nothing;

    return html`
      <div class="affine-edgeless-surface-block-container">
        <!-- attach canvas later in renderer -->
      </div>
    `;
  }

  override firstUpdated() {
    if (!this._isEdgeless) return;

    this._renderer.attach(this._surfaceContainer);
    this._initResizeEffect();
  }

  override updated() {
    if (!this._isEdgeless) return;
  }

  private _initResizeEffect() {
    const observer = new ResizeObserver(() => {
      this._renderer.onResize();
    });

    observer.observe(this._surfaceContainer);
    this._disposables.add(() => {
      observer.disconnect();
    });
  }

  refresh() {
    this._renderer.refresh();
  }

  onResize() {
    this._renderer.onResize();
  }

  fitToViewport(bound: Bound) {
    const { viewport } = this.edgeless.service;
    bound = bound.expand(30);
    if (Date.now() - this._lastTime > 200)
      this._cachedViewport = viewport.viewportBounds;
    this._lastTime = Date.now();

    if (this._cachedViewport.contains(bound)) return;

    this._cachedViewport = this._cachedViewport.unite(bound);
    viewport.setViewportByBound(this._cachedViewport, [0, 0, 0, 0], true);
  }

  /** @internal Only for testing */
  initDefaultGestureHandler() {
    const { _renderer } = this;
    _renderer.canvas.addEventListener('wheel', e => {
      e.preventDefault();
      // pan
      if (!e.ctrlKey) {
        const dx = e.deltaX / _renderer.zoom;
        const dy = e.deltaY / _renderer.zoom;
        _renderer.setCenter(_renderer.centerX + dx, _renderer.centerY + dy);
      }
      // zoom
      else {
        const zoom = normalizeWheelDeltaY(e.deltaY);
        _renderer.setZoom(zoom);
      }
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-surface': SurfaceBlockComponent;
  }
}
