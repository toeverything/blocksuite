import type { PointerEventState } from '@blocksuite/block-std';

import {
  CommonUtils,
  Overlay,
  type SurfaceBlockComponent,
} from '@blocksuite/affine-block-surface';
import { BaseTool } from '@blocksuite/block-std/gfx';
import { Bound, type IVec } from '@blocksuite/global/utils';

import { deleteElementsV2 } from '../utils/crud.js';
import { isTopLevelBlock } from '../utils/query.js';

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

export class EraserTool extends BaseTool {
  static override toolName = 'eraser';

  private _erasable = new Set<BlockSuite.EdgelessModel>();

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
      const zoom = this.gfx.viewport.zoom;
      const d = getSvgPathFromStroke(
        getStroke(this._eraserPoints, {
          size: 16 / zoom,
          start: { taper: true },
        })
      );
      this._overlay.d = d;
      (this.gfx.surfaceComponent as SurfaceBlockComponent)?.refresh();
    }
    this._timer = requestAnimationFrame(this._loop);
  };

  private _overlay = new EraserOverlay(this.gfx);

  private _prevEraserPoint: IVec = [0, 0];

  private _prevPoint: IVec = [0, 0];

  private _timer = 0;

  private _timestamp = 0;

  private _reset() {
    cancelAnimationFrame(this._timer);

    if (!this.gfx.surface) {
      return;
    }

    (
      this.gfx.surfaceComponent as SurfaceBlockComponent
    )?.renderer.removeOverlay(this._overlay);
    this._erasable.clear();
    this._eraseTargets.clear();
  }

  override activate(): void {
    this._eraseTargets.forEach(erasable => {
      if (isTopLevelBlock(erasable)) {
        const ele = this.std.view.getBlock(erasable.id);
        ele && ((ele as HTMLElement).style.opacity = '1');
      } else {
        erasable.opacity = 1;
      }
    });
    this._reset();
  }

  override dragEnd(_: PointerEventState): void {
    deleteElementsV2(this.gfx, Array.from(this._eraseTargets));
    this._reset();
    this.doc.captureSync();
  }

  override dragMove(e: PointerEventState): void {
    const currentPoint = this.gfx.viewport.toModelCoord(e.point.x, e.point.y);
    this._erasable.forEach(erasable => {
      if (erasable.isLocked()) return;
      if (this._eraseTargets.has(erasable)) return;
      if (isTopLevelBlock(erasable)) {
        const bound = Bound.deserialize(erasable.xywh);
        if (
          linePolygonIntersects(this._prevPoint, currentPoint, bound.points)
        ) {
          this._eraseTargets.add(erasable);
          const ele = this.std.view.getBlock(erasable.id);
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

  override dragStart(e: PointerEventState): void {
    this.doc.captureSync();

    const { point } = e;
    const [x, y] = this.gfx.viewport.toModelCoord(point.x, point.y);
    this._eraserPoints = [[x, y]];
    this._prevPoint = [x, y];
    this._erasable = new Set([
      ...this.gfx.layer.canvasElements,
      ...this.gfx.layer.blocks,
    ]);
    this._loop();
    (this.gfx.surfaceComponent as SurfaceBlockComponent)?.renderer.addOverlay(
      this._overlay
    );
  }
}

declare module '@blocksuite/block-std/gfx' {
  interface GfxToolsMap {
    eraser: EraserTool;
  }
}
