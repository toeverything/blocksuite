import type { PointerEventState } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';

import type { BrushTool, EdgelessTool } from '../../../__internal__/index.js';
import { BrushSize, noop } from '../../../__internal__/index.js';
import { GET_DEFAULT_LINE_COLOR } from '../components/panel/color-panel.js';
import { EdgelessToolController } from './index.js';

export class BrushToolController extends EdgelessToolController<BrushTool> {
  readonly tool = <BrushTool>{
    type: 'brush',
    color: GET_DEFAULT_LINE_COLOR(),
    lineWidth: 4,
  };

  private _draggingElementId: string | null = null;
  protected _draggingPathPoints: number[][] | null = null;

  onContainerPointerDown(e: PointerEventState): void {
    noop();
  }

  onContainerClick(e: PointerEventState): void {
    noop();
  }

  onContainerContextMenu(e: PointerEventState): void {
    noop();
  }

  onContainerDblClick(e: PointerEventState): void {
    noop();
  }

  onContainerTripleClick(e: PointerEventState) {
    noop();
  }

  onContainerDragStart(e: PointerEventState) {
    if (!this._page.awarenessStore.getFlag('enable_surface')) return;

    this._page.captureSync();
    const { viewport } = this._edgeless.surface;

    // create a shape block when drag start
    const [modelX, modelY] = viewport.toModelCoord(e.point.x, e.point.y);
    const { color, lineWidth } = this.tool;
    const points = [[modelX, modelY]];

    const id = this._surface.addElement('brush', {
      points,
      color,
      lineWidth,
    });

    this._draggingElementId = id;
    this._draggingPathPoints = points;
  }

  onContainerDragMove(e: PointerEventState) {
    if (!this._page.awarenessStore.getFlag('enable_surface')) return;
    if (!this._draggingElementId) return;

    assertExists(this._draggingElementId);
    assertExists(this._draggingPathPoints);

    const { lineWidth } = this.tool;

    const [modelX, modelY] = this._edgeless.surface.toModelCoord(
      e.point.x,
      e.point.y
    );

    const points = [...this._draggingPathPoints, [modelX, modelY]];

    this._draggingPathPoints = points;

    this._surface.updateElement<'brush'>(this._draggingElementId, {
      points,
      lineWidth,
    });
  }

  onContainerDragEnd(e: PointerEventState) {
    this._draggingElementId = null;
    this._draggingPathPoints = null;
    this._page.captureSync();
  }

  onContainerMouseMove(e: PointerEventState) {
    noop();
  }

  onContainerMouseOut(e: PointerEventState) {
    noop();
  }

  onPressShiftKey(_: boolean) {
    noop();
  }

  beforeModeSwitch() {
    noop();
  }

  afterModeSwitch(newTool: EdgelessTool) {
    this._tryLoadBrushStateLocalRecord(newTool);
  }

  private _tryLoadBrushStateLocalRecord(tool: EdgelessTool) {
    if (tool.type !== 'brush') return;
    const key = 'blocksuite:' + this._edgeless.page.id + ':edgelessBrush';
    const brushData = sessionStorage.getItem(key);
    if (brushData) {
      try {
        const { color, lineWidth } = JSON.parse(brushData);
        this._edgeless.slots.edgelessToolUpdated.emit({
          type: 'brush',
          color: color ?? 'black',
          lineWidth: lineWidth ?? BrushSize.Thin,
        });
      } catch (e) {
        noop();
      }
    }
  }
}
