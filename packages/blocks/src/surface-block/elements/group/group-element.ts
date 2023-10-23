import { assertExists } from '@blocksuite/global/utils';

import type { RoughCanvas } from '../../rough/canvas.js';
import { Bound } from '../../utils/bound.js';
import { linePolygonIntersects } from '../../utils/math-utils.js';
import type { PointLocation } from '../../utils/point-location.js';
import type { IVec } from '../../utils/vec.js';
import { SurfaceElement } from '../surface-element.js';
import type { IGroup } from './types.js';

export class GroupElement extends SurfaceElement<IGroup> {
  private _cacheChildren: string[] = [];
  private _cacheId: string = '';

  override containedByBounds(bound: Bound): boolean {
    return bound.contains(Bound.deserialize(this.xywh));
  }

  override intersectWithLine(start: IVec, end: IVec): PointLocation[] | null {
    const bound = Bound.deserialize(this.xywh);
    return linePolygonIntersects(start, end, bound.points);
  }

  override init(): void {
    super.init();
    const { surface } = this;
    this._cacheId = this.id;
    this.childrenElements.forEach(ele => {
      surface.setGroup(ele, this.id);
    });
    this._cacheChildren = this.children;
    const children = this.yMap.get('children') as IGroup['children'];
    children.observe(event => {
      for (const [key, { action }] of Array.from(event.changes.keys)) {
        if (action === 'delete') {
          const child = this.surface.pickById(key);
          if (child && surface.getGroup(child) === this.id)
            surface.setGroup(child, surface.getGroup(this));
        } else if (action === 'add') {
          const child = this.surface.pickById(key);
          assertExists(child);
          surface.setGroup(child, this.id);
        } else {
          console.log('unexpected', key);
        }
      }
    });
  }

  override get xywh() {
    const { surface } = this;
    const children = this.children;
    if (children.length === 0) return '[0,0,0,0]';
    const bound: Bound = children.reduce((prev, cur) => {
      const ele = surface.pickById(cur);
      assertExists(ele);
      return prev.unite(ele.gridBound);
    }, surface.pickById(children[0])!.gridBound);
    return bound.serialize();
  }

  get children() {
    return Array.from((<IGroup['children']>this.yMap.get('children')).keys());
  }

  get childrenElements() {
    return this.children.map(id => this.surface.pickById(id)!);
  }

  addChild(id: string) {
    const children = this.yMap.get('children') as IGroup['children'];
    this.surface.transact(() => {
      children.set(id, true);
    });
    this._cacheChildren = this.children;
  }

  removeChild(id: string) {
    const children = this.yMap.get('children') as IGroup['children'];
    this.surface.transact(() => {
      children.delete(id);
    });
    this._cacheChildren = this.children;
  }

  override render(
    _ctx: CanvasRenderingContext2D,
    _matrix: DOMMatrix,
    _rc: RoughCanvas
  ): void {
    const { xywh, surface } = this;
    const { elements } = surface.edgeless.selectionManager;
    if (this.childrenElements.every(child => !elements.includes(child))) return;

    const bound = Bound.deserialize(xywh);
    _ctx.setLineDash([2, 2]);
    _ctx.strokeStyle = this.computedValue('--affine-blue');
    _ctx.lineWidth = 1;
    _ctx.setTransform(_matrix);
    _ctx.strokeRect(0, 0, bound.w, bound.h);
  }

  override unmount(): void {
    const { surface } = this;
    this._cacheChildren.forEach(id => {
      const ele = surface.pickById(id);
      if (ele && surface.getGroup(ele) === this._cacheId)
        surface.setGroup(ele, surface.getGroup(this));
    });
    super.unmount();
  }
}
