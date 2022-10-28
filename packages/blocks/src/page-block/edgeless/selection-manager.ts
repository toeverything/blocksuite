import { GroupBlockModel } from '../../group-block';
import { EdgelessContainer } from './edgeless-page-block';
import {
  SelectionEvent,
  initMouseEventHandlers,
  resetNativeSelection,
  noop,
  caretRangeFromPoint,
  handleNativeRangeDragMove,
  handleNativeRangeClick,
} from '../../__internal__';
import { getSelectionBoxBound, initWheelEventHandlers, pick } from './utils';
import { repairerContextMenuRange } from '../utils/cursor';

interface NoneSelectionState {
  type: 'none';
}

interface SingleSelectionState {
  type: 'single';
  selected: GroupBlockModel;
  box: DOMRect;
  active: boolean;
}

export type EdgelessSelectionState = NoneSelectionState | SingleSelectionState;

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
  private _container: EdgelessContainer;
  private _mouseDisposeCallback: () => void;
  private _wheelDisposeCallback: () => void;

  private _state: EdgelessSelectionState = {
    type: 'none',
  };
  private _startRange: Range | null = null;

  get state() {
    return this._state;
  }

  constructor(container: EdgelessContainer) {
    this._container = container;
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

  private get _store() {
    return this._container.store;
  }

  private get _blocks(): GroupBlockModel[] {
    return (this._store.root?.children as GroupBlockModel[]) ?? [];
  }

  get isActive() {
    return this._state.type === 'single' && this._state.active;
  }

  private _resetState(e: SelectionEvent) {
    const { viewport } = this._container;
    const [modelX, modelY] = viewport.toModelCoord(e.x, e.y);
    const selected = pick(this._blocks, modelX, modelY);
    if (selected) {
      this._state = {
        type: 'single',
        active: this._state.type === 'single' && this._state.active,
        selected,
        box: getSelectionBoxBound(viewport, selected.xywh),
      };
      this._container.signals.updateSelection.emit(this.state);
    } else {
      this._state = { type: 'none' };
      this._container.signals.updateSelection.emit(this.state);
      resetNativeSelection(null);
    }
  }

  private _onContainerDragStart = (e: SelectionEvent) => {
    this._resetState(e);
    this._startRange = caretRangeFromPoint(e.raw.clientX, e.raw.clientY);
  };

  private _onContainerDragMove = (e: SelectionEvent) => {
    switch (this.state.type) {
      case 'none':
        return;
      case 'single':
        if (this.state.active) {
          // TODO reset if drag out of group
          handleNativeRangeDragMove(this._startRange, e);
        }
        // for inactive selection, drag move selected group
        else {
          const block = this.state.selected;
          const [modelX, modelY, modelW, modelH] = JSON.parse(
            block.xywh
          ) as XYWH;
          const { zoom } = this._container.viewport;

          this._store.updateBlock(block, {
            xywh: JSON.stringify([
              modelX + e.delta.x / zoom,
              modelY + e.delta.y / zoom,
              modelW,
              modelH,
            ]),
          });
          this._container.signals.updateSelection.emit(this.state);
        }
    }
  };

  private _onContainerDragEnd = (e: SelectionEvent) => {
    noop();
  };

  private _onContainerClick = (e: SelectionEvent) => {
    this._resetState(e);
    if (this.isActive) {
      handleNativeRangeClick(this._store, e);
    }
  };

  syncSelectionBox() {
    if (this.state.type === 'single') {
      this.state.box = getSelectionBoxBound(
        this._container.viewport,
        this.state.selected.xywh
      );
    }
    this._container.signals.updateSelection.emit(this.state);
  }

  private _onContainerDblClick = (e: SelectionEvent) => {
    if (this.state.type === 'single') {
      this.state.active = true;
      this._container.signals.updateSelection.emit(this.state);
      handleNativeRangeClick(this._store, e);
    }
  };

  private _onContainerMouseMove = (e: SelectionEvent) => {
    noop();
  };

  private _onContainerMouseOut = (e: SelectionEvent) => {
    noop();
  };

  private _onContainerContextMenu = (e: SelectionEvent) => {
    repairerContextMenuRange(e);
  };

  dispose() {
    this._mouseDisposeCallback();
    this._wheelDisposeCallback();
  }
}
