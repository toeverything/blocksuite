import type { PointerEventState } from '@blocksuite/block-std';
import { noop } from '@blocksuite/global/utils';

import {
  type EdgelessModel,
  type IPoint,
  LassoMode,
  type LassoTool,
} from '../../../../_common/types.js';
import type { Bound } from '../../../../surface-block/index.js';
import {
  getBoundFromPoints,
  getSvgPathFromStroke,
  type IVec,
  Overlay,
  Vec,
} from '../../../../surface-block/index.js';
import {
  getPolygonPathFromStroke,
  pointInPolygon,
} from '../../../../surface-block/utils/math-utils.js';
import { EdgelessToolController } from './index.js';

class LassoOverlay extends Overlay {
  d = '';
  strokeStyle = 'blue';
  render(ctx: CanvasRenderingContext2D): void {
    const path = new Path2D(this.d);
    ctx.save();
    ctx.strokeStyle = this.strokeStyle;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2 / this._renderer.zoom;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.setLineDash([2, 5]);
    ctx.fill(path);
    ctx.stroke(path);
    ctx.restore();
  }
}

export class LassoToolController extends EdgelessToolController<LassoTool> {
  readonly tool = <LassoTool>{
    type: 'lasso',
  };

  private _overlay = new LassoOverlay();
  // private _lastTime = 0;
  private _raf = 0;
  private _lassoPoints: IVec[] = [];
  private _lastPoint: IVec = [];
  private _isSelecting = false;
  private _selectionStore = new Set<string>();

  get selection() {
    return this._edgeless.service.selection;
  }

  private toModelCoord(p: IPoint): IVec {
    return this._service.viewport.toModelCoord(p.x, p.y);
  }

  private _loop = () => {
    const path =
      this.tool.mode === LassoMode.FreeHand
        ? getSvgPathFromStroke(this._lassoPoints)
        : getPolygonPathFromStroke(this._lassoPoints);

    this._overlay.d = path;
    this._overlay.strokeStyle = this._surface.themeObserver.getVariableValue(
      '--affine-border-color'
    );
    this._surface.refresh();
    this._raf = requestAnimationFrame(this._loop);
  };

  private _getElementsInsideLasso() {
    const lassoBounds = getBoundFromPoints(this._lassoPoints);
    return this._service
      .pickElementsByBound(lassoBounds)
      .filter(e => this.isInsideLassoSelection(e.elementBound));
  }

  private _reset() {
    cancelAnimationFrame(this._raf);
    this._edgeless.surface.renderer.removeOverlay(this._overlay);
    this._overlay.d = '';

    const elements = this._getElementsInsideLasso();
    this._selectionStore = new Set([
      ...Array.from(this._selectionStore),
      ...elements.map(el => el.id),
    ]); // we need this to avoid selecting items which were inside the lasso area previously for some reason and now it is not in add mode

    this._lassoPoints = [];
    this._isSelecting = false;
  }

  private _setSelectionState(elements: string[], editing: boolean) {
    this.selection.set({
      elements,
      editing,
    });
  }

  private _getSelectionMode(ev: PointerEventState): 'add' | 'sub' | 'set' {
    const shiftKey = ev.keys.shift ?? this._edgeless.tools.shiftKey;
    const altKey = ev.keys.alt ?? false;

    if (shiftKey) return 'add';
    else if (altKey) return 'sub';
    else {
      return 'set';
    }
  }

  private _updateSelection(e: PointerEventState) {
    const elements = this._getElementsInsideLasso();

    const selection = this.selection;

    const selectionMode = this._getSelectionMode(e);

    let set!: Set<EdgelessModel>;
    switch (selectionMode) {
      case 'add':
        set = new Set([
          ...elements,
          ...selection.elements.filter(el => this._selectionStore.has(el.id)),
        ]);
        break;
      case 'sub': {
        // const toRemove = new Set(elements.map(el => el.id));
        // console.log(toRemove);
        set = new Set();
        break;
      }
      case 'set':
        set = new Set(elements);
        break;
    }
    this._setSelectionState(
      Array.from(set).map(element => element.id),
      false
    );
  }

  override onContainerPointerDown(e: PointerEventState): void {
    const { mode } = this.tool;
    if (mode !== LassoMode.Polygonal) return;

    const { alt, shift } = e.keys;
    if (!shift && !alt) {
      this._selectionStore.clear();
      this.selection.clear();
    }

    this._isSelecting = true;

    const { point } = e;
    const [x, y] = this.toModelCoord(point);
    if (this._lassoPoints.length < 2) {
      const a = [x, y];
      const b = [x, y];
      this._lassoPoints = [a, b];
      this._lastPoint = b;
      this._raf = requestAnimationFrame(this._loop);
      this._surface.renderer.addOverlay(this._overlay);
    } else {
      const firstPoint = this._lassoPoints[0];
      const lastPoint = this._lastPoint;
      const dx = lastPoint[0] - firstPoint[0];
      const dy = lastPoint[1] - firstPoint[1];
      if (Vec.len2([dx, dy]) < 20 ** 2) {
        this._updateSelection(e);
        return this._reset();
      }

      this._lastPoint = [x, y];
      this._lassoPoints.push(this._lastPoint);
    }
  }

  override onContainerDragStart(e: PointerEventState): void {
    if (this.tool.mode === LassoMode.Polygonal) return;
    const { alt, shift } = e.keys;
    if (!shift && !alt) {
      this._selectionStore.clear();
      this.selection.clear();
    }

    this._isSelecting = true;

    const { point } = e;
    const [x, y] = this.toModelCoord(point);
    this._lassoPoints = [[x, y]];
    this._raf = requestAnimationFrame(this._loop);
    this._surface.renderer.addOverlay(this._overlay);
  }

  override onContainerDragMove(e: PointerEventState): void {
    if (this.tool.mode === LassoMode.Polygonal) return;

    const { point } = e;
    const [x, y] = this.toModelCoord(point);
    this._lassoPoints.push([x, y]);

    this._updateSelection(e);
  }

  override onContainerDragEnd(e: PointerEventState): void {
    if (this.tool.mode === LassoMode.Polygonal) return;
    this._updateSelection(e);
    this._reset();
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

  private isInsideLassoSelection(bound: Bound): boolean {
    // Check if any corner of the bounding box is inside the lasso polygon
    const firstPoint = this._lassoPoints[0];
    const lassoPoints = this._lassoPoints.concat(
      firstPoint ? [firstPoint] : []
    );

    const elPoly = bound.points;
    for (const point of elPoly) {
      if (pointInPolygon(point, lassoPoints)) return true;
    }
    return false;
  }

  override onContainerMouseMove(e: PointerEventState): void {
    if (this.tool.mode !== LassoMode.Polygonal || !this._isSelecting) return;

    const lastPoint = this._lastPoint;
    const [x, y] = this.toModelCoord(e.point);
    if (lastPoint) {
      lastPoint[0] = x;
      lastPoint[1] = y;
    }
    this._updateSelection(e);
  }

  override onContainerMouseOut(): void {
    noop();
  }

  override onContainerContextMenu(): void {
    noop();
  }

  override beforeModeSwitch(): void {
    this._reset();
  }

  override afterModeSwitch(): void {
    noop();
  }

  override onPressShiftKey(): void {
    noop();
  }

  override onPressSpaceBar(): void {
    noop();
  }
}
