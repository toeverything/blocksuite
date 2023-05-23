import type { PointerEventState } from '@blocksuite/lit';

import type {
  MouseMode,
  TopLevelBlockModel,
} from '../../../__internal__/index.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';
import type {
  EdgelessSelectionState,
  SelectionArea,
} from '../selection-manager.js';

export abstract class MouseModeController<Mode extends MouseMode = MouseMode> {
  protected readonly _edgeless: EdgelessPageBlockComponent;
  protected _blockSelectionState: EdgelessSelectionState = {
    selected: [],
    active: false,
  };

  protected _draggingArea: SelectionArea | null = null;

  enableHover = false;

  constructor(edgeless: EdgelessPageBlockComponent) {
    this._edgeless = edgeless;
  }

  get isActive() {
    return this._blockSelectionState.active;
  }

  /**
   * Holds the state of the current selected block(s) and/or shape(s).
   */
  get blockSelectionState() {
    return this._blockSelectionState;
  }

  get draggingArea() {
    return this._draggingArea;
  }

  protected get _surface() {
    return this._edgeless.surface;
  }

  protected get _page() {
    return this._edgeless.page;
  }

  protected get _blocks(): TopLevelBlockModel[] {
    return this._edgeless.sortedFrames;
  }

  setBlockSelectionState(state: EdgelessSelectionState) {
    this._blockSelectionState = state;
  }

  public abstract mouseMode: Mode;
  abstract onContainerDragStart(e: PointerEventState): void;
  abstract onContainerDragMove(e: PointerEventState): void;
  abstract onContainerDragEnd(e: PointerEventState): void;
  abstract onContainerClick(e: PointerEventState): void;
  abstract onContainerDblClick(e: PointerEventState): void;
  abstract onContainerTripleClick(e: PointerEventState): void;
  abstract onContainerMouseMove(e: PointerEventState): void;
  abstract onContainerMouseOut(e: PointerEventState): void;
  abstract onContainerContextMenu(e: PointerEventState): void;

  abstract clearSelection(): void;
}
