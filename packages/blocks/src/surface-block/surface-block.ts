import '../page-block/edgeless/components/block-portal/edgeless-block-portal.js';

import { assertExists } from '@blocksuite/global/utils';
import { BlockElement } from '@blocksuite/lit';
import { css, html, nothing } from 'lit';
import { customElement, query } from 'lit/decorators.js';

import {
  type CssVariableName,
  isCssVariable,
} from '../_common/theme/css-variables.js';
import { ThemeObserver } from '../_common/theme/theme-observer.js';
import { isInsideEdgelessEditor } from '../_common/utils/index.js';
import type { EdgelessBlockPortalContainer } from '../page-block/edgeless/components/block-portal/edgeless-block-portal.js';
import { EdgelessConnectorManager } from '../page-block/edgeless/connector-manager.js';
import type { EdgelessPageBlockComponent } from '../page-block/edgeless/edgeless-page-block.js';
import { EdgelessFrameManager } from '../page-block/edgeless/frame-manager.js';
import {
  isConnectable,
  isTopLevelBlock,
} from '../page-block/edgeless/utils/query.js';
import { EdgelessSnapManager } from '../page-block/edgeless/utils/snap-manager.js';
import { Renderer } from './canvas-renderer/renderer.js';
import { type EdgelessElementType } from './edgeless-types.js';
import { ConnectorElement } from './elements/index.js';
import {
  compare,
  EdgelessGroupManager,
  getGroupParent,
  setGroupParent,
} from './managers/group-manager.js';
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
  connector!: EdgelessConnectorManager;
  frame!: EdgelessFrameManager;
  group!: EdgelessGroupManager;

  compare = compare;
  getGroupParent = getGroupParent;
  setGroupParent = setGroupParent;

  private _lastTime = 0;
  private _cachedViewport = new Bound();

  private readonly _themeObserver = new ThemeObserver();

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
    if (!this._isEdgeless) return;

    const edgelessService = this.edgeless.service!;
    const { edgeless } = this;
    this._renderer = new Renderer({
      layerManager: edgelessService.layer,
      provider: {
        selectedElements: () => edgelessService.selection.selectedIds,
        getVariableColor: (val: string) => this.getCSSPropertyValue(val),
      },
    });

    this.connector = new EdgelessConnectorManager(edgeless);
    this.frame = new EdgelessFrameManager(edgeless);
    this.snap = new EdgelessSnapManager(edgeless);
    this.group = new EdgelessGroupManager(this);

    this._initEvents();
    this._initThemeObserver();
  }

  getCSSPropertyValue = (value: string) => {
    if (isCssVariable(value)) {
      const cssValue =
        this._themeObserver.cssVariables?.[value as CssVariableName];
      if (cssValue === undefined) {
        console.error(
          new Error(
            `All variables should have a value. Please check for any dirty data or variable renaming.Variable: ${value}`
          )
        );
      }
      return cssValue ?? value;
    }

    return value;
  };

  private _initEvents() {
    const { _disposables, edgeless } = this;
    const edgelessService = edgeless.service!;

    _disposables.add(
      edgeless.slots.reorderingElements.on(({ elements, type }) => {
        elements.forEach(element => {
          this.edgeless.service!.reorderElement(element, type);
        });
      })
    );

    _disposables.add(
      edgeless.slots.elementAdded.on(({ id }) => {
        const element = edgeless.service.getElementById(id);
        assertExists(element);
        if (element instanceof ConnectorElement) {
          // FIXME waiting for refactor
          if (!this.connector.hasRelatedElement(element)) return;
          this.connector.updatePath(element);
        }
      })
    );

    _disposables.add(
      edgeless.slots.elementUpdated.on(({ id, props }) => {
        const element = edgeless.service.getElementById(id);
        assertExists(element);

        this.service!.editSession.record(
          (isTopLevelBlock(element)
            ? element.flavour
            : element.type) as EdgelessElementType,
          props as Record<string, unknown>
        );

        if (element instanceof ConnectorElement) {
          this.connector.updatePath(element);
        }
      })
    );

    _disposables.add(
      edgeless.slots.elementUpdated.on(({ id, props }) => {
        if (!props || 'xywh' in props || 'rotate' in props) {
          const element = edgeless.service.getElementById(id);
          if (isConnectable(element)) {
            this.connector.syncConnectorPos([element]);
          }
        }
      })
    );

    _disposables.add(
      edgelessService.layer.slots.layerUpdated.on(() => {
        this._updateIndexCanvases();
      })
    );
  }

  private _initThemeObserver = () => {
    this._themeObserver.observe(document.documentElement);
    this._themeObserver.on(() => this.requestUpdate());
    this.disposables.add(() => this._themeObserver.dispose());
  };

  private _updateIndexCanvases() {
    const evt = new CustomEvent('indexedcanvasupdate', {
      detail: {
        content: this.renderCanvas(),
      },
    }) as IndexedCanvasUpdateEvent;

    this.dispatchEvent(evt);
    this.refresh();
  }

  renderCanvas() {
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
    this.refresh();

    return this.indexedCanvases;
  }

  override render() {
    if (!this._isEdgeless) return nothing;

    return html`
      <div class="affine-edgeless-surface-block-container">
        <!-- attach canvas later in renderer -->
      </div>
    `;
  }

  override firstUpdated() {
    if (!this._isEdgeless) return;

    this.attach(this._surfaceContainer);
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

  get viewport(): Renderer {
    return this._renderer;
  }

  refresh() {
    this._renderer.refresh();
  }

  attach(container: HTMLElement) {
    this._renderer.attach(container);
  }

  onResize() {
    this._renderer.onResize();
  }

  fitToViewport(bound: Bound) {
    const { viewport } = this;
    bound = bound.expand(30);
    if (Date.now() - this._lastTime > 200)
      this._cachedViewport = viewport.viewportBounds;
    this._lastTime = Date.now();

    if (this._cachedViewport.contains(bound)) return;

    this._cachedViewport = this._cachedViewport.unite(bound);
    viewport.setViewportByBound(this._cachedViewport, [0, 0, 0, 0], true);
  }

  toModelCoord(viewX: number, viewY: number): [number, number] {
    return this._renderer.toModelCoord(viewX, viewY);
  }

  toViewCoord(modelX: number, modelY: number): [number, number] {
    return this._renderer.toViewCoord(modelX, modelY);
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
