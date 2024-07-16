import { BlockElement, RangeManager } from '@blocksuite/block-std';
import { css, html, nothing } from 'lit';
import { customElement, query } from 'lit/decorators.js';

import type { EdgelessRootBlockComponent } from '../root-block/edgeless/edgeless-root-block.js';
import type { SurfaceBlockModel } from './surface-model.js';
import type { SurfaceBlockService } from './surface-service.js';

import { ThemeObserver } from '../_common/theme/theme-observer.js';
import { isInsideEdgelessEditor } from '../_common/utils/index.js';
import { values } from '../_common/utils/iterable.js';
import { isShape } from '../root-block/edgeless/components/auto-complete/utils.js';
import { FrameOverlay } from '../root-block/edgeless/frame-manager.js';
import { Renderer } from './canvas-renderer/renderer.js';
import { ConnectorElementModel } from './element-model/index.js';
import { ConnectionOverlay } from './managers/connector-manager.js';
import { Bound } from './utils/bound.js';
import { normalizeWheelDeltaY } from './utils/index.js';

@customElement('affine-surface')
export class SurfaceBlockComponent extends BlockElement<
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
      this.edgeless.service.viewport.viewportUpdated.on(() => {
        refresh();
      })
    );

    refresh();
  };

  private _initThemeObserver = () => {
    this.themeObserver.observe(document.documentElement);
    this.themeObserver.on(() => this.requestUpdate());
    this.disposables.add(() => this.themeObserver.dispose());
  };

  private _lastTime = 0;

  private _renderer!: Renderer;

  static isConnector = (element: unknown): element is ConnectorElementModel => {
    return element instanceof ConnectorElementModel;
  };

  static isShape = isShape;

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

  overlays!: {
    connector: ConnectionOverlay;
    frame: FrameOverlay;
  };

  readonly themeObserver = new ThemeObserver();

  private _getReversedTransform() {
    const { translateX, translateY, zoom } = this.edgeless.service.viewport;

    return `scale(${1 / zoom}) translate(${-translateX}px, ${-translateY}px)`;
  }

  private _initOverlay() {
    this.overlays = {
      connector: new ConnectionOverlay(this.edgeless.service),
      frame: new FrameOverlay(),
    };

    values(this.overlays).forEach(overlay => {
      this._renderer.addOverlay(overlay);
    });
  }

  private _initRenderer() {
    const service = this.edgeless.service!;

    this._renderer = new Renderer({
      viewport: service.viewport,
      layerManager: service.layer,
      enableStackingCanvas: true,
      provider: {
        selectedElements: () => service.selection.selectedIds,
        getVariableColor: (val: string) =>
          this.themeObserver.getVariableValue(val),
      },
      onStackingCanvasCreated(canvas) {
        canvas.className = 'indexable-canvas';
      },
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
  }

  private get _isEdgeless() {
    return isInsideEdgelessEditor(this.host);
  }

  override connectedCallback() {
    super.connectedCallback();

    this.setAttribute(RangeManager.rangeSyncExcludeAttr, 'true');

    if (!this._isEdgeless) return;

    this._initThemeObserver();
    this._initRenderer();
    this._initOverlay();
  }

  override firstUpdated() {
    if (!this._isEdgeless) return;

    this._renderer.attach(this._surfaceContainer);
    this._surfaceContainer.append(...this._renderer.stackingCanvas);
    this._initCanvasTransform();
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
    const { _renderer, edgeless } = this;
    const { viewport } = edgeless.service;

    _renderer.canvas.addEventListener('wheel', e => {
      e.preventDefault();
      // pan
      if (!e.ctrlKey) {
        const dx = e.deltaX / viewport.zoom;
        const dy = e.deltaY / viewport.zoom;
        viewport.setCenter(viewport.centerX + dx, viewport.centerY + dy);
      }
      // zoom
      else {
        const zoom = normalizeWheelDeltaY(e.deltaY);
        viewport.setZoom(zoom);
      }
    });
  }

  refresh() {
    this._renderer.refresh();
  }

  override render() {
    if (!this._isEdgeless) return nothing;

    return html`
      <div class="affine-edgeless-surface-block-container">
        <!-- attach canvas later in renderer -->
      </div>
    `;
  }

  get edgeless() {
    return this.parentBlockElement as EdgelessRootBlockComponent;
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
