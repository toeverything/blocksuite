import type { PointerEventState } from '@blocksuite/block-std';
import { Slot } from '@blocksuite/store';

import type { CopilotSelectionTool } from '../../../../_common/utils/index.js';
import { EdgelessToolController } from './index.js';

export class CopilotSelectionController extends EdgelessToolController<CopilotSelectionTool> {
  readonly tool = <CopilotSelectionTool>{
    type: 'copilot',
  };

  private _dragStartPoint: [number, number] = [0, 0];
  private _dragLastPoint: [number, number] = [0, 0];
  private _dragging = false;

  draggingAreaUpdated = new Slot();

  get area() {
    const start = new DOMPoint(
      this._dragStartPoint[0],
      this._dragStartPoint[1]
    );
    const end = new DOMPoint(this._dragLastPoint[0], this._dragLastPoint[1]);

    const minX = Math.min(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxX = Math.max(start.x, end.x);
    const maxY = Math.max(start.y, end.y);

    return new DOMRect(minX, minY, maxX - minX, maxY - minY);
  }

  private _initDragState(e: PointerEventState) {
    this._dragStartPoint = this._service.viewport.toModelCoord(e.x, e.y);
    this._dragLastPoint = this._dragStartPoint;
  }

  override onContainerDragStart(e: PointerEventState): void {
    this._initDragState(e);
    this._dragging = true;
    this.draggingAreaUpdated.emit();
  }

  override onContainerDragMove(e: PointerEventState): void {
    if (!this._dragging) return;

    this._dragLastPoint = this._service.viewport.toModelCoord(e.x, e.y);
    this.draggingAreaUpdated.emit();
  }

  override onContainerDragEnd(): void {
    this._dragging = false;
  }

  onContainerPointerDown(): void {}

  onContainerClick(): void {}

  onContainerContextMenu(): void {}

  onContainerDblClick(): void {}

  onContainerTripleClick(): void {}

  onContainerMouseMove(): void {}

  onContainerMouseOut(): void {}

  onPressShiftKey(): void {}

  onPressSpaceBar(): void {}

  beforeModeSwitch(): void {}

  afterModeSwitch(): void {}
}
