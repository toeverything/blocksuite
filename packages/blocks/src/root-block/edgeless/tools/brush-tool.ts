import type { BrushElementModel } from '@blocksuite/affine-model';
import type { PointerEventState } from '@blocksuite/block-std';
import type { IVec } from '@blocksuite/global/utils';

import { CanvasElementType } from '@blocksuite/affine-block-surface';
import { TelemetryProvider } from '@blocksuite/affine-shared/services';
import { assertExists, noop } from '@blocksuite/global/utils';

import { EdgelessToolController } from './edgeless-tool.js';

type BrushTool = {
  type: 'brush';
};

export class BrushToolController extends EdgelessToolController<BrushTool> {
  static BRUSH_POP_GAP = 20;

  private _draggingElement: BrushElementModel | null = null;

  private _draggingElementId: string | null = null;

  private _lastPoint: IVec | null = null;

  private _lastPopLength = 0;

  private _pressureSupportedPointerIds = new Set<number>();

  private _straightLineType: 'horizontal' | 'vertical' | null = null;

  protected _draggingPathPoints: number[][] | null = null;

  protected _draggingPathPressures: number[] | null = null;

  readonly tool = {
    type: 'brush',
  } as BrushTool;

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

  private _tryGetPressurePoints(e: PointerEventState) {
    assertExists(this._draggingPathPressures);
    const pressures = [...this._draggingPathPressures, e.pressure];
    this._draggingPathPressures = pressures;

    // we do not use the `e.raw.pointerType` to detect because it is not reliable,
    // such as some digital pens do not support pressure even thought the `e.raw.pointerType` is equal to `'pen'`
    const pointerId = e.raw.pointerId;
    const pressureChanged = pressures.some(
      pressure => pressure !== pressures[0]
    );

    if (pressureChanged) {
      this._pressureSupportedPointerIds.add(pointerId);
    }

    assertExists(this._draggingPathPoints);
    const points = this._draggingPathPoints;
    if (this._pressureSupportedPointerIds.has(pointerId)) {
      return points.map(([x, y], i) => [x, y, pressures[i]]);
    } else {
      return points;
    }
  }

  afterModeSwitch() {
    noop();
  }

  beforeModeSwitch() {
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

  onContainerDragEnd() {
    if (this._draggingElement) {
      const { _draggingElement } = this;
      this._doc.withoutTransact(() => {
        _draggingElement.pop('points');
        _draggingElement.pop('xywh');
      });
    }
    this._draggingElement = null;
    this._draggingElementId = null;
    this._draggingPathPoints = null;
    this._draggingPathPressures = null;
    this._lastPoint = null;
    this._straightLineType = null;
    this._doc.captureSync();
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
      points: this._tryGetPressurePoints(e),
    });

    if (
      this._lastPopLength + BrushToolController.BRUSH_POP_GAP <
      this._draggingElement!.points.length
    ) {
      this._lastPopLength = this._draggingElement!.points.length;
      this._doc.withoutTransact(() => {
        this._draggingElement!.pop('points');
        this._draggingElement!.pop('xywh');
      });

      this._draggingElement!.stash('points');
      this._draggingElement!.stash('xywh');
    }
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

    this._service.std
      .getOptional(TelemetryProvider)
      ?.track('CanvasElementAdded', {
        control: 'canvas:draw',
        page: 'whiteboard editor',
        module: 'toolbar',
        segment: 'toolbar',
        type: CanvasElementType.BRUSH,
      });

    const element = this._service.getElementById(id) as BrushElementModel;

    element.stash('points');
    element.stash('xywh');

    this._lastPoint = [e.point.x, e.point.y];
    this._draggingElementId = id;
    this._draggingElement = element;
    this._draggingPathPoints = points;
    this._draggingPathPressures = [e.pressure];
    this._lastPopLength = 0;
  }

  onContainerMouseMove() {
    noop();
  }

  onContainerMouseOut() {
    noop();
  }

  onContainerPointerDown(): void {
    noop();
  }

  onContainerTripleClick() {
    noop();
  }

  onPressShiftKey(_: boolean) {
    noop();
  }

  onPressSpaceBar(_pressed: boolean): void {
    noop();
  }
}

declare global {
  namespace BlockSuite {
    interface EdgelessToolMap {
      brush: BrushToolController;
    }
  }
}
