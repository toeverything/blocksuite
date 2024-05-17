import '../root-block/edgeless/components/block-portal/edgeless-block-portal.js';

import { BlockElement, RangeManager } from '@blocksuite/block-std';
import { css, html, nothing } from 'lit';
import { customElement, query } from 'lit/decorators.js';

import { ThemeObserver } from '../_common/theme/theme-observer.js';
import { isInsideEdgelessEditor } from '../_common/utils/index.js';
import { values } from '../_common/utils/iterable.js';
import { isShape } from '../root-block/edgeless/components/auto-complete/utils.js';
import type { EdgelessBlockPortalContainer } from '../root-block/edgeless/components/block-portal/edgeless-block-portal.js';
import type { EdgelessRootBlockComponent } from '../root-block/edgeless/edgeless-root-block.js';
import { FrameOverlay } from '../root-block/edgeless/frame-manager.js';
import { Renderer } from './canvas-renderer/renderer.js';
import { ConnectorElementModel } from './element-model/index.js';
import { ConnectionOverlay } from './managers/connector-manager.js';
import type { SurfaceBlockModel } from './surface-model.js';
import type { SurfaceBlockService } from './surface-service.js';
import { Bound } from './utils/bound.js';
import { normalizeWheelDeltaY } from './utils/index.js';

export type IndexedCanvasUpdateEvent = CustomEvent<{
  content: HTMLCanvasElement[];
}>;

@customElement('affine-surface')
export class SurfaceBlockComponent extends BlockElement<
  SurfaceBlockModel,
  SurfaceBlockService
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
  private _lastTime = 0;
  private _cachedViewport = new Bound();

  readonly themeObserver = new ThemeObserver();

  overlays!: {
    connector: ConnectionOverlay;
    frame: FrameOverlay;
  };

  @query('edgeless-block-portal-container')
  portal!: EdgelessBlockPortalContainer;

  get renderer() {
    return this._renderer;
  }

  get edgeless() {
    return this.parentBlockElement as EdgelessRootBlockComponent;
  }

  private get _isEdgeless() {
    return isInsideEdgelessEditor(this.host);
  }

  @query('.affine-edgeless-surface-block-container')
  private _surfaceContainer!: HTMLElement;

  override connectedCallback() {
    super.connectedCallback();

    this.setAttribute(RangeManager.rangeSyncExcludeAttr, 'true');

    if (!this._isEdgeless) return;

    this._initThemeObserver();
    this._initRenderer();
    this._initOverlay();
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
      layerManager: service.layer,
      enableStackingCanvas: true,
      provider: {
        selectedElements: () => service.selection.selectedIds,
        getVariableColor: (val: string) =>
          this.themeObserver.getVariableValue(val),
      },
      onStackingCanvasCreated(canvas) {
        canvas.className = 'indexable-canvas';

        canvas.style.setProperty('transform-origin', '0 0');
        canvas.style.setProperty('position', 'absolute');
        canvas.style.setProperty('pointer-events', 'none');
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
    this._disposables.add(this._renderer.sync(this.edgeless.service.viewport));
    this._disposables.add(() => {
      this._renderer.dispose();
    });
    this._disposables.add(
      this._renderer.stackingCanvasUpdated.on(() => {
        this._emitStackingCanvasUpdate();
      })
    );
    this._disposables.add(
      this.std.event.slots.parentScaleChanged.on(() => {
        this._renderer.setCumulativeParentScale(
          this.std.event.cumulativeParentScale
        );
      })
    );
    this._disposables.add(
      this.std.event.slots.editorHostPanned.on(() => {
        this._renderer.onResize();
      })
    );
  }

  private _initThemeObserver = () => {
    this.themeObserver.observe(document.documentElement);
    this.themeObserver.on(() => this.requestUpdate());
    this.disposables.add(() => this.themeObserver.dispose());
  };

  override firstUpdated() {
    if (!this._isEdgeless) return;

    this._renderer.attach(this._surfaceContainer);
    this._renderer.setCumulativeParentScale(
      this.std.event.cumulativeParentScale
    );
    this._initResizeEffect();
  }

  private _emitStackingCanvasUpdate() {
    const evt = new CustomEvent('indexedcanvasupdate', {
      detail: {
        content: this._renderer.stackingCanvas,
      },
    }) as IndexedCanvasUpdateEvent;

    this.dispatchEvent(evt);
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

  override render() {
    if (!this._isEdgeless) return nothing;

    return html`
      <div class="affine-edgeless-surface-block-container">
        <!-- attach canvas later in renderer -->
      </div>
    `;
  }
  static isShape = isShape;
  static isConnector = (element: unknown): element is ConnectorElementModel => {
    return element instanceof ConnectorElementModel;
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-surface': SurfaceBlockComponent;
  }
}
