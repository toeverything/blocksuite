import type { PointerEventState } from '@blocksuite/block-std';

import type { GfxBlockModel } from '../block-model.js';
import type { EdgelessRootBlockComponent } from '../edgeless-root-block.js';
import type { EdgelessRootService } from '../edgeless-root-service.js';
import type { SelectionArea } from '../services/tools-manager.js';
import type { EdgelessTool } from '../types.js';

export abstract class EdgelessToolController<
  Tool extends EdgelessTool = EdgelessTool,
> {
  protected _draggingArea: SelectionArea | null = null;

  protected _edgeless!: EdgelessRootBlockComponent;

  protected _service: EdgelessRootService;

  enableHover = false;

  abstract tool: Tool;

  protected get _blocks(): GfxBlockModel[] {
    return this._edgeless.service.blocks;
  }

  protected get _doc() {
    return this._edgeless.doc;
  }

  protected get _surface() {
    return this._edgeless.surface;
  }

  get draggingArea() {
    return this._draggingArea;
  }

  constructor(service: EdgelessRootService) {
    this._service = service;
  }

  abstract afterModeSwitch(newMode: Tool): void;
  abstract beforeModeSwitch(prevMode: Tool): void;
  mount(edgeless: EdgelessRootBlockComponent) {
    this._edgeless = edgeless;
  }
  abstract onContainerClick(e: PointerEventState): void;
  abstract onContainerContextMenu(e: PointerEventState): void;
  abstract onContainerDblClick(e: PointerEventState): void;
  abstract onContainerDragEnd(e: PointerEventState): void;
  abstract onContainerDragMove(e: PointerEventState): void;
  abstract onContainerDragStart(e: PointerEventState): void;
  abstract onContainerMouseMove(e: PointerEventState): void;
  abstract onContainerMouseOut(e: PointerEventState): void;
  abstract onContainerPointerDown(e: PointerEventState): void;
  abstract onContainerTripleClick(e: PointerEventState): void;

  /**
   * @warning Check `!ev.repeat` before calling this function in KeyboardEvents where needed
   */
  abstract onPressShiftKey(pressed: boolean): void;

  /**
   * @warning Check `!ev.repeat` before calling this function in KeyboardEvents where needed
   */
  abstract onPressSpaceBar(pressed: boolean): void;
}
