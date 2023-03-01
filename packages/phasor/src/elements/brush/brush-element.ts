import { getStrokePoints } from 'perfect-freehand';

import type { IBound } from '../../consts.js';
import { isPointIn } from '../../utils/hit-utils.js';
import { Utils } from '../../utils/tl-utils.js';
import { serializeXYWH, XYWH } from '../../utils/xywh.js';
import { BaseElement, HitTestOptions } from '../base-element.js';

function getSolidStrokePoints(points: number[][], lineWidth: number) {
  return getStrokePoints(points, {
    size: lineWidth,
    thinning: 0.65,
    streamline: 0.65,
    smoothing: 0.65,
    easing: t => Math.sin((t * Math.PI) / 2),
    simulatePressure: true,
  });
}

function getBrushBoundFromPoints(
  points: number[][],
  lineWidth: number
): IBound {
  const { minX, minY, width, height } = Utils.getBoundsFromPoints(points);
  return {
    x: minX - lineWidth / 2,
    y: minY - lineWidth / 2,
    w: width < lineWidth ? lineWidth : width + lineWidth,
    h: height < lineWidth ? lineWidth : height + lineWidth,
  };
}

export class BrushElement extends BaseElement {
  type = 'brush' as const;
  color = '#000000';
  /* Absolute-positioned offset of the brush starting point */
  anchor: [number, number] = [0, 0];
  /* Brush mouse coords relative to anchor */
  points: number[][] = [];
  lineWidth = 4;

  private get _xywhArray(): XYWH {
    const [x, y] = this.anchor;
    const bound = getBrushBoundFromPoints(this.points, this.lineWidth);
    return [x + bound.x, y + bound.y, bound.w, bound.h];
  }

  get x() {
    return this._xywhArray[0];
  }

  get y() {
    return this._xywhArray[1];
  }

  get w() {
    return this._xywhArray[2];
  }

  get h() {
    return this._xywhArray[3];
  }

  protected get _xywh() {
    return serializeXYWH(...this._xywhArray);
  }

  hitTest(x: number, y: number, options?: HitTestOptions) {
    return isPointIn(this, x, y);
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.translate(this.anchor[0] - this.x, this.anchor[1] - this.y);

    // render stroke points
    const stroke = getSolidStrokePoints(this.points, this.lineWidth);
    const commands = Utils.getSvgPathFromStrokePoints(stroke);
    const path = new Path2D(commands);

    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke(path);
  }

  serialize(): Record<string, unknown> {
    return {
      id: this.id,
      index: this.index,
      type: this.type,
      color: this.color,
      anchor: this.anchor.join(','),
      points: JSON.stringify(this.points),
    };
  }

  static deserialize(data: Record<string, unknown>): BrushElement {
    const element = new BrushElement(data.id as string);
    element.index = data.index as string;

    element.color = data.color as string;
    element.anchor = (data.anchor as string).split(',').map(s => Number(s)) as [
      number,
      number
    ];
    element.points = JSON.parse(data.points as string);
    return element;
  }

  // FIXME: The first parameter's type should be BrushElement.
  static transform(
    _element: BaseElement,
    bound: IBound
  ): Record<string, unknown> {
    const element = _element as BrushElement;

    const deltaX = bound.x - element.x;
    const deltaY = bound.y - element.y;

    const anchor = [element.anchor[0] + deltaX, element.anchor[1] + deltaY];

    // FIXME: Resize
    // const points = element.points.map(([x, y]) => {
    //   return [bound.w * (x / element.w), bound.h * (y / element.h)];
    // });
    const points = element.points;

    return {
      anchor: anchor.join(','),
      points: JSON.stringify(points),
    };
  }
}
