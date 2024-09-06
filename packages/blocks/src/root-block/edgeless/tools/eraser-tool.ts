import type { PointerEventState } from '@blocksuite/block-std';
import type { IPoint, IVec } from '@blocksuite/global/utils';

import { CommonUtils, Overlay } from '@blocksuite/affine-block-surface';
import { Bound, noop } from '@blocksuite/global/utils';

import { deleteElements } from '../utils/crud.js';
import { isTopLevelBlock } from '../utils/query.js';
import { EdgelessToolController } from './edgeless-tool.js';

const { getSvgPathFromStroke, getStroke, linePolygonIntersects } = CommonUtils;

class EraserOverlay extends Overlay {
  d = '';

  override render(ctx: CanvasRenderingContext2D): void {
    ctx.globalAlpha = 0.33;
    const path = new Path2D(this.d);
    ctx.fillStyle = '#aaa';
    ctx.fill(path);
  }
}

type EraserTool = {
  type: 'eraser';
};

export class EraserToolController extends EdgelessToolController<EraserTool> {
  private _erasables = new Set<BlockSuite.EdgelessModel>();

  private _eraserPoints: IVec[] = [];

  private _eraseTargets = new Set<BlockSuite.EdgelessModel>();

  private _loop = () => {
    const now = Date.now();
    const elapsed = now - this._timestamp;

    let didUpdate = false;

    if (this._prevEraserPoint !== this._prevPoint) {
      didUpdate = true;
      this._eraserPoints.push(this._prevPoint);
      this._prevEraserPoint = this._prevPoint;
    }
    if (elapsed > 32) {
      if (this._eraserPoints.length > 1) {
        didUpdate = true;
        this._eraserPoints.splice(
          0,
          Math.ceil(this._eraserPoints.length * 0.1)
        );
        this._timestamp = now;
      }
    }
    if (didUpdate) {
      const zoom = this._service.viewport.zoom;
      const d = getSvgPathFromStroke(
        getStroke(this._eraserPoints, {
          size: 16 / zoom,
          start: { taper: true },
        })
      );
      this._overlay.d = d;
      this._edgeless.surface.refresh();
    }
    this._timer = requestAnimationFrame(this._loop);
  };

  private _overlay = new EraserOverlay();

  private _prevEraserPoint: IVec = [0, 0];

  private _prevPoint: IVec = [0, 0];

  private _timer = 0;

  private _timestamp = 0;

  override readonly tool: EraserTool = {
    type: 'eraser',
  };

  private _reset() {
    cancelAnimationFrame(this._timer);
    this._edgeless.surface.renderer.removeOverlay(this._overlay);
    this._erasables.clear();
    this._eraseTargets.clear();
  }

  private toModelCoord(p: IPoint): IVec {
    return this._service.viewport.toModelCoord(p.x, p.y);
  }

  override afterModeSwitch(_newMode: EraserTool): void {
    noop();
  }

  override beforeModeSwitch() {
    this._eraseTargets.forEach(erasable => {
      if (isTopLevelBlock(erasable)) {
        const ele = this._edgeless.host.view.getBlock(erasable.id);
        ele && ((ele as HTMLElement).style.opacity = '1');
      } else {
        erasable.opacity = 1;
      }
    });
    this._reset();
  }

  override onContainerClick(): void {
    noop();
  }

  override onContainerContextMenu(): void {
    noop();
  }

  override onContainerDblClick(): void {
    noop();
  }

  override onContainerDragEnd(): void {
    deleteElements(this._edgeless, Array.from(this._eraseTargets));
    this._reset();
    this._doc.captureSync();
  }

  override onContainerDragMove(e: PointerEventState): void {
    const currentPoint = this.toModelCoord(e.point);
    this._erasables.forEach(erasable => {
      if (this._eraseTargets.has(erasable)) return;
      if (isTopLevelBlock(erasable)) {
        const bound = Bound.deserialize(erasable.xywh);
        if (
          linePolygonIntersects(this._prevPoint, currentPoint, bound.points)
        ) {
          this._eraseTargets.add(erasable);
          const ele = this._edgeless.host.view.getBlock(erasable.id);
          ele && ((ele as HTMLElement).style.opacity = '0.3');
        }
      } else {
        if (
          erasable.getLineIntersections(
            this._prevPoint as IVec,
            currentPoint as IVec
          )
        ) {
          this._eraseTargets.add(erasable);
          erasable.opacity = 0.3;
        }
      }
    });

    this._prevPoint = currentPoint;
  }

  override onContainerDragStart(e: PointerEventState): void {
    this._doc.captureSync();

    const { point } = e;
    const [x, y] = this.toModelCoord(point);
    this._eraserPoints = [[x, y]];
    this._prevPoint = [x, y];
    this._erasables = new Set([
      ...this._service.elements,
      ...this._service.blocks,
    ]);
    this._loop();
    this._edgeless.surface.renderer.addOverlay(this._overlay);
  }

  override onContainerMouseMove(): void {
    noop();
  }

  override onContainerMouseOut(): void {
    noop();
  }

  onContainerPointerDown(): void {
    noop();
  }

  override onContainerTripleClick(): void {
    noop();
  }

  override onPressShiftKey(_pressed: boolean): void {
    noop();
  }

  override onPressSpaceBar(_pressed: boolean): void {
    noop();
  }
}

declare global {
  namespace BlockSuite {
    interface EdgelessToolMap {
      eraser: EraserToolController;
    }
  }
}
