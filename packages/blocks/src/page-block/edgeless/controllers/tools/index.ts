import type { PointerEventState } from '@blocksuite/block-std';

import type { EdgelessTool as EdgelessTool } from '../../../../_common/utils/index.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import type { EdgelessPageService } from '../../edgeless-page-service.js';
import type { SelectionArea } from '../../services/tools-manager.js';
import type { EdgelessBlockModel } from '../../type.js';

export abstract class EdgelessToolController<
  Tool extends EdgelessTool = EdgelessTool,
> {
  protected _edgeless!: EdgelessPageBlockComponent;

  protected _draggingArea: SelectionArea | null = null;

  protected _service: EdgelessPageService;

  enableHover = false;

  constructor(service: EdgelessPageService) {
    this._service = service;
  }

  mount(edgeless: EdgelessPageBlockComponent) {
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

  protected get _blocks(): EdgelessBlockModel[] {
    return this._edgeless.service.blocks;
  }

  abstract tool: Tool;
  abstract onContainerPointerDown(e: PointerEventState): void;
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
  abstract onPressSpaceBar(pressed: boolean): void;
  abstract beforeModeSwitch(prevMode: Tool): void;
  abstract afterModeSwitch(newMode: Tool): void;
}
