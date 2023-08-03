import type { RoughCanvas } from '../../rough/canvas.js';
import { Bound } from '../../utils/bound.js';
import type { PointLocation } from '../../utils/point-location.js';
import { type IVec } from '../../utils/vec.js';
import { type HitTestOptions, SurfaceElement } from '../surface-element.js';
import {
  getFontString,
  getLineHeight,
  getLineWidth,
  truncateTextByWidth,
} from '../text/utils.js';
import type { IFrame, IFrameLocalRecord } from './types.js';

export class FrameElement extends SurfaceElement<IFrame, IFrameLocalRecord> {
  override containedByBounds(bound: Bound): boolean {
    return bound.contains(Bound.deserialize(this.xywh));
  }
  override intersectWithLine(start: IVec, end: IVec): PointLocation[] | null {
    return null;
  }
  override getRelativePointLocation(point: IVec): PointLocation {
    throw new Error('Method not implemented.');
  }
  override getNearestPoint(point: IVec): IVec {
    throw new Error('Method not implemented.');
  }

  private _titleHeight = getLineHeight("'Kalam', cursive", 16);
  private _titleWidth = 0;
  private _padding = [0, 0];
  private _radius = 0;
  private _color = '';

  get color() {
    return this._color;
  }

  set color(v: string) {
    this._color = v;
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

  get title() {
    return this.yMap.get('title') as IFrame['title'];
  }

  override get gridBound() {
    const bound = Bound.deserialize(this.xywh);
    bound.y -= this._titleHeight;
    bound.h += this._titleHeight;
    return bound;
  }

  protected override _connectable = false;

  override hitTest(
    x: number,
    y: number,
    options?: HitTestOptions | undefined
  ): boolean {
    const bound = new Bound(
      this.x,
      this.y - this.titleHeight,
      this.titleWidth,
      this.titleHeight
    );
    return bound.isPointInBound([x, y], 0);
  }

  override render(
    ctx: CanvasRenderingContext2D,
    matrix: DOMMatrix,
    rc: RoughCanvas
  ) {
    const [, , w, h] = this.deserializeXYWH();
    ctx.setTransform(matrix);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 8);
    ctx.stroke();
    this._renderTitle(ctx);
  }

  private _renderTitle(ctx: CanvasRenderingContext2D) {
    let text = this.title.toJSON();
    const zoom = this.surface.viewport.zoom;
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
    if (this._titleWidth > this.w) {
      text = truncateTextByWidth(text, font, this.w);
      text = text.slice(0, text.length - 1) + '...';
      this._titleWidth = this.w;
    }
    this._padding = padding;
    this._radius = radius;

    if (this.getLocalRecord()?.titleHide) return;
    ctx.beginPath();
    ctx.roundRect(
      0,
      -lineHeight - padding[1] * 2,
      this._titleWidth,
      lineHeight + padding[1] * 2,
      radius
    );
    ctx.fillStyle = this.color;
    ctx.fill();

    ctx.font = font;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, padding[0], -lineHeight / 2 - padding[1]);
  }
}
