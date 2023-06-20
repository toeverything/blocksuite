import type { PointerEventState } from '@blocksuite/block-std';
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
  private _timestamp = 0;
  private _interval = 0;
  private _eraserPoints: IVec[] = [];
  private _prevPoint: IVec = [];
  private _prevEraserPoint: IVec = [];
  private erasableElements: Set<Erasable> = new Set();
  private toBeErasedElements: Set<Erasable> = new Set();

  private _loop() {
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
    this._interval = requestAnimationFrame(this._loop.bind(this));
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
    this.erasableElements = new Set([
      ...this._surface.getElements(),
      ...(<TopLevelBlockModel[]>this._page.getBlockByFlavour('affine:note')),
    ]);
    this._loop();
    this._edgeless.surface.viewport.addOverlay(this._overlay);
  }
  override onContainerDragMove(e: PointerEventState): void {
    const currentPoint = this.toModelCoord(e.point);
    const surface = this._surface;
    this.erasableElements.forEach(element => {
      if (this.toBeErasedElements.has(element)) return;
      if (isTopLevelBlock(element)) {
        const bound = Bound.deserialize(element.xywh);
        if (
          linePolygonIntersects(this._prevPoint, currentPoint, bound.points)
        ) {
          this.toBeErasedElements.add(element);
          const ele = getBlockElementById(element.id);
          ele && ((<HTMLElement>ele).style.opacity = '0.3');
        }
      } else {
        if (element.isIntersectLine(this._prevPoint, currentPoint)) {
          this.toBeErasedElements.add(element);
          surface.updateElementLocalRecord(element.id, { opacity: 0.3 });
        }
      }
    });

    this._prevPoint = currentPoint;
  }

  override beforeModeSwitch(mode: MouseMode) {
    this.toBeErasedElements.forEach(element => {
      if (isTopLevelBlock(element)) {
        const ele = getBlockElementById(element.id);
        ele && ((<HTMLElement>ele).style.opacity = '1');
      } else {
        this._surface.updateElementLocalRecord(element.id, { opacity: 1 });
      }
    });
    this._reset();
  }

  private _reset() {
    cancelAnimationFrame(this._interval);
    this._edgeless.surface.viewport.removeOverlay(this._overlay);
    this.erasableElements.clear();
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
    this._reset();
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
