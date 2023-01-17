import type {
  MouseMode,
  RootBlockModel,
  SelectionEvent,
} from '../../../__internal__/index.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';
import type {
  BlockSelectionState,
  SelectionArea,
} from '../selection-manager.js';

export interface HoverState {
  rect: DOMRect;
  block: RootBlockModel;
}

export abstract class MouseModeController<Mode extends MouseMode = MouseMode> {
  protected readonly _edgeless: EdgelessPageBlockComponent;
  protected _blockSelectionState: BlockSelectionState = {
    type: 'none',
  };

  protected _hoverState: HoverState | null = null;
  protected _frameSelectionState: SelectionArea | null = null;

  constructor(edgeless: EdgelessPageBlockComponent) {
    this._edgeless = edgeless;
  }

  get isActive() {
    return (
      this._blockSelectionState.type === 'single' &&
      this._blockSelectionState.active
    );
  }

  get hoverState() {
    return this._hoverState;
  }

  /**
   * Hold the state that the current selection of block(s)
   */
  get blockSelectionState() {
    return this._blockSelectionState;
  }

  get frameSelectionState() {
    return this._frameSelectionState;
  }

  protected get _surface() {
    return this._edgeless.surface;
  }

  protected get _page() {
    return this._edgeless.page;
  }

  protected get _blocks(): RootBlockModel[] {
    return (this._page.root?.children as RootBlockModel[]) ?? [];
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

  abstract syncBlockSelectionRect(): void;
}
