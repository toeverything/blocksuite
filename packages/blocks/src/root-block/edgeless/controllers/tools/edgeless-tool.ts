import type { PointerEventState } from '@blocksuite/block-std';

import type { EdgelessBlockModel } from '../../edgeless-block-model.js';
import type { EdgelessRootBlockComponent } from '../../edgeless-root-block.js';
import type { EdgelessRootService } from '../../edgeless-root-service.js';
import type { SelectionArea } from '../../services/tools-manager.js';
import type { EdgelessTool } from '../../types.js';

export abstract class EdgelessToolController<
  Tool extends EdgelessTool = EdgelessTool,
> {
  get draggingArea() {
    return this._draggingArea;
  }

  protected get _surface() {
    return this._edgeless.surface;
  }

  protected get _doc() {
    return this._edgeless.doc;
  }

  protected get _blocks(): EdgelessBlockModel[] {
    return this._edgeless.service.blocks;
  }

  protected _edgeless!: EdgelessRootBlockComponent;

  protected _draggingArea: SelectionArea | null = null;

  protected _service: EdgelessRootService;

  enableHover = false;

  abstract tool: Tool;

  constructor(service: EdgelessRootService) {
    this._service = service;
  }

  mount(edgeless: EdgelessRootBlockComponent) {
    this._edgeless = edgeless;
  }
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
  abstract beforeModeSwitch(prevMode: Tool): void;
  abstract afterModeSwitch(newMode: Tool): void;

  /**
   * @warning Check `!ev.repeat` before calling this function in KeyboardEvents where needed
   */
  abstract onPressShiftKey(pressed: boolean): void;

  /**
   * @warning Check `!ev.repeat` before calling this function in KeyboardEvents where needed
   */
  abstract onPressSpaceBar(pressed: boolean): void;
}
