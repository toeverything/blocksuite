import type { SurfaceElement } from '@blocksuite/phasor';
import type { Page } from '@blocksuite/store';

import {
  initMouseEventHandlers,
  type MouseMode,
  noop,
  type SelectionEvent,
  type TopLevelBlockModel,
} from '../../__internal__/index.js';
import { updateLocalSelectionRange } from '../default/selection-manager/utils.js';
import type { EdgelessPageBlockComponent } from './edgeless-page-block.js';
import { BrushModeController } from './mode-controllers/brush-mode.js';
import { DefaultModeController } from './mode-controllers/default-mode.js';
import type { MouseModeController } from './mode-controllers/index.js';
import { PanModeController } from './mode-controllers/pan-mode.js';
import { ShapeModeController } from './mode-controllers/shape-mode.js';
import { TextModeController } from './mode-controllers/text-mode.js';
import {
  getSelectionBoxBound,
  getXYWH,
  initWheelEventHandlers,
  pickTopBlock,
} from './utils.js';

export type Selectable = TopLevelBlockModel | SurfaceElement;

export interface EdgelessHoverState {
  rect: DOMRect;
  content: Selectable;
}

export interface EdgelessSelectionState {
  /* The selected block or surface element */
  selected: Selectable[];
  /* True if the selected content is active (like after double click) */
  active: boolean;
}

export interface SelectionArea {
  start: DOMPoint;
  end: DOMPoint;
}

export class EdgelessSelectionManager {
  readonly page: Page;

  private _mouseMode: MouseMode = {
    type: 'default',
  };

  private _container: EdgelessPageBlockComponent;
  private _controllers: Record<MouseMode['type'], MouseModeController>;

  private _mouseDisposeCallback: () => void = noop;
  private _wheelDisposeCallback: () => void = noop;

  /** Latest mouse position in view coords */
  private _lastMousePos: { x: number; y: number } = { x: 0, y: 0 };

  get isActive() {
    return this.currentController.isActive;
  }

  get mouseMode() {
    return this._mouseMode;
  }

  set mouseMode(mode: MouseMode) {
    this._mouseMode = mode;
    // sync mouse mode
    this._controllers[this._mouseMode.type].mouseMode = this._mouseMode;
  }

  get blockSelectionState() {
    return this.currentController.blockSelectionState;
  }

  get currentController() {
    return this._controllers[this.mouseMode.type];
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
      text: new TextModeController(this._container),
    };

    this._initMouseAndWheelEvents();
  }

  private _updateLastMousePos(e: SelectionEvent) {
    this._lastMousePos = {
      x: e.x,
      y: e.y,
    };
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
    if (this.page.readonly) return;

    return this.currentController.onContainerDragStart(e);
  };

  private _onContainerDragMove = (e: SelectionEvent) => {
    if (this.page.readonly) return;

    return this.currentController.onContainerDragMove(e);
  };

  private _onContainerDragEnd = (e: SelectionEvent) => {
    if (this.page.readonly) return;

    return this.currentController.onContainerDragEnd(e);
  };

  private _onContainerClick = (e: SelectionEvent) => {
    return this.currentController.onContainerClick(e);
  };

  private _onContainerDblClick = (e: SelectionEvent) => {
    return this.currentController.onContainerDblClick(e);
  };

  private _onContainerMouseMove = (e: SelectionEvent) => {
    this._updateLastMousePos(e);
    this._container.slots.hoverUpdated.emit();
    return this._controllers[this.mouseMode.type].onContainerMouseMove(e);
  };

  private _onContainerMouseOut = (e: SelectionEvent) => {
    return this._controllers[this.mouseMode.type].onContainerMouseOut(e);
  };

  private _onContainerContextMenu = (e: SelectionEvent) => {
    return this._controllers[this.mouseMode.type].onContainerContextMenu(e);
  };

  private _onSelectionChangeWithoutDebounce = (_: Event) => {
    updateLocalSelectionRange(this.page);
  };

  dispose() {
    this._mouseDisposeCallback();
    this._wheelDisposeCallback();
  }

  refreshRemoteSelection() {
    const element = document.querySelector('remote-selection');
    if (element) {
      element.requestUpdate();
    }
  }

  getHoverState(): EdgelessHoverState | null {
    if (!this.currentController.enableHover) {
      return null;
    }
    const { surface } = this._container;
    const frames = (this.page.root?.children ?? []) as TopLevelBlockModel[];
    const { x, y } = this._lastMousePos;
    const [modelX, modelY] = surface.toModelCoord(x, y);

    const hovered =
      surface.pickTop(modelX, modelY) ?? pickTopBlock(frames, modelX, modelY);
    if (!hovered) {
      return null;
    }

    const xywh = getXYWH(hovered);
    return {
      rect: getSelectionBoxBound(surface.viewport, xywh),
      content: hovered,
    };
  }
}
