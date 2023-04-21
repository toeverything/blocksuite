/// <reference types="vite/client" />
import './components/edgeless-selected-rect.js';
import './toolbar/edgeless-toolbar.js';

import {
  BLOCK_ID_ATTR,
  EDGELESS_BLOCK_CHILD_PADDING,
} from '@blocksuite/global/config';
import {
  deserializeXYWH,
  serializeXYWH,
  SurfaceManager,
} from '@blocksuite/phasor';
import {
  assertExists,
  type BaseBlockModel,
  type Page,
  Slot,
} from '@blocksuite/store';
import { css, html, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { EdgelessClipboard } from '../../__internal__/clipboard/index.js';
import type {
  BlockComponentElement,
  Point,
  TopLevelBlockModel,
} from '../../__internal__/index.js';
import {
  almostEqual,
  asyncFocusRichText,
  getRectByBlockElement,
  handleNativeRangeAtPoint,
  resetNativeSelection,
} from '../../__internal__/index.js';
import { getService } from '../../__internal__/service.js';
import type { CssVariableName } from '../../__internal__/theme/css-variables.js';
import { isCssVariable } from '../../__internal__/theme/css-variables.js';
import { getThemePropertyValue } from '../../__internal__/theme/utils.js';
import {
  ShadowlessElement,
  WithDisposable,
} from '../../__internal__/utils/lit.js';
import type {
  BlockHost,
  DragHandle,
  FrameBlockModel,
  MouseMode,
  PageBlockModel,
} from '../../index.js';
import type { SurfaceBlockModel } from '../../surface-block/surface-model.js';
import { tryUpdateFrameSize } from '../utils/index.js';
import { EdgelessBlockChildrenContainer } from './components/block-children-container.js';
import { EdgelessDraggingArea } from './components/dragging-area.js';
import { EdgelessHoverRect } from './components/hover-rect.js';
import { createDragHandle } from './create-drag-handle.js';
import { FrameResizeObserver } from './frame-resize-observer.js';
import { bindEdgelessHotkeys } from './hotkey.js';
import {
  EdgelessSelectionManager,
  type EdgelessSelectionState,
} from './selection-manager.js';
import {
  DEFAULT_FRAME_HEIGHT,
  DEFAULT_FRAME_OFFSET_X,
  DEFAULT_FRAME_OFFSET_Y,
  DEFAULT_FRAME_WIDTH,
  getBackgroundGrid,
  getCursorMode,
} from './utils.js';

export interface EdgelessSelectionSlots {
  hoverUpdated: Slot;
  viewportUpdated: Slot;
  selectionUpdated: Slot<EdgelessSelectionState>;
  surfaceUpdated: Slot;
  mouseModeUpdated: Slot<MouseMode>;
}

export interface EdgelessContainer extends HTMLElement {
  readonly page: Page;
  readonly surface: SurfaceManager;
  readonly slots: EdgelessSelectionSlots;
}

@customElement('affine-edgeless-page')
export class EdgelessPageBlockComponent
  extends WithDisposable(ShadowlessElement)
  implements EdgelessContainer, BlockHost
{
  static override styles = css`
    .affine-edgeless-page-block-container {
      position: relative;
      box-sizing: border-box;
      overflow: hidden;
      height: 100%;
      font-family: var(--affine-font-family);
      font-size: var(--affine-font-base);
      line-height: var(--affine-line-height);
      color: var(--affine-text-primary-color);
      font-weight: 400;
    }

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
  `;

  flavour = 'edgeless' as const;

  /**
   * Shared components
   */
  components = {
    dragHandle: <DragHandle | null>null,
  };

  @property()
  mouseRoot!: HTMLElement;

  @property()
  showGrid = true;

  @property()
  page!: Page;

  @property()
  model!: PageBlockModel;

  @property()
  surfaceModel!: SurfaceBlockModel;

  @property()
  mouseMode: MouseMode = {
    type: 'default',
  };

  @state()
  private _toolbarEnabled = false;

  @state()
  private _rectsOfSelectedBlocks: DOMRect[] = [];

  @query('.affine-edgeless-surface-block-container')
  private _surfaceContainer!: HTMLDivElement;

  @query('.affine-edgeless-page-block-container')
  pageBlockContainer!: HTMLDivElement;

  clipboard = new EdgelessClipboard(this.page, this);

  slots = {
    viewportUpdated: new Slot(),
    selectedBlocksUpdated: new Slot<BlockComponentElement[]>(),
    selectionUpdated: new Slot<EdgelessSelectionState>(),
    hoverUpdated: new Slot(),
    surfaceUpdated: new Slot(),
    mouseModeUpdated: new Slot<MouseMode>(),

    subpageLinked: new Slot<{ pageId: string }>(),
    subpageUnlinked: new Slot<{ pageId: string }>(),
    pageLinkClicked: new Slot<{ pageId: string; blockId?: string }>(),
  };

  surface!: SurfaceManager;

  getService = getService;

  private _selection!: EdgelessSelectionManager;
  // FIXME: Many parts of code assume that the `selection` is used in page mode
  getSelection() {
    return this._selection;
  }

  private _resizeObserver: ResizeObserver | null = null;

  private _frameResizeObserver = new FrameResizeObserver();

  private _clearSelection() {
    requestAnimationFrame(() => {
      if (!this._selection.isActive) {
        resetNativeSelection(null);
      }
    });
  }

  // just init surface, attach to dom later
  private _initSurface() {
    const { page } = this;
    const yContainer = page.ySurfaceContainer;
    this.surface = new SurfaceManager(yContainer, value => {
      if (isCssVariable(value)) {
        const cssValue = getThemePropertyValue(this, value as CssVariableName);
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
    });
  }

  private _handleToolbarFlag() {
    const clientID = this.page.doc.clientID;

    this._toolbarEnabled =
      this.page.awarenessStore.getFlag('enable_edgeless_toolbar') ?? false;

    this._disposables.add(
      this.page.awarenessStore.slots.update.subscribe(
        msg => msg.state?.flags.enable_edgeless_toolbar,
        enable => {
          this._toolbarEnabled = enable ?? false;
        },
        {
          filter: msg => msg.id === clientID,
        }
      )
    );
  }

  private _initDragHandle = () => {
    const createHandle = () => {
      this.components.dragHandle = createDragHandle(this);
    };
    if (
      this.page.awarenessStore.getFlag('enable_drag_handle') &&
      !this.components.dragHandle
    ) {
      createHandle();
    }
    this._disposables.add(
      this.page.awarenessStore.slots.update.subscribe(
        msg => msg.state?.flags.enable_drag_handle,
        enable => {
          if (enable) {
            if (!this.components.dragHandle) {
              createHandle();
            }
          } else {
            this.components.dragHandle?.remove();
            this.components.dragHandle = null;
          }
        },
        {
          filter: msg => msg.id === this.page.doc.clientID,
        }
      )
    );
  };

  private _initSlotEffects() {
    // TODO: listen to new children
    // this.model.children.forEach(frame => {
    //   frame.propsUpdated.on(() => this._selection.syncDraggingArea());
    // });
    const { _disposables, slots } = this;
    _disposables.add(
      slots.viewportUpdated.on(() => {
        const prevZoom = this.style.getPropertyValue('--affine-zoom');
        const newZoom = this.surface.viewport.zoom;
        if (!prevZoom || +prevZoom !== newZoom) {
          this.style.setProperty('--affine-zoom', `${newZoom}`);
          this.components.dragHandle?.setScale(newZoom);
        }
        this.components.dragHandle?.hide();
        if (this._selection.selectedBlocks.length) {
          slots.selectedBlocksUpdated.emit(this._selection.selectedBlocks);
        }
        this.requestUpdate();
      })
    );
    _disposables.add(
      slots.selectedBlocksUpdated.on(selectedBlocks => {
        this._selection.selectedBlocks = selectedBlocks;
        // TODO: remove `requestAnimationFrame`
        requestAnimationFrame(() => {
          this._rectsOfSelectedBlocks = selectedBlocks.map(
            getRectByBlockElement
          );
        });
        // this.requestUpdate();
      })
    );
    _disposables.add(slots.hoverUpdated.on(() => this.requestUpdate()));
    _disposables.add(
      slots.selectionUpdated.on(state => {
        this._selection.currentController.setBlockSelectionState(state);
        this._clearSelection();
        this.requestUpdate();
      })
    );
    _disposables.add(slots.surfaceUpdated.on(() => this.requestUpdate()));
    _disposables.add(
      slots.mouseModeUpdated.on(mouseMode => {
        if (mouseMode.type !== 'default') {
          this.components.dragHandle?.hide();
        }
        this.mouseMode = mouseMode;
      })
    );
    _disposables.add(
      this.page.slots.historyUpdated.on(() => {
        this._clearSelection();
        this.requestUpdate();
      })
    );
    _disposables.add(this._selection);
    _disposables.add(this.surface);
    _disposables.add(bindEdgelessHotkeys(this));

    _disposables.add(this._frameResizeObserver);
    _disposables.add(
      this._frameResizeObserver.slots.resize.on(resizedFrames => {
        const page = this.page;
        resizedFrames.forEach((domRect, id) => {
          const model = page.getBlockById(id) as TopLevelBlockModel;
          const [x, y, w, h] = deserializeXYWH(model.xywh);

          // ResizeObserver is not effected by CSS transform, so don't deal with viewport zoom.
          const newModelHeight =
            domRect.height + EDGELESS_BLOCK_CHILD_PADDING * 2;

          if (!almostEqual(newModelHeight, h)) {
            page.updateBlock(model, {
              xywh: JSON.stringify([x, y, w, Math.round(newModelHeight)]),
            });
          }
        });

        // FIXME: force updating selection for triggering re-render `selected-rect`
        slots.selectionUpdated.emit({
          ...this._selection.blockSelectionState,
        });
      })
    );
  }

  addFrameWithPoint(
    point: Point,
    width = DEFAULT_FRAME_WIDTH,
    height = DEFAULT_FRAME_HEIGHT
  ) {
    const [x, y] = this.surface.toModelCoord(point.x, point.y);
    return this.page.addBlock(
      'affine:frame',
      {
        xywh: serializeXYWH(
          x - DEFAULT_FRAME_OFFSET_X,
          y - DEFAULT_FRAME_OFFSET_Y,
          width,
          height
        ),
      },
      this.page.root?.id
    );
  }

  /**
   * Adds a new frame with the given blocks and point.
   * @param blocks Array<Partial<BaseBlockModel>>
   * @param point Point
   */
  addNewFrame(blocks: Array<Partial<BaseBlockModel>>, point: Point) {
    this.page.captureSync();
    const frameId = this.addFrameWithPoint(point);
    const ids = this.page.addBlocks(
      blocks.map(({ flavour, ...blockProps }) => {
        assertExists(flavour);
        return {
          flavour,
          blockProps,
        };
      }),
      frameId
    );
    return {
      frameId,
      ids,
    };
  }

  /** Moves selected blocks into a new frame at the given point. */
  moveBlocksToNewFrame(blocks: BaseBlockModel[], point: Point, rect?: DOMRect) {
    this.page.captureSync();
    const width = rect?.width
      ? rect.width / this.surface.viewport.zoom +
        EDGELESS_BLOCK_CHILD_PADDING * 2
      : DEFAULT_FRAME_WIDTH;
    const frameId = this.addFrameWithPoint(point, width);
    this.page.moveBlocks(
      blocks,
      this.page.getBlockById(frameId) as FrameBlockModel
    );
    this.setSelection(frameId, true, blocks[0].id, point);
  }

  /*
   * Set selection state by giving frameId & blockId.
   * Not supports surface elements.
   */
  setSelection(frameId: string, active = true, blockId: string, point?: Point) {
    const frameBlock = this.page.root?.children.find(b => b.id === frameId);
    assertExists(frameBlock);

    requestAnimationFrame(() => {
      this.slots.selectedBlocksUpdated.emit([]);
      this.slots.selectionUpdated.emit({
        selected: [frameBlock as TopLevelBlockModel],
        active,
      });
      // Waiting dom updated, `frame mask` is removed
      this.updateComplete.then(() => {
        if (blockId) {
          asyncFocusRichText(this.page, blockId);
        } else if (point) {
          // Cannot reuse `handleNativeRangeClick` directly here,
          // since `retargetClick` will re-target to pervious editor
          handleNativeRangeAtPoint(point.x, point.y);
        }
      });
    });
  }

  /**
   * Clear selected blocks.
   */
  clearSelectedBlocks() {
    if (this.getSelection().selectedBlocks.length) {
      this.slots.selectedBlocksUpdated.emit([]);
    }
  }

  override update(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('page')) {
      this._initSurface();
      this._selection = new EdgelessSelectionManager(this);
    }
    if (changedProperties.has('mouseMode')) {
      this._selection.mouseMode = this.mouseMode;
    }
    super.update(changedProperties);
  }

  private _initResizeEffect() {
    const resizeObserver = new ResizeObserver((_: ResizeObserverEntry[]) => {
      this.surface.onResize();
      this.slots.selectedBlocksUpdated.emit(this.getSelection().selectedBlocks);
    });
    resizeObserver.observe(this.pageBlockContainer);
    this._resizeObserver = resizeObserver;
  }

  override firstUpdated() {
    this._initSlotEffects();
    this._initDragHandle();
    this._initResizeEffect();
    this.clipboard.init(this.page);
    tryUpdateFrameSize(this.page, this.surface.viewport.zoom);

    requestAnimationFrame(() => {
      // Should be called in requestAnimationFrame,
      // so as to avoid DOM mutation in SurfaceManager constructor
      this.surface.attach(this._surfaceContainer);

      const frame = this.model.children[0] as FrameBlockModel;
      const [modelX, modelY, modelW, modelH] = deserializeXYWH(frame.xywh);
      this.surface.viewport.setCenter(modelX + modelW / 2, modelY + modelH / 2);

      // Due to change `this._toolbarEnabled` in this function
      this._handleToolbarFlag();
      this.requestUpdate();
    });

    // XXX: should be called after rich text components are mounted
    this._clearSelection();
  }

  override updated(changedProperties: Map<string, unknown>) {
    this._frameResizeObserver.resetListener(this.page);
    super.updated(changedProperties);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.clipboard.dispose();
    this.components.dragHandle?.remove();
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
  }

  override render() {
    requestAnimationFrame(() => {
      this._selection.refreshRemoteSelection();
    });

    this.setAttribute(BLOCK_ID_ATTR, this.model.id);

    const { viewport } = this.surface;
    const { _selection, _rectsOfSelectedBlocks, page } = this;
    const { selected, active } = _selection.blockSelectionState;

    const childrenContainer = EdgelessBlockChildrenContainer(
      this.model,
      this,
      this.surface.viewport,
      active
    );

    const { zoom, viewportX, viewportY, left, top } = viewport;
    const draggingArea = EdgelessDraggingArea(_selection.draggingArea);

    const hoverState = _selection.getHoverState();
    const hoverRect = EdgelessHoverRect(hoverState, zoom);

    const cursor = {
      cursor: getCursorMode(this.mouseMode),
    };

    const { style, gap, translateX, translateY } = getBackgroundGrid(
      viewportX,
      viewportY,
      zoom,
      this.showGrid
    );

    return html`
      <div class="affine-edgeless-surface-block-container">
        <!-- attach canvas later in Phasor -->
      </div>
      <div
        class="affine-edgeless-page-block-container"
        style=${styleMap(cursor)}
      >
        <style>
          .affine-block-children-container.edgeless {
            padding-left: 0;
            position: relative;
            overflow: hidden;
            height: 100%;
            background-size: ${gap}px ${gap}px;
            background-position: ${translateX}px ${translateY}px;
            background-color: var(--affine-background-primary-color);
          }
        </style>
        <div
          class="affine-block-children-container edgeless"
          style=${styleMap(style)}
        >
          ${childrenContainer}
        </div>
        <affine-selected-blocks
          .mouseRoot=${this.mouseRoot}
          .state=${{
            rects: _rectsOfSelectedBlocks,
            grab: false,
          }}
          .offset=${{
            x: -left,
            y: -top,
          }}
        ></affine-selected-blocks>
        ${hoverRect} ${draggingArea}
        ${selected.length
          ? html`
              <edgeless-selected-rect
                .page=${page}
                .state=${_selection.blockSelectionState}
                .slots=${this.slots}
                .surface=${this.surface}
              ></edgeless-selected-rect>
            `
          : null}
      </div>
      ${this._toolbarEnabled
        ? html`
            <edgeless-toolbar
              .mouseMode=${this.mouseMode}
              .zoom=${zoom}
              .edgeless=${this}
            ></edgeless-toolbar>
          `
        : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-edgeless-page': EdgelessPageBlockComponent;
  }
}
