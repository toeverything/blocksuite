import type { PointerEventState } from '@blocksuite/block-std';

import type {
  EdgelessTool as EdgelessTool,
  TopLevelBlockModel,
} from '../../../__internal__/index.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';
import type { SelectionArea } from '../utils/selection-manager.js';

export abstract class EdgelessToolController<
  Tool extends EdgelessTool = EdgelessTool
> {
  protected readonly _edgeless: EdgelessPageBlockComponent;

  protected _draggingArea: SelectionArea | null = null;

  enableHover = false;

  constructor(edgeless: EdgelessPageBlockComponent) {
    this._edgeless = edgeless;
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
    return this._edgeless.sortedNotes;
  }

  abstract tool: Tool;
  abstract onContainerDragStart(e: PointerEventState): void;
  abstract onContainerDragMove(e: PointerEventState): void;
  abstract onContainerDragEnd(e: PointerEventState): void;
  abstract onContainerClick(e: PointerEventState): void;
  abstract onContainerDblClick(e: PointerEventState): void;
  abstract onContainerTripleClick(e: PointerEventState): void;
  abstract onContainerMouseMove(e: PointerEventState): void;
  abstract onContainerMouseOut(e: PointerEventState): void;
  abstract onContainerContextMenu(e: PointerEventState): void;
  abstract onPressShiftKey(pressed: boolean): void;
  abstract beforeModeSwitch(prevMode: Tool): void;
  abstract afterModeSwitch(newMode: Tool): void;
}
