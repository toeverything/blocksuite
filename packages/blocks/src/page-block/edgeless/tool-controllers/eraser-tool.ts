import type { PointerEventState } from '@blocksuite/block-std';
import { noop } from '@blocksuite/global/utils';

import type {
  Erasable,
  IPoint,
  TopLevelBlockModel,
} from '../../../__internal__/utils/index.js';
import {
  type EraserTool,
  getBlockElementById,
} from '../../../__internal__/utils/index.js';
import {
  Bound,
  getStroke,
  getSvgPathFromStroke,
  type IVec,
  linePolygonIntersects,
  Overlay,
} from '../../../surface-block/index.js';
import { deleteElements } from '../utils/crud.js';
import { isTopLevelBlock } from '../utils/query.js';
import { EdgelessToolController } from './index.js';

class EraserOverlay extends Overlay {
  d = '';
  override render(ctx: CanvasRenderingContext2D): void {
    ctx.globalAlpha = 0.33;
    const path = new Path2D(this.d);
    ctx.fillStyle = '#aaa';
    ctx.fill(path);
  }
}

export class EraserToolController extends EdgelessToolController<EraserTool> {
  public override readonly tool: EraserTool = {
    type: 'eraser',
  };

  private _overlay = new EraserOverlay();
  private _timestamp = 0;
  private _timer = 0;
  private _eraserPoints: IVec[] = [];
  private _prevPoint: IVec = [];
  private _prevEraserPoint: IVec = [];
  private _erasables: Set<Erasable> = new Set();
  private _eraseTargets: Set<Erasable> = new Set();

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
      const zoom = this._surface.viewport.zoom;
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

  onContainerPointerDown(): void {
    noop();
  }

  private toModelCoord(p: IPoint): IVec {
    return this._surface.viewport.toModelCoord(p.x, p.y);
  }

  override onContainerDragStart(e: PointerEventState): void {
    this._page.captureSync();

    const { point } = e;
    const [x, y] = this.toModelCoord(point);
    this._eraserPoints = [[x, y]];
    this._prevPoint = [x, y];
    this._erasables = new Set([
      ...this._surface.getElements(),
      ...(<TopLevelBlockModel[]>this._page.getBlockByFlavour('affine:note')),
    ]);
    this._loop();
    this._edgeless.surface.viewport.addOverlay(this._overlay);
  }

  override onContainerDragMove(e: PointerEventState): void {
    const currentPoint = this.toModelCoord(e.point);
    const surface = this._surface;
    this._erasables.forEach(erasable => {
      if (this._eraseTargets.has(erasable)) return;
      if (isTopLevelBlock(erasable)) {
        const bound = Bound.deserialize(erasable.xywh);
        if (
          linePolygonIntersects(this._prevPoint, currentPoint, bound.points)
        ) {
          this._eraseTargets.add(erasable);
          const ele = getBlockElementById(erasable.id);
          ele && ((<HTMLElement>ele).style.opacity = '0.3');
        }
      } else {
        if (erasable.intersectWithLine(this._prevPoint, currentPoint)) {
          this._eraseTargets.add(erasable);
          surface.updateElementLocalRecord(erasable.id, { opacity: 0.3 });
        }
      }
    });

    this._prevPoint = currentPoint;
  }

  override beforeModeSwitch() {
    this._eraseTargets.forEach(erasable => {
      if (isTopLevelBlock(erasable)) {
        const ele = getBlockElementById(erasable.id);
        ele && ((<HTMLElement>ele).style.opacity = '1');
      } else {
        this._surface.updateElementLocalRecord(erasable.id, { opacity: 1 });
      }
    });
    this._reset();
  }

  private _reset() {
    cancelAnimationFrame(this._timer);
    this._edgeless.surface.viewport.removeOverlay(this._overlay);
    this._erasables.clear();
    this._eraseTargets.clear();
  }

  override onContainerDragEnd(): void {
    deleteElements(this._surface, Array.from(this._eraseTargets));
    this._reset();
    this._page.captureSync();
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

  override afterModeSwitch(_newMode: EraserTool): void {
    noop();
  }
}
