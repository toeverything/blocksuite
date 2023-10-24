import { assertExists } from '@blocksuite/global/utils';

import type { RoughCanvas } from '../../rough/canvas.js';
import { Bound } from '../../utils/bound.js';
import { linePolygonIntersects } from '../../utils/math-utils.js';
import type { PointLocation } from '../../utils/point-location.js';
import type { IVec } from '../../utils/vec.js';
import type { HitTestOptions } from '../edgeless-element.js';
import { SurfaceElement } from '../surface-element.js';
import {
  getFontString,
  getLineHeight,
  getLineWidth,
  truncateTextByWidth,
} from '../text/utils.js';
import type { IGroup, IGroupLocalRecord } from './types.js';

export class GroupElement extends SurfaceElement<IGroup, IGroupLocalRecord> {
  private _cachedChildren: string[] = [];
  private _cachedId: string = '';
  private _titleHeight = getLineHeight("'Kalam', cursive", 16);
  private _titleWidth = 0;
  private _padding = [0, 0];
  private _radius = 0;

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
    this._cachedId = this.id;
    this.childrenElements.forEach(ele => {
      surface.setGroup(ele, this.id);
    });
    this._cachedChildren = this.children;
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

  get title() {
    return this.yMap.get('title') as IGroup['title'];
  }

  get children() {
    return Array.from((<IGroup['children']>this.yMap.get('children')).keys());
  }

  get childrenElements() {
    return this.children.map(id => this.surface.pickById(id)!);
  }

  get titleHeight() {
    return this._titleHeight;
  }

  get titleWidth() {
    return this._titleWidth;
  }

  get padding() {
    return this._padding;
  }

  get radius() {
    return this._radius;
  }

  override get gridBound() {
    const bound = Bound.deserialize(this.xywh);
    bound.y -= this._titleHeight;
    bound.h += this._titleHeight;
    return bound;
  }

  addChild(id: string) {
    const children = this.yMap.get('children') as IGroup['children'];
    this.surface.transact(() => {
      children.set(id, true);
    });
    this._cachedChildren = this.children;
  }

  removeChild(id: string) {
    const children = this.yMap.get('children') as IGroup['children'];
    this.surface.transact(() => {
      children.delete(id);
    });
    this._cachedChildren = this.children;
  }

  override render(
    _ctx: CanvasRenderingContext2D,
    _matrix: DOMMatrix,
    _rc: RoughCanvas
  ): void {
    const { xywh, surface } = this;
    const { elements } = surface.edgeless.selectionManager;
    _ctx.setTransform(_matrix);
    if (elements.includes(this)) {
      this._renderTitle(_ctx);
    } else if (this.childrenElements.some(child => elements.includes(child))) {
      const bound = Bound.deserialize(xywh);
      _ctx.setLineDash([2, 2]);
      _ctx.strokeStyle = this.computedValue('--affine-blue');
      _ctx.lineWidth = 1;
      _ctx.strokeRect(0, 0, bound.w, bound.h);
      this._renderTitle(_ctx);
    }
  }

  private _renderTitle(ctx: CanvasRenderingContext2D) {
    let text = this.title.toJSON();
    const zoom = this.surface.viewport.zoom;
    const bound = Bound.deserialize(this.xywh);
    const fontSize = 16 / zoom;
    const fontFamily = 'sans-serif';
    const offset = Math.max(4 / zoom, 2);
    ctx.translate(0, -offset);

    const lineHeight = getLineHeight(fontFamily, fontSize);
    const font = getFontString({
      fontSize,
      fontFamily,
      lineHeight: `${lineHeight}px`,
    });
    const lineWidth = getLineWidth(text, font);

    const padding = [Math.min(10 / zoom, 10), Math.min(4 / zoom, 4)];
    const radius = Math.min(4, lineHeight / 2);

    this._titleHeight = lineHeight + padding[1] * 2 + offset;
    this._titleWidth = lineWidth + padding[0] * 2;
    if (this._titleWidth > bound.w) {
      text = truncateTextByWidth(text, font, bound.w - 10);
      text = text.slice(0, text.length - 1) + '..';
      this._titleWidth = bound.w;
    }
    this._padding = padding;
    this._radius = radius;

    if (!this.getLocalRecord()?.showTitle) return;
    ctx.beginPath();
    ctx.roundRect(
      0,
      -lineHeight - padding[1] * 2,
      this._titleWidth,
      lineHeight + padding[1] * 2,
      radius
    );
    ctx.fillStyle = '#E3E2E4';
    ctx.fill();

    ctx.font = font;
    ctx.fillStyle = '#424149';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, padding[0], -lineHeight / 2 - padding[1]);
  }

  override hitTest(
    x: number,
    y: number,
    _options?: HitTestOptions | undefined
  ): boolean {
    const bound = Bound.deserialize(this.xywh);
    const titleBound = new Bound(
      bound.x,
      bound.y - this._titleHeight,
      this._titleWidth,
      this._titleHeight
    );
    return bound.isPointInBound([x, y]) || titleBound.isPointInBound([x, y]);
  }

  override unmount(): void {
    const { surface } = this;
    this._cachedChildren.forEach(id => {
      const ele = surface.pickById(id);
      if (ele && surface.getGroup(ele) === this._cachedId)
        surface.setGroup(ele, surface.getGroup(this));
    });
    super.unmount();
  }
}
