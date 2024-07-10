import type { PointerEventState } from '@blocksuite/block-std';
import { noop } from '@blocksuite/global/utils';

import type { IPoint } from '../../../../_common/utils/index.js';
import { buildPath } from '../../../../_common/utils/index.js';
import {
  Bound,
  getStroke,
  getSvgPathFromStroke,
  type IVec,
  linePolygonIntersects,
  Overlay,
} from '../../../../surface-block/index.js';
import type { IVec2 } from '../../../../surface-block/utils/vec.js';
import { deleteElements } from '../../utils/crud.js';
import { isTopLevelBlock } from '../../utils/query.js';
import { EdgelessToolController } from './edgeless-tool.js';

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
  private _overlay = new EraserOverlay();

  private _timestamp = 0;

  private _timer = 0;

  private _eraserPoints: IVec[] = [];

  private _prevPoint: IVec = [];

  private _prevEraserPoint: IVec = [];

  private _erasables = new Set<BlockSuite.EdgelessModelType>();

  private _eraseTargets = new Set<BlockSuite.EdgelessModelType>();

  override readonly tool: EraserTool = {
    type: 'eraser',
  };

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

  private toModelCoord(p: IPoint): IVec {
    return this._service.viewport.toModelCoord(p.x, p.y);
  }

  private _reset() {
    cancelAnimationFrame(this._timer);
    this._edgeless.surface.renderer.removeOverlay(this._overlay);
    this._erasables.clear();
    this._eraseTargets.clear();
  }

  onContainerPointerDown(): void {
    noop();
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
          const ele = this._edgeless.host.view.viewFromPath(
            'block',
            buildPath(erasable)
          );
          ele && ((ele as HTMLElement).style.opacity = '0.3');
        }
      } else {
        if (
          erasable.intersectWithLine(
            this._prevPoint as IVec2,
            currentPoint as IVec2
          )
        ) {
          this._eraseTargets.add(erasable);
          erasable.opacity = 0.3;
        }
      }
    });

    this._prevPoint = currentPoint;
  }

  override beforeModeSwitch() {
    this._eraseTargets.forEach(erasable => {
      if (isTopLevelBlock(erasable)) {
        const ele = this._edgeless.host.view.viewFromPath(
          'block',
          buildPath(erasable)
        );
        ele && ((ele as HTMLElement).style.opacity = '1');
      } else {
        erasable.opacity = 1;
      }
    });
    this._reset();
  }

  override onContainerDragEnd(): void {
    deleteElements(this._surface, Array.from(this._eraseTargets));
    this._reset();
    this._doc.captureSync();
  }

  override onContainerClick(): void {
    noop();
  }

  override onContainerDblClick(): void {
    noop();
  }

  override onContainerTripleClick(): void {
    noop();
  }

  override onContainerMouseMove(): void {
    noop();
  }

  override onContainerMouseOut(): void {
    noop();
  }

  override onContainerContextMenu(): void {
    noop();
  }

  override onPressShiftKey(_pressed: boolean): void {
    noop();
  }

  override onPressSpaceBar(_pressed: boolean): void {
    noop();
  }

  override afterModeSwitch(_newMode: EraserTool): void {
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
