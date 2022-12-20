import {
  SelectionEvent,
  initMouseEventHandlers,
  MouseMode,
  RootBlockModel,
} from '../../__internal__/index.js';
import { initWheelEventHandlers } from './utils.js';
import type { EdgelessPageBlockComponent } from './edgeless-page-block.js';
import { DefaultSelectionController } from './selection-manager/default.js';
import { ShapeSelectionController } from './selection-manager/shape.js';
import type {
  HoverState,
  SelectionController,
} from './selection-manager/index.js';

export { HoverState };

interface NoneBlockSelectionState {
  // No selected block
  type: 'none';
}

interface SingleBlockSelectionState {
  // There is one block that be selected
  type: 'single';
  // Which block that be selected
  selected: RootBlockModel;
  // Current viewport
  viewport: ViewportState;
  // Rect of the selected block
  rect: DOMRect;
  // True if the block is active (like double click)
  active: boolean;
}

export type BlockSelectionState =
  | NoneBlockSelectionState
  | SingleBlockSelectionState;

export interface SelectionArea {
  start: DOMPoint;
  end: DOMPoint;
}

export type XYWH = [number, number, number, number];

const MIN_ZOOM = 0.3;

export class ViewportState {
  private _width = 0;
  private _height = 0;
  private _zoom = 1.0;
  private _centerX = 0.0;
  private _centerY = 0.0;

  get zoom() {
    return this._zoom;
  }

  get centerX() {
    return this._centerX;
  }

  get centerY() {
    return this._centerY;
  }

  get viewportX() {
    return this._centerX - this._width / 2 / this._zoom;
  }

  get viewportY() {
    return this._centerY - this._height / 2 / this._zoom;
  }

  get width() {
    return this._width;
  }

  get height() {
    return this._height;
  }

  toModelCoord(viewX: number, viewY: number): [number, number] {
    return [
      this.viewportX + viewX / this._zoom,
      this.viewportY + viewY / this._zoom,
    ];
  }

  toViewCoord(modelX: number, modelY: number): [number, number] {
    return [
      (modelX - this.viewportX) * this._zoom,
      (modelY - this.viewportY) * this._zoom,
    ];
  }

  setSize(width: number, height: number) {
    this._width = width;
    this._height = height;
  }

  setZoom(val: number) {
    this._zoom = val;
  }

  applyDeltaZoom(delta: number) {
    const val = (this.zoom * (100 + delta)) / 100;
    const newZoom = Math.max(val, MIN_ZOOM);
    this.setZoom(newZoom);
  }

  applyDeltaCenter(deltaX: number, deltaY: number) {
    this._centerX += deltaX;
    this._centerY += deltaY;
  }

  setCenter(centerX: number, centerY: number) {
    this._centerX = centerX;
    this._centerY = centerY;
  }
}

export class EdgelessSelectionManager {
  private _mouseMode: MouseMode = {
    type: 'default',
  };
  private _container: EdgelessPageBlockComponent;
  private _selectionManagers: Record<MouseMode['type'], SelectionController>;

  private _mouseDisposeCallback: () => void;
  private _wheelDisposeCallback: () => void;

  get isActive() {
    return this.currentController.isActive;
  }

  get mouseMode() {
    return this._mouseMode;
  }

  set mouseMode(mode: MouseMode) {
    this._mouseMode = mode;
    // sync mouse mode
    this._selectionManagers[this._mouseMode.type].mouseMode = this._mouseMode;
  }

  get blockSelectionState() {
    return this.currentController.blockSelectionState;
  }

  get currentController() {
    return this._selectionManagers[this.mouseMode.type];
  }

  get hoverState() {
    if (!this.currentController.hoverState) return null;
    return this.currentController.hoverState;
  }

  get isHoveringShape(): boolean {
    return this.currentController.hoverState?.block.flavour === 'affine:shape';
  }

  get frameSelectionRect() {
    if (!this.currentController.frameSelectionState) return null;

    const { start, end } = this.currentController.frameSelectionState;
    const minX = Math.min(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxX = Math.max(start.x, end.x);
    const maxY = Math.max(start.y, end.y);
    return new DOMRect(minX, minY, maxX - minX, maxY - minY);
  }

  constructor(container: EdgelessPageBlockComponent) {
    this._container = container;
    this._selectionManagers = {
      default: new DefaultSelectionController(this._container),
      shape: new ShapeSelectionController(this._container),
    };
    this._mouseDisposeCallback = initMouseEventHandlers(
      this._container,
      this._onContainerDragStart,
      this._onContainerDragMove,
      this._onContainerDragEnd,
      this._onContainerClick,
      this._onContainerDblClick,
      this._onContainerMouseMove,
      this._onContainerMouseOut,
      this._onContainerContextMenu
    );
    this._wheelDisposeCallback = initWheelEventHandlers(container);
  }

  private _onContainerDragStart = (e: SelectionEvent) => {
    if (this._container.readonly) {
      return;
    }
    return this.currentController.onContainerDragStart(e);
  };

  private _onContainerDragMove = (e: SelectionEvent) => {
    if (this._container.readonly) {
      return;
    }
    return this.currentController.onContainerDragMove(e);
  };

  private _onContainerDragEnd = (e: SelectionEvent) => {
    if (this._container.readonly) {
      return;
    }
    return this.currentController.onContainerDragEnd(e);
  };

  private _onContainerClick = (e: SelectionEvent) => {
    return this.currentController.onContainerClick(e);
  };

  syncBlockSelectionRect() {
    return this.currentController.syncBlockSelectionRect();
  }

  private _onContainerDblClick = (e: SelectionEvent) => {
    return this.currentController.onContainerDblClick(e);
  };

  private _onContainerMouseMove = (e: SelectionEvent) => {
    return this._selectionManagers[this.mouseMode.type].onContainerMouseMove(e);
  };

  private _onContainerMouseOut = (e: SelectionEvent) => {
    return this._selectionManagers[this.mouseMode.type].onContainerMouseOut(e);
  };

  private _onContainerContextMenu = (e: SelectionEvent) => {
    return this._selectionManagers[this.mouseMode.type].onContainerContextMenu(
      e
    );
  };

  dispose() {
    this._mouseDisposeCallback();
    this._wheelDisposeCallback();
  }
}
