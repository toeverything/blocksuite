import type {
  MouseMode,
  SelectionEvent,
  TopLevelBlockModel,
} from '../../../__internal__/index.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';
import type {
  EdgelessHoverState,
  EdgelessSelectionState,
  SelectionArea,
} from '../selection-manager.js';

export abstract class MouseModeController<Mode extends MouseMode = MouseMode> {
  protected readonly _edgeless: EdgelessPageBlockComponent;
  protected _blockSelectionState: EdgelessSelectionState = {
    selected: [],
    active: false,
  };

  protected _hoverState: EdgelessHoverState | null = null;
  protected _draggingArea: SelectionArea | null = null;

  constructor(edgeless: EdgelessPageBlockComponent) {
    this._edgeless = edgeless;
  }

  get isActive() {
    return this._blockSelectionState.active;
  }

  get hoverState() {
    return this._hoverState;
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
    return (this._page.root?.children as TopLevelBlockModel[]) ?? [];
  }

  public abstract mouseMode: Mode;
  abstract onContainerDragStart(e: SelectionEvent): void;
  abstract onContainerDragMove(e: SelectionEvent): void;
  abstract onContainerDragEnd(e: SelectionEvent): void;
  abstract onContainerClick(e: SelectionEvent): void;
  abstract onContainerDblClick(e: SelectionEvent): void;
  abstract onContainerMouseMove(e: SelectionEvent): void;
  abstract onContainerMouseOut(e: SelectionEvent): void;
  abstract onContainerContextMenu(e: SelectionEvent): void;

  abstract syncDraggingArea(): void;

  abstract clearSelection(): void;
}
