import type { SurfaceElement } from '@blocksuite/phasor';
import type { Disposable, Page, UserRange } from '@blocksuite/store';

import {
  initMouseEventHandlers,
  MouseMode,
  noop,
  SelectionEvent,
  TopLevelBlockModel,
} from '../../__internal__/index.js';
import { getCurrentBlockRange } from '../../__internal__/utils/block-range.js';
import type { EdgelessPageBlockComponent } from './edgeless-page-block.js';
import { BrushModeController } from './mode-controllers/brush-mode.js';
import { DefaultModeController } from './mode-controllers/default-mode.js';
import type { MouseModeController } from './mode-controllers/index.js';
import { PanModeController } from './mode-controllers/pan-mode.js';
import { ShapeModeController } from './mode-controllers/shape-mode.js';
import { initWheelEventHandlers } from './utils.js';

export type Selectable = TopLevelBlockModel | SurfaceElement;

export interface EdgelessHoverState {
  rect: DOMRect;
  content: Selectable;
}

/* Indicates there is no selected block */
interface NoneSelectionState {
  type: 'none';
}

/* Indicates there is one selected block */
interface SingleSelectionState {
  type: 'single';
  /* The selected block or surface element */
  selected: Selectable;
  /* Rect of the selected content */
  rect: DOMRect;
  /* True if the selected content is active (like after double click) */
  active: boolean;
}

export type EdgelessSelectionState = NoneSelectionState | SingleSelectionState;

export interface SelectionArea {
  start: DOMPoint;
  end: DOMPoint;
}

export class EdgelessSelectionManager {
  readonly page: Page;

  private _mouseMode: MouseMode = {
    type: 'default',
  };
  private _lastMouseMode: MouseMode | null = null;

  private _container: EdgelessPageBlockComponent;
  private _controllers: Record<MouseMode['type'], MouseModeController>;

  private _mouseDisposeCallback: () => void = noop;
  private _selectionUpdateCallback: Disposable;
  private _wheelDisposeCallback: () => void = noop;

  private _prevSelectedShapeId: string | null = null;

  get isActive() {
    return this.currentController.isActive;
  }

  get mouseMode() {
    return this._mouseMode;
  }

  set mouseMode(mode: MouseMode) {
    const currentMouseMode = this._mouseMode;
    this._mouseMode = mode;
    // sync mouse mode
    this._controllers[this._mouseMode.type].mouseMode = this._mouseMode;
    this._lastMouseMode = currentMouseMode;
  }

  get lastMouseMode(): MouseMode | null {
    return this._lastMouseMode;
  }

  get blockSelectionState() {
    return this.currentController.blockSelectionState;
  }

  get currentController() {
    return this._controllers[this.mouseMode.type];
  }

  get hoverState() {
    if (!this.currentController.hoverState) return null;
    return this.currentController.hoverState;
  }

  get isHoveringShape(): boolean {
    return false;
  }

  get draggingArea() {
    if (!this.currentController.draggingArea) return null;

    const { start, end } = this.currentController.draggingArea;
    const minX = Math.min(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxX = Math.max(start.x, end.x);
    const maxY = Math.max(start.y, end.y);
    return new DOMRect(minX, minY, maxX - minX, maxY - minY);
  }

  constructor(container: EdgelessPageBlockComponent) {
    this.page = container.page;
    this._container = container;
    this._controllers = {
      default: new DefaultModeController(this._container),
      shape: new ShapeModeController(this._container),
      brush: new BrushModeController(this._container),
      pan: new PanModeController(this._container),
    };

    this._initMouseAndWheelEvents();
    this._selectionUpdateCallback = this._container.slots.updateSelection.on(
      state => {
        if (this._prevSelectedShapeId) {
          /*
          const element = getBlockById<'affine-shape'>(
            this._prevSelectedShapeId
          );
          if (element) {
            element.selected = false;
          }
          */
          this._prevSelectedShapeId = null;
        }
        if (state.type === 'single') {
          // if (matchFlavours(state.selected, ['affine:shape'])) {
          //   const element = getBlockById<'affine-shape'>(state.selected.id);
          //   if (element) {
          //     element.selected = true;
          //   }
          //   this._previousSelectedShape = state.selected as ShapeBlockModel;
          // }
        }
      }
    );
  }

  private async _initMouseAndWheelEvents() {
    // due to surface initializing after one frame, the events handler should register after that.
    if (!this._container.surface) {
      await new Promise(resolve => requestAnimationFrame(resolve));
    }
    this._mouseDisposeCallback = initMouseEventHandlers(
      this._container,
      this._onContainerDragStart,
      this._onContainerDragMove,
      this._onContainerDragEnd,
      this._onContainerClick,
      this._onContainerDblClick,
      this._onContainerMouseMove,
      this._onContainerMouseOut,
      this._onContainerContextMenu,
      noop,
      this._onSelectionChangeWithoutDebounce
    );

    this._wheelDisposeCallback = initWheelEventHandlers(this._container);
  }

  private _onContainerDragStart = (e: SelectionEvent) => {
    if (this.readonly) return;

    return this.currentController.onContainerDragStart(e);
  };

  private _onContainerDragMove = (e: SelectionEvent) => {
    if (this.readonly) return;

    return this.currentController.onContainerDragMove(e);
  };

  private _onContainerDragEnd = (e: SelectionEvent) => {
    if (this.readonly) return;

    return this.currentController.onContainerDragEnd(e);
  };

  private _onContainerClick = (e: SelectionEvent) => {
    return this.currentController.onContainerClick(e);
  };

  syncDraggingArea() {
    return this.currentController.syncDraggingArea();
  }

  private _onContainerDblClick = (e: SelectionEvent) => {
    return this.currentController.onContainerDblClick(e);
  };

  private _onContainerMouseMove = (e: SelectionEvent) => {
    return this._controllers[this.mouseMode.type].onContainerMouseMove(e);
  };

  private _onContainerMouseOut = (e: SelectionEvent) => {
    return this._controllers[this.mouseMode.type].onContainerMouseOut(e);
  };

  private _onContainerContextMenu = (e: SelectionEvent) => {
    return this._controllers[this.mouseMode.type].onContainerContextMenu(e);
  };

  private _onSelectionChangeWithoutDebounce = (_: Event) => {
    this.updateLocalSelection();
  };

  get readonly() {
    return this.page.awarenessStore.getFlag('readonly');
  }

  dispose() {
    this._mouseDisposeCallback();
    this._wheelDisposeCallback();
    this._selectionUpdateCallback.dispose();
  }

  updateLocalSelection() {
    const page = this.page;
    const blockRange = getCurrentBlockRange(page);
    if (blockRange && blockRange.type === 'Native') {
      const userRange: UserRange = {
        startOffset: blockRange.startOffset,
        endOffset: blockRange.endOffset,
        blockIds: blockRange.models.map(m => m.id),
      };
      page.awarenessStore.setLocalRange(page, userRange);
    }
  }

  refreshRemoteSelection() {
    const element = document.querySelector('remote-selection');
    if (element) {
      element.requestUpdate();
    }
  }
}
