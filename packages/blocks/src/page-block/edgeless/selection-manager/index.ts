import type {
  MouseMode,
  RootBlockModel,
  SelectionEvent,
} from '../../../__internal__';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block';
import type { BlockSelectionState, SelectionArea } from '../selection-manager';

export interface HoverState {
  rect: DOMRect;
  block: RootBlockModel;
}

export abstract class SelectionController<Mode extends MouseMode = MouseMode> {
  protected readonly _container: EdgelessPageBlockComponent;
  protected _blockSelectionState: BlockSelectionState = {
    type: 'none',
  };

  protected _hoverState: HoverState | null = null;
  protected _frameSelectionState: SelectionArea | null = null;

  constructor(container: EdgelessPageBlockComponent) {
    this._container = container;
  }

  public get isActive() {
    return (
      this._blockSelectionState.type === 'single' &&
      this._blockSelectionState.active
    );
  }

  public get hoverState() {
    return this._hoverState;
  }

  /**
   * Hold the state that the current selection of block(s)
   */
  public get blockSelectionState() {
    return this._blockSelectionState;
  }

  public get frameSelectionState() {
    return this._frameSelectionState;
  }

  protected get _page() {
    return this._container.page;
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
