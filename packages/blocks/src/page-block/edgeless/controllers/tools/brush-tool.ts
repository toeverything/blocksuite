import type { PointerEventState } from '@blocksuite/block-std';
import { assertExists, noop } from '@blocksuite/global/utils';

import type {
  BrushTool,
  EdgelessTool,
} from '../../../../_common/utils/index.js';
import { LineWidth } from '../../../../_common/utils/index.js';
import {
  CanvasElementType,
  type IVec,
} from '../../../../surface-block/index.js';
import { GET_DEFAULT_LINE_COLOR } from '../../components/panel/color-panel.js';
import { EdgelessToolController } from './index.js';

export class BrushToolController extends EdgelessToolController<BrushTool> {
  readonly tool = <BrushTool>{
    type: 'brush',
    color: GET_DEFAULT_LINE_COLOR(),
    lineWidth: 4,
  };

  private _draggingElementId: string | null = null;
  protected _draggingPathPoints: number[][] | null = null;
  private _lastPoint: IVec | null = null;
  private _straightLineType: 'horizontal' | 'vertical' | null = null;

  onContainerPointerDown(): void {
    noop();
  }

  onContainerClick(): void {
    noop();
  }

  onContainerContextMenu(): void {
    noop();
  }

  onContainerDblClick(): void {
    noop();
  }

  onContainerTripleClick() {
    noop();
  }

  onContainerDragStart(e: PointerEventState) {
    this._page.captureSync();
    const { viewport } = this._edgeless.surface;

    // create a shape block when drag start
    const [modelX, modelY] = viewport.toModelCoord(e.point.x, e.point.y);
    const { color, lineWidth } = this.tool;
    const points = [[modelX, modelY]];

    const id = this._surface.addElement(CanvasElementType.BRUSH, {
      points,
      color,
      lineWidth,
    });

    this._lastPoint = [e.point.x, e.point.y];
    this._draggingElementId = id;
    this._draggingPathPoints = points;
  }

  onContainerDragMove(e: PointerEventState) {
    if (!this._draggingElementId) return;

    assertExists(this._draggingElementId);
    assertExists(this._draggingPathPoints);

    const { lineWidth } = this.tool;

    let pointX = e.point.x;
    let pointY = e.point.y;
    const holdingShiftKey = e.keys.shift || this._edgeless.tools.shiftKey;
    if (holdingShiftKey) {
      if (!this._straightLineType) {
        this._straightLineType = this._getStraightLineType([pointX, pointY]);
      }

      if (this._straightLineType === 'horizontal') {
        pointY = this._lastPoint?.[1] ?? pointY;
      } else if (this._straightLineType === 'vertical') {
        pointX = this._lastPoint?.[0] ?? pointX;
      }
    } else if (this._straightLineType) {
      this._straightLineType = null;
    }

    const [modelX, modelY] = this._edgeless.surface.toModelCoord(
      pointX,
      pointY
    );

    const points = [...this._draggingPathPoints, [modelX, modelY]];

    this._lastPoint = [pointX, pointY];
    this._draggingPathPoints = points;

    this._edgeless.updateElementInLocal(this._draggingElementId, {
      points,
      lineWidth,
    });
  }

  onContainerDragEnd() {
    if (this._draggingElementId) {
      this._edgeless.applyLocalRecord([this._draggingElementId]);
    }

    this._draggingElementId = null;
    this._draggingPathPoints = null;
    this._lastPoint = null;
    this._straightLineType = null;
    this._page.captureSync();
  }

  onContainerMouseMove() {
    noop();
  }

  onContainerMouseOut() {
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
          lineWidth: lineWidth ?? LineWidth.Thin,
        });
      } catch (e) {
        noop();
      }
    }
  }

  private _getStraightLineType(currentPoint: IVec) {
    const lastPoint = this._lastPoint;
    if (!lastPoint) return null;

    // check angle to determine if the line is horizontal or vertical
    const dx = currentPoint[0] - lastPoint[0];
    const dy = currentPoint[1] - lastPoint[1];
    const absAngleRadius = Math.abs(Math.atan2(dy, dx));
    return absAngleRadius < Math.PI / 4 || absAngleRadius > 3 * (Math.PI / 4)
      ? 'horizontal'
      : 'vertical';
  }
}
