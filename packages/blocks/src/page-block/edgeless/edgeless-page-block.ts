/// <reference types="vite/client" />
import './toolbar/edgeless-toolbar.js';
import './view-control-bar.js';
import './components/edgeless-selected-rect.js';

import { BLOCK_ID_ATTR, HOTKEYS } from '@blocksuite/global/config';
import { deserializeXYWH } from '@blocksuite/phasor';
import { SurfaceManager } from '@blocksuite/phasor';
import { DisposableGroup, Page, Slot } from '@blocksuite/store';
import { css, html, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  almostEqual,
  BlockHost,
  hotkey,
  resetNativeSelection,
  TopLevelBlockModel,
} from '../../__internal__/index.js';
import { getService } from '../../__internal__/service.js';
import { NonShadowLitElement } from '../../__internal__/utils/lit.js';
import type {
  FrameBlockModel,
  MouseMode,
  PageBlockModel,
} from '../../index.js';
import type { SurfaceBlockModel } from '../../surface-block/surface-model.js';
import {
  bindCommonHotkey,
  EDGELESS_BLOCK_CHILD_PADDING,
  handleDown,
  handleUp,
  removeCommonHotKey,
  tryUpdateFrameSize,
} from '../utils/index.js';
import { EdgelessBlockChildrenContainer } from './components/block-children-container.js';
import { EdgelessDraggingArea } from './components/dragging-area.js';
import { EdgelessHoverRect } from './components/hover-rect.js';
import { FrameResizeObserver } from './frame-resize-observer.js';
import {
  EdgelessSelectionManager,
  EdgelessSelectionState,
} from './selection-manager.js';
import { getCursorMode, isTopLevelBlock } from './utils.js';

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
  extends NonShadowLitElement
  implements EdgelessContainer, BlockHost
{
  static styles = css`
    .affine-edgeless-page-block-container {
      position: relative;
      box-sizing: border-box;
      overflow: hidden;
      height: 100%;
      font-family: var(--affine-font-family);
      font-size: var(--affine-font-base);
      line-height: var(--affine-line-height);
      color: var(--affine-edgeless-text-color);
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

  @property()
  showGrid = false;

  @property()
  page!: Page;

  @property()
  pageModel!: PageBlockModel;

  @property()
  surfaceModel!: SurfaceBlockModel;

  @property()
  mouseMode: MouseMode = {
    type: 'default',
  };

  @state()
  private _toolbarEnabled = false;

  @query('.affine-edgeless-surface-block-container')
  private _surfaceContainer!: HTMLDivElement;

  slots: EdgelessSelectionSlots = {
    viewportUpdated: new Slot(),
    selectionUpdated: new Slot<EdgelessSelectionState>(),
    hoverUpdated: new Slot(),
    surfaceUpdated: new Slot(),
    mouseModeUpdated: new Slot<MouseMode>(),
  };

  surface!: SurfaceManager;

  getService = getService;

  private _disposables = new DisposableGroup();
  private _selection!: EdgelessSelectionManager;

  // When user enters pan mode by pressing space,
  // we should revert to the last mouse mode once user releases the key.
  private _shouldRevertMode = false;
  private _lastMode: MouseMode | null = null;

  private _frameResizeObserver = new FrameResizeObserver();

  private _bindHotkeys() {
    hotkey.addListener(HOTKEYS.BACKSPACE, this._handleBackspace);
    hotkey.addListener(HOTKEYS.UP, e => handleUp(e, this.page));
    hotkey.addListener(HOTKEYS.DOWN, e => handleDown(e, this.page));
    hotkey.addListener(HOTKEYS.SPACE, this._handleSpace, { keyup: true });
    bindCommonHotkey(this.page);

    return () => {
      hotkey.removeListener(Object.values(HOTKEYS), this.flavour);
      removeCommonHotKey();
    };
  }

  private _handleBackspace = (e: KeyboardEvent) => {
    const { selected } = this._selection.blockSelectionState;
    selected.forEach(element => {
      if (isTopLevelBlock(element)) {
        const children = this.page.root?.children ?? [];
        // FIXME: should always keep at least 1 frame
        if (children.length > 1) {
          this.page.deleteBlock(element);
        }
      } else {
        this.surface.removeElement(element.id);
      }
    });
    this._selection.currentController.clearSelection();
    this.slots.selectionUpdated.emit(this._selection.blockSelectionState);
  };

  private _handleSpace = (event: KeyboardEvent) => {
    const { mouseMode, blockSelectionState } = this._selection;
    if (event.type === 'keydown') {
      if (mouseMode.type === 'pan') {
        return;
      }

      // when user is editing, shouldn't enter pan mode
      if (mouseMode.type === 'default' && blockSelectionState.active) {
        return;
      }

      this.mouseMode = { type: 'pan', panning: false };
      this._shouldRevertMode = true;
      this._lastMode = mouseMode;
    }
    if (event.type === 'keyup') {
      if (
        mouseMode.type === 'pan' &&
        this._shouldRevertMode &&
        this._lastMode
      ) {
        this.mouseMode = this._lastMode;
      }
    }
  };

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
    this.surface = new SurfaceManager(yContainer);
    const frame = this.pageModel.children[0] as FrameBlockModel;
    const [modelX, modelY, modelW, modelH] = deserializeXYWH(frame.xywh);
    this.surface.viewport.setCenter(modelX + modelW / 2, modelY + modelH / 2);
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

  private _initSlotEffects() {
    // TODO: listen to new children
    // this.pageModel.children.forEach(frame => {
    //   frame.propsUpdated.on(() => this._selection.syncDraggingArea());
    // });
    const { _disposables, slots } = this;
    _disposables.add(
      slots.viewportUpdated.on(() => {
        this.style.setProperty(
          '--affine-zoom',
          `${this.surface.viewport.zoom}`
        );
        this.requestUpdate();
      })
    );
    _disposables.add(slots.hoverUpdated.on(() => this.requestUpdate()));
    _disposables.add(slots.selectionUpdated.on(() => this.requestUpdate()));
    _disposables.add(slots.surfaceUpdated.on(() => this.requestUpdate()));
    _disposables.add(
      slots.mouseModeUpdated.on(mouseMode => {
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
    _disposables.add(this._bindHotkeys());

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
        this.setBlockSelectionState({
          ...this._selection.blockSelectionState,
        });
        slots.selectionUpdated.emit(this._selection.blockSelectionState);
      })
    );
  }

  setBlockSelectionState(state: EdgelessSelectionState) {
    this._selection.currentController.setBlockSelectionState(state);
  }

  update(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('page')) {
      this._initSurface();
      this._selection = new EdgelessSelectionManager(this);
    }
    if (changedProperties.has('mouseMode')) {
      this._selection.mouseMode = this.mouseMode;
    }
    super.update(changedProperties);
  }

  firstUpdated() {
    this._initSlotEffects();

    tryUpdateFrameSize(this.page, this.surface.viewport.zoom);

    requestAnimationFrame(() => {
      // Should be called in requestAnimationFrame,
      // so as to avoid DOM mutation in SurfaceManager constructor
      this.surface.attach(this._surfaceContainer);
      // Due to change `this._toolbarEnabled` in this function
      this._handleToolbarFlag();
      this.requestUpdate();
    });

    // XXX: should be called after rich text components are mounted
    this._clearSelection();
  }

  updated(changedProperties: Map<string, unknown>) {
    this._frameResizeObserver.resetListener(this.page);
    super.updated(changedProperties);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._disposables.dispose();
  }

  render() {
    requestAnimationFrame(() => {
      this._selection.refreshRemoteSelection();
    });

    this.setAttribute(BLOCK_ID_ATTR, this.pageModel.id);

    const { viewport } = this.surface;
    const { _selection, page } = this;
    const { selected, active } = _selection.blockSelectionState;

    const childrenContainer = EdgelessBlockChildrenContainer(
      this.pageModel,
      this,
      this.surface.viewport,
      active ? selected[0].id : null
    );

    const { zoom, viewportX, viewportY } = viewport;
    const draggingArea = EdgelessDraggingArea(_selection.draggingArea);

    const hoverState = _selection.getHoverState();
    const hoverRect = EdgelessHoverRect(hoverState, zoom);

    const translateX = -viewportX * zoom;
    const translateY = -viewportY * zoom;

    const gridStyle = {
      backgroundImage:
        'linear-gradient(#cccccc66 1px, transparent 1px),linear-gradient(90deg, #cccccc66 1px, transparent 1px)',
    };
    const defaultStyle = {};
    const style = this.showGrid ? gridStyle : defaultStyle;

    const cursor = {
      cursor: getCursorMode(this.mouseMode),
    };

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
            background-size: ${20 * zoom}px ${20 * zoom}px;
            background-position: ${translateX}px ${translateY}px;
            background-color: #fff;
          }
        </style>
        <div
          class="affine-block-children-container edgeless"
          style=${styleMap(style)}
        >
          ${childrenContainer}
        </div>
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
              .edgeless=${this}
            ></edgeless-toolbar>
          `
        : nothing}
      <edgeless-view-control-bar
        .edgeless=${this}
        .zoom=${zoom}
      ></edgeless-view-control-bar>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-edgeless-page': EdgelessPageBlockComponent;
  }
}
