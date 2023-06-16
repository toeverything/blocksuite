import type { PointerEventState } from '@blocksuite/lit';
import {
  Bound,
  getStroke,
  getSvgPathFromStroke,
  type IVec,
  Overlay,
} from '@blocksuite/phasor';
import { linePolygonIntersects } from '@blocksuite/phasor';

import type {
  Erasable,
  IPoint,
  MouseMode,
  TopLevelBlockModel,
} from '../../../__internal__/utils/index.js';
import {
  type EraserMouseMode,
  getBlockElementById,
  noop,
} from '../../../__internal__/utils/index.js';
import { isTopLevelBlock } from '../utils.js';
import { MouseModeController } from './index.js';

class EraserOverlay extends Overlay {
  d = '';
  override render(ctx: CanvasRenderingContext2D): void {
    ctx.globalAlpha = 0.33;
    const path = new Path2D(this.d);
    ctx.fillStyle = '#aaa';
    ctx.fill(path);
  }
}
export class EraserModeController extends MouseModeController<EraserMouseMode> {
  public override readonly mouseMode: EraserMouseMode = {
    type: 'eraser',
  };

  private _overlay = new EraserOverlay();
  private timestamp = 0;
  private interval = 0;
  private eraserPoints: Array<IVec> = [];
  private prevPoint: IVec = [];
  private prevEraserPoint: IVec = [];
  private canBeErasedElements: Set<Erasable> = new Set();
  private toBeErasedElements: Set<Erasable> = new Set();

  private loop = () => {
    const now = Date.now();
    const elapsed = now - this.timestamp;

    let didUpdate = false;

    if (this.prevEraserPoint !== this.prevPoint) {
      didUpdate = true;
      this.eraserPoints.push(this.prevPoint);
      this.prevEraserPoint = this.prevPoint;
    }
    if (elapsed > 32) {
      if (this.eraserPoints.length > 1) {
        didUpdate = true;
        this.eraserPoints.splice(0, Math.ceil(this.eraserPoints.length * 0.1));
        this.timestamp = now;
      }
    }
    if (didUpdate) {
      const zoom = this._surface.viewport.zoom;
      const d = getSvgPathFromStroke(
        getStroke(this.eraserPoints, {
          size: 16 / zoom,
          start: { taper: true },
        })
      );
      this._overlay.d = d;
      this._edgeless.surface.refresh();
    }
    this.interval = requestAnimationFrame(this.loop);
  };

  private toModelCoord(p: IPoint): IVec {
    return this._surface.viewport.toModelCoord(p.x, p.y);
  }

  override onContainerDragStart(e: PointerEventState): void {
    this._page.captureSync();

    const { point } = e;
    const [x, y] = this.toModelCoord(point);
    this.eraserPoints = [[x, y]];
    this.prevPoint = [x, y];
    this.canBeErasedElements = new Set([
      ...this._surface.getElements(),
      ...(<TopLevelBlockModel[]>this._page.getBlockByFlavour('affine:frame')),
    ]);
    this.loop();
    this._edgeless.surface.viewport.addOverlay(this._overlay);
  }
  override onContainerDragMove(e: PointerEventState): void {
    const currentPoint = this.toModelCoord(e.point);
    const surface = this._surface;
    this.canBeErasedElements.forEach(element => {
      if (this.toBeErasedElements.has(element)) return;
      if (isTopLevelBlock(element)) {
        const bound = Bound.deserialize(element.xywh);
        if (linePolygonIntersects(this.prevPoint, currentPoint, bound.points)) {
          this.toBeErasedElements.add(element);
          const ele = getBlockElementById(element.id);
          ele && ((<HTMLElement>ele).style.opacity = '0.3');
        }
      } else {
        if (element.isIntersectLine(this.prevPoint, currentPoint)) {
          this.toBeErasedElements.add(element);
          surface.updateElementLocalRecord(element.id, { opacity: 0.3 });
        }
      }
    });

    this.prevPoint = currentPoint;
  }

  override beforeModeSwitch(moe: MouseMode) {
    this.toBeErasedElements.forEach(element => {
      if (isTopLevelBlock(element)) {
        const ele = getBlockElementById(element.id);
        ele && ((<HTMLElement>ele).style.opacity = '1');
      } else {
        this._surface.updateElementLocalRecord(element.id, { opacity: 1 });
      }
    });
    this.reset();
  }

  private reset() {
    cancelAnimationFrame(this.interval);
    this._edgeless.surface.viewport.removeOverlay(this._overlay);
    this.canBeErasedElements.clear();
    this.toBeErasedElements.clear();
  }

  override onContainerDragEnd(e: PointerEventState): void {
    this.toBeErasedElements.forEach(element => {
      if (isTopLevelBlock(element)) {
        this._page.deleteBlock(element);
      } else {
        this._surface.removeElement(element.id);
      }
    });
    this.reset();
    this._page.captureSync();
  }
  override onContainerClick(e: PointerEventState): void {
    noop();
  }
  override onContainerDblClick(e: PointerEventState): void {
    noop();
  }
  override onContainerTripleClick(e: PointerEventState): void {
    noop();
  }
  override onContainerMouseMove(e: PointerEventState): void {
    noop();
  }
  override onContainerMouseOut(e: PointerEventState): void {
    noop();
  }
  override onContainerContextMenu(e: PointerEventState): void {
    noop();
  }
  override onPressShiftKey(pressed: boolean): void {
    noop();
  }
}
