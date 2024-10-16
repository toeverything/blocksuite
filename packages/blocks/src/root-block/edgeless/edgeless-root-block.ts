import type {
  SurfaceBlockComponent,
  SurfaceBlockModel,
} from '@blocksuite/affine-block-surface';
import type {
  RootBlockModel,
  ShapeElementModel,
} from '@blocksuite/affine-model';
import type {
  GfxBlockComponent,
  SurfaceSelection,
  UIEventHandler,
} from '@blocksuite/block-std';
import type { IBound } from '@blocksuite/global/utils';

import { CommonUtils } from '@blocksuite/affine-block-surface';
import { toast } from '@blocksuite/affine-components/toast';
import {
  EditPropsStore,
  FontLoaderService,
} from '@blocksuite/affine-shared/services';
import { ThemeObserver } from '@blocksuite/affine-shared/theme';
import {
  isTouchPadPinchEvent,
  requestConnectedFrame,
  requestThrottledConnectedFrame,
} from '@blocksuite/affine-shared/utils';
import { BlockComponent } from '@blocksuite/block-std';
import {
  GfxBlockElementModel,
  GfxControllerIdentifier,
  type GfxToolsFullOptionValue,
  type GfxViewportElement,
} from '@blocksuite/block-std/gfx';
import { IS_WINDOWS } from '@blocksuite/global/env';
import {
  assertExists,
  Bound,
  Point,
  throttle,
  Vec,
} from '@blocksuite/global/utils';
import { effect } from '@preact/signals-core';
import { css, html, nothing } from 'lit';
import { query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import type { Viewport } from '../../_common/utils/index.js';
import type { EdgelessRootBlockWidgetName } from '../types.js';
import type { EdgelessSelectedRect } from './components/rects/edgeless-selected-rect.js';
import type { EdgelessRootService } from './edgeless-root-service.js';

import { isSelectSingleMindMap } from '../../_common/edgeless/mindmap/index.js';
import { EdgelessClipboardController } from './clipboard/clipboard.js';
import { EdgelessToolbar } from './components/toolbar/edgeless-toolbar.js';
import { EdgelessPageKeyboardManager } from './edgeless-keyboard.js';
import { edgelessElementsBound } from './utils/bound-utils.js';
import { getBackgroundGrid, isCanvasElement } from './utils/query.js';
import { mountShapeTextEditor } from './utils/text.js';

const { normalizeWheelDeltaY } = CommonUtils;

export class EdgelessRootBlockComponent extends BlockComponent<
  RootBlockModel,
  EdgelessRootService,
  EdgelessRootBlockWidgetName
> {
  static override styles = css`
    affine-edgeless-root {
      -webkit-user-select: none;
      user-select: none;
      display: block;
      height: 100%;
      touch-action: none;
    }

    .widgets-container {
      position: absolute;
      left: 0;
      top: 0;
      contain: size layout;
      z-index: 1;
      height: 100%;
    }

    .edgeless-background {
      height: 100%;
      background-color: var(--affine-background-primary-color);
      background-image: radial-gradient(
        var(--affine-edgeless-grid-color) 1px,
        var(--affine-background-primary-color) 1px
      );
    }

    .edgeless-container {
      color: var(--affine-text-primary-color);
    }

    @media print {
      .selected {
        background-color: transparent !important;
      }
    }
  `;

  private _refreshLayerViewport = requestThrottledConnectedFrame(() => {
    const { zoom, translateX, translateY } = this.service.viewport;
    const { gap } = getBackgroundGrid(zoom, true);

    if (this.backgroundElm) {
      this.backgroundElm.style.setProperty(
        'background-position',
        `${translateX}px ${translateY}px`
      );
      this.backgroundElm.style.setProperty(
        'background-size',
        `${gap}px ${gap}px`
      );
    }
  }, this);

  private _resizeObserver: ResizeObserver | null = null;

  private _viewportElement: HTMLElement | null = null;

  clipboardController = new EdgelessClipboardController(this);

  /**
   * Shared components
   */
  components = {
    toolbar: null as EdgelessToolbar | null,
  };

  keyboardManager: EdgelessPageKeyboardManager | null = null;

  get dispatcher() {
    return this.service?.uiEventDispatcher;
  }

  get gfx() {
    return this.std.get(GfxControllerIdentifier);
  }

  get slots() {
    return this.service.slots;
  }

  get surfaceBlockModel() {
    return this.model.children.find(
      child => child.flavour === 'affine:surface'
    ) as SurfaceBlockModel;
  }

  /**
   * Don't confuse with `gfx.viewport` which is edgeless-only concept.
   * This refers to the wrapper element of the EditorHost.
   */
  get viewport(): Viewport {
    const {
      scrollLeft,
      scrollTop,
      scrollWidth,
      scrollHeight,
      clientWidth,
      clientHeight,
    } = this.viewportElement;
    const { top, left } = this.viewportElement.getBoundingClientRect();
    return {
      top,
      left,
      scrollLeft,
      scrollTop,
      scrollWidth,
      scrollHeight,
      clientWidth,
      clientHeight,
    };
  }

  get viewportElement(): HTMLElement {
    if (this._viewportElement) return this._viewportElement;
    this._viewportElement = this.host.closest(
      '.affine-edgeless-viewport'
    ) as HTMLElement | null;
    assertExists(this._viewportElement);
    return this._viewportElement;
  }

  private _handleToolbarFlag() {
    const createToolbar = () => {
      const toolbar = new EdgelessToolbar(this);

      this.append(toolbar);
      this.components.toolbar = toolbar;
    };

    if (!this.components.toolbar) {
      createToolbar();
    }
  }

  private _initFontLoader() {
    this.std
      .get(FontLoaderService)
      .ready.then(() => {
        this.surface.refresh();
      })
      .catch(console.error);
  }

  private _initLayerUpdateEffect() {
    const updateLayers = requestThrottledConnectedFrame(() => {
      const blocks = Array.from(
        this.gfxViewportElm.children as HTMLCollectionOf<GfxBlockComponent>
      );

      blocks.forEach((block: GfxBlockComponent) => {
        block.updateZIndex?.();
      });
    });

    this._disposables.add(
      this.service.layer.slots.layerUpdated.on(() => updateLayers())
    );
  }

  private _initPanEvent() {
    this.disposables.add(
      this.dispatcher.add('pan', ctx => {
        const { viewport } = this.service;
        if (viewport.locked) return;

        const multiPointersState = ctx.get('multiPointerState');
        const [p1, p2] = multiPointersState.pointers;

        const dx =
          (0.5 * (p1.delta.x + p2.delta.x)) / viewport.zoom / viewport.scale;
        const dy =
          (0.5 * (p1.delta.y + p2.delta.y)) / viewport.zoom / viewport.scale;

        // direction is opposite
        viewport.applyDeltaCenter(-dx, -dy);
      })
    );
  }

  private _initPinchEvent() {
    this.disposables.add(
      this.dispatcher.add('pinch', ctx => {
        const { viewport } = this.service;
        if (viewport.locked) return;

        const multiPointersState = ctx.get('multiPointerState');
        const [p1, p2] = multiPointersState.pointers;

        const currentCenter = new Point(
          0.5 * (p1.x + p2.x),
          0.5 * (p1.y + p2.y)
        );

        const lastDistance = Vec.dist(
          [p1.x - p1.delta.x, p1.y - p1.delta.y],
          [p2.x - p2.delta.x, p2.y - p2.delta.y]
        );
        const currentDistance = Vec.dist([p1.x, p1.y], [p2.x, p2.y]);

        const zoom = (currentDistance / lastDistance) * viewport.zoom;

        const [baseX, baseY] = viewport.toModelCoord(
          currentCenter.x,
          currentCenter.y
        );

        viewport.setZoom(zoom, new Point(baseX, baseY));

        return false;
      })
    );
  }

  private _initPixelRatioChangeEffect() {
    let media: MediaQueryList;

    const onPixelRatioChange = () => {
      if (media) {
        this.service.viewport.onResize();
        media.removeEventListener('change', onPixelRatioChange);
      }

      media = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      media.addEventListener('change', onPixelRatioChange);
    };

    onPixelRatioChange();

    this._disposables.add(() => {
      media?.removeEventListener('change', onPixelRatioChange);
    });
  }

  private _initRemoteCursor() {
    let rafId: number | null = null;

    const setRemoteCursor = (pos: { x: number; y: number }) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestConnectedFrame(() => {
        if (!this.service?.viewport) return;
        const cursorPosition = this.service.viewport.toModelCoord(pos.x, pos.y);
        this.service.selection.setCursor({
          x: cursorPosition[0],
          y: cursorPosition[1],
        });
        rafId = null;
      }, this);
    };

    this.handleEvent('pointerMove', e => {
      const pointerEvent = e.get('pointerState');
      setRemoteCursor(pointerEvent);
    });
  }

  private _initResizeEffect() {
    const resizeObserver = new ResizeObserver((_: ResizeObserverEntry[]) => {
      // FIXME: find a better way to get rid of empty check
      if (!this.service || !this.service.selection || !this.service.viewport) {
        console.error('Service not ready');
        return;
      }
      this.service.selection.set(this.service.selection.surfaceSelections);
      this.service.viewport.onResize();
    });

    resizeObserver.observe(this.viewportElement);
    this._resizeObserver = resizeObserver;
  }

  private _initSlotEffects() {
    const { disposables, slots } = this;

    this.disposables.add(
      ThemeObserver.instance.mode$.subscribe(() => this.surface.refresh())
    );

    disposables.add(
      slots.cursorUpdated.on(
        throttle((cursor: string) => {
          this.style.cursor = cursor;
        }, 144)
      )
    );

    let canCopyAsPng = true;
    disposables.add(
      slots.copyAsPng.on(({ blocks, shapes }) => {
        if (!canCopyAsPng) return;
        canCopyAsPng = false;

        this.clipboardController
          .copyAsPng(blocks, shapes)
          .then(() => toast(this.host, 'Copied to clipboard'))
          .catch(() => toast(this.host, 'Failed to copy as PNG'))
          .finally(() => {
            canCopyAsPng = true;
          });
      })
    );
  }

  private _initViewport() {
    const { service, std } = this;

    const run = () => {
      const viewport =
        std.get(EditPropsStore).getStorage('viewport') ??
        service.getFitToScreenData();
      if ('xywh' in viewport) {
        const bound = Bound.deserialize(viewport.xywh);
        service.viewport.setViewportByBound(bound, viewport.padding);
      } else {
        const { zoom, centerX, centerY } = viewport;
        service.viewport.setViewport(zoom, [centerX, centerY]);
      }
    };

    run();

    this._disposables.add(() => {
      std.get(EditPropsStore).setStorage('viewport', {
        centerX: service.viewport.centerX,
        centerY: service.viewport.centerY,
        zoom: service.viewport.zoom,
      });
    });
  }

  private _initWheelEvent() {
    this._disposables.add(
      this.dispatcher.add('wheel', ctx => {
        const state = ctx.get('defaultState');
        const e = state.event as WheelEvent;

        e.preventDefault();

        const { viewport, locked } = this.service;
        if (locked) return;

        // zoom
        if (isTouchPadPinchEvent(e)) {
          const rect = this.getBoundingClientRect();
          // Perform zooming relative to the mouse position
          const [baseX, baseY] = this.service.viewport.toModelCoord(
            e.clientX - rect.x,
            e.clientY - rect.y
          );

          const zoom = normalizeWheelDeltaY(e.deltaY, viewport.zoom);
          viewport.setZoom(zoom, new Point(baseX, baseY));
          e.stopPropagation();
        }
        // pan
        else {
          const simulateHorizontalScroll = IS_WINDOWS && e.shiftKey;
          const dx = simulateHorizontalScroll
            ? e.deltaY / viewport.zoom
            : e.deltaX / viewport.zoom;
          const dy = simulateHorizontalScroll ? 0 : e.deltaY / viewport.zoom;

          viewport.applyDeltaCenter(dx, dy);
          viewport.viewportMoved.emit([dx, dy]);
          e.stopPropagation();
        }
      })
    );
  }

  override bindHotKey(
    keymap: Record<string, UIEventHandler>,
    options?: { global?: boolean; flavour?: boolean }
  ): () => void {
    const { service } = this;
    const selection = service.selection;

    Object.keys(keymap).forEach(key => {
      if (key.length === 1 && key >= 'A' && key <= 'z') {
        const handler = keymap[key];

        keymap[key] = ctx => {
          const elements = selection.selectedElements;

          if (isSelectSingleMindMap(elements) && !selection.editing) {
            const target = service.getElementById(
              elements[0].id
            ) as ShapeElementModel;
            if (target.text) {
              this.doc.transact(() => {
                target.text!.delete(0, target.text!.length);
                target.text!.insert(0, key);
              });
            }
            mountShapeTextEditor(target, this);
          } else {
            handler(ctx);
          }
        };
      }
    });

    return super.bindHotKey(keymap, options);
  }

  override connectedCallback() {
    super.connectedCallback();
    this.clipboardController.hostConnected();

    this.keyboardManager = new EdgelessPageKeyboardManager(this);

    this.handleEvent('selectionChange', () => {
      const surface = this.host.selection.value.find(
        (sel): sel is SurfaceSelection => sel.is('surface')
      );
      if (!surface) return;

      const el = this.service.getElementById(surface.elements[0]);
      if (isCanvasElement(el)) {
        return true;
      }

      return;
    });

    this._disposables.add(
      this.slots.elementResizeStart.on(() => {
        this._isResizing = true;
      })
    );

    this._disposables.add(
      this.slots.elementResizeEnd.on(() => {
        this._isResizing = false;
      })
    );

    this._disposables.add(
      effect(() => {
        this.edgelessTool =
          this.gfx.tool.currentToolOption$.value ?? this.edgelessTool;
      })
    );
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.clipboardController.hostDisconnected();
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }

    this.keyboardManager = null;
    this.components.toolbar?.remove();
    this.components.toolbar = null;
  }

  override firstUpdated() {
    this._initSlotEffects();
    this._initResizeEffect();
    this._initPixelRatioChangeEffect();
    this._initFontLoader();
    this._initRemoteCursor();
    this._initLayerUpdateEffect();

    this._initViewport();
    this._initWheelEvent();
    this._initPanEvent();
    this._initPinchEvent();

    if (this.doc.readonly) {
      this.gfx.tool.setTool('pan', { panning: true });
    } else {
      this.gfx.tool.setTool('default');
    }

    requestConnectedFrame(() => {
      this._handleToolbarFlag();
      this.requestUpdate();
    }, this);

    this._disposables.add(
      this.service.viewport.viewportUpdated.on(() => {
        this._refreshLayerViewport();
      })
    );

    this._refreshLayerViewport();
  }

  getElementsBound(): IBound | null {
    const { service } = this;
    return edgelessElementsBound([...service.elements, ...service.blocks]);
  }

  override renderBlock() {
    const widgets = repeat(
      Object.entries(this.widgets),
      ([id]) => id,
      ([_, widget]) => widget
    );

    return html`
      <div class="edgeless-background edgeless-container">
        <gfx-viewport
          .maxConcurrentRenders=${6}
          .viewport=${this.service.viewport}
          .getModelsInViewport=${() => {
            const blocks = this.service.gfx.grid.search(
              this.service.viewport.viewportBounds,
              undefined,
              {
                useSet: true,
                filter: model => model instanceof GfxBlockElementModel,
              }
            );

            return blocks;
          }}
          .host=${this.host}
        >
          ${this.renderChildren(this.model)}${this.renderChildren(
            this.surfaceBlockModel
          )}
        </gfx-viewport>
      </div>

      <!--
        Used to mount component before widgets
        Eg., canvas text editor
      -->
      <div class="edgeless-mount-point"></div>

      <!-- need to be converted to widget -->
      <edgeless-dragging-area-rect
        .edgeless=${this}
      ></edgeless-dragging-area-rect>

      ${this._isResizing
        ? nothing
        : html`<note-slicer .edgeless=${this}></note-slicer>`}

      <edgeless-selected-rect .edgeless=${this}></edgeless-selected-rect>
      <edgeless-navigator-black-background
        .edgeless=${this}
      ></edgeless-navigator-black-background>
      <!-- end -->

      <div class="widgets-container">${widgets}</div>
    `;
  }

  @state()
  private accessor _isResizing = false;

  @query('.edgeless-background')
  accessor backgroundElm: HTMLDivElement | null = null;

  @state()
  accessor edgelessTool: GfxToolsFullOptionValue = {
    type: localStorage.defaultTool ?? 'default',
  };

  @query('gfx-viewport')
  accessor gfxViewportElm!: GfxViewportElement;

  @query('.edgeless-mount-point')
  accessor mountElm: HTMLDivElement | null = null;

  @query('edgeless-selected-rect')
  accessor selectedRect!: EdgelessSelectedRect;

  @query('affine-surface')
  accessor surface!: SurfaceBlockComponent;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-edgeless-root': EdgelessRootBlockComponent;
  }
}
