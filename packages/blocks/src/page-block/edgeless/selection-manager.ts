import { GroupBlockModel } from '../../group-block';
import { EdgelessContainer } from './edgeless-page-block';
import {
  SelectionEvent,
  initMouseEventHandlers,
  resetNativeSeletion,
  noop,
  caretRangeFromPoint,
  handleRangeDragMove,
} from '../../__internal__';
import {
  getSelectionBoxBound,
  initWheelEventHandlers,
  pick,
  toModelCoord,
} from './utils';

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

export class EdgelessSelectionManager {
  private _container: EdgelessContainer;
  private _mouseDisposeCallback: () => void;
  private _wheelDisposeCallback: () => void;

  private _state: EdgelessSelectionState = {
    type: 'none',
  };
  private _startRange: Range | null = null;
  // private _startPoint: { x: number; y: number } | null = null;

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
      this._onContainerMouseOut
    );
    this._wheelDisposeCallback = initWheelEventHandlers(container);
  }

  private get _store() {
    return this._container.store;
  }

  private get _blocks(): GroupBlockModel[] {
    return (this._store.root?.children as GroupBlockModel[]) ?? [];
  }

  private _onContainerDragStart = (e: SelectionEvent) => {
    this._startRange = caretRangeFromPoint(e.raw.clientX, e.raw.clientY);
    // this._startPoint = { x: e.raw.clientX, y: e.raw.clientY };
  };

  private _onContainerDragMove = (e: SelectionEvent) => {
    switch (this.state.type) {
      case 'none':
        return;
      case 'single':
        if (this.state.active) {
          // TODO reset if drag out of group
          handleRangeDragMove(this._startRange, e);
        }
        // for inactive selection, drag move selected group
        else {
          const block = this.state.selected;
          const [modelX, modelY, modelW, modelH] = JSON.parse(
            block.xywh
          ) as XYWH;

          this._store.updateBlock(block, {
            xywh: JSON.stringify([
              modelX + e.delta.x,
              modelY + e.delta.y,
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
    const { viewport } = this._container;
    const [modelX, modelY] = toModelCoord(viewport, e.x, e.y);
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
      resetNativeSeletion(null);
    }
  };

  syncSelectionBox() {
    if (this.state.type === 'single') {
      this.state.box = getSelectionBoxBound(
        this._container.viewport,
        this.state.selected.xywh
      );
      this._container.signals.updateSelection.emit(this.state);
    }
  }

  private _onContainerDblClick = (e: SelectionEvent) => {
    if (this.state.type === 'single') {
      this.state.active = true;
      this._container.signals.updateSelection.emit(this.state);
    }
  };

  private _onContainerMouseMove = (e: SelectionEvent) => {
    noop();
  };

  private _onContainerMouseOut = (e: SelectionEvent) => {
    noop();
  };

  dispose() {
    this._mouseDisposeCallback();
    this._wheelDisposeCallback();
  }
}
