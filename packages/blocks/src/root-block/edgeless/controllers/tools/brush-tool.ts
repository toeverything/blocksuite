import type { PointerEventState } from '@blocksuite/block-std';
import { assertExists, noop } from '@blocksuite/global/utils';

import type { BrushTool } from '../../../../_common/utils/index.js';
import type { BrushElementModel } from '../../../../surface-block/index.js';
import {
  CanvasElementType,
  type IVec,
} from '../../../../surface-block/index.js';
import { EdgelessToolController } from './index.js';

export class BrushToolController extends EdgelessToolController<BrushTool> {
  readonly tool = <BrushTool>{
    type: 'brush',
  };

  private _draggingElement: BrushElementModel | null = null;
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
    this._doc.captureSync();
    const { viewport } = this._edgeless.service;

    // create a shape block when drag start
    const [modelX, modelY] = viewport.toModelCoord(e.point.x, e.point.y);
    const points = [[modelX, modelY]];

    const id = this._service.addElement(CanvasElementType.BRUSH, {
      points,
    });

    const element = this._service.getElementById(id) as BrushElementModel;

    element.stash('points');
    element.stash('xywh');

    this._lastPoint = [e.point.x, e.point.y];
    this._draggingElementId = id;
    this._draggingElement = element;
    this._draggingPathPoints = points;
  }

  onContainerDragMove(e: PointerEventState) {
    if (!this._draggingElementId) return;

    assertExists(this._draggingElementId);
    assertExists(this._draggingPathPoints);

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

    const [modelX, modelY] = this._service.viewport.toModelCoord(
      pointX,
      pointY
    );

    const points = [...this._draggingPathPoints, [modelX, modelY]];

    this._lastPoint = [pointX, pointY];
    this._draggingPathPoints = points;

    this._edgeless.service.updateElement(this._draggingElementId, {
      points,
    });
  }

  onContainerDragEnd() {
    if (this._draggingElement) {
      const { _draggingElement } = this;
      this._doc.transact(() => {
        _draggingElement.pop('points');
        _draggingElement.pop('xywh');
      });
    }
    this._draggingElement = null;
    this._draggingElementId = null;
    this._draggingPathPoints = null;
    this._lastPoint = null;
    this._straightLineType = null;
    this._doc.captureSync();
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

  onPressSpaceBar(_pressed: boolean): void {
    noop();
  }

  beforeModeSwitch() {
    noop();
  }

  afterModeSwitch() {
    noop();
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
