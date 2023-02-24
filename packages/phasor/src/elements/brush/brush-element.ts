import { getStrokePoints } from 'perfect-freehand';

import type { IBound } from '../../consts.js';
import { Utils } from '../../utils/tl-utils.js';
import { Vec } from '../../utils/vec.js';
import { deserializeXYWH, serializeXYWH } from '../../utils/xywh.js';
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

export function getBrushBoundFromPoints(
  points: number[][],
  lineWidth: number
): IBound {
  const { minX, minY, width, height } = Utils.getBoundsFromPoints(points);
  return {
    x: minX,
    y: minY,
    w: width < lineWidth ? lineWidth : width + lineWidth,
    h: height < lineWidth ? lineWidth : height + lineWidth,
  };
}

export class BrushElement extends BaseElement {
  type = 'brush' as const;
  color = '#000000';
  points: number[][] = [];
  lineWidth = 4;

  get tiny() {
    return this.w <= this.lineWidth && this.h <= this.lineWidth;
  }

  hitTest(x: number, y: number, options?: HitTestOptions) {
    const point = Vec.sub([x, y], [this.x, this.y]);

    if (this.tiny) {
      return Utils.pointInCircle(point, [0, 0], this.lineWidth / 2);
    }
    return Utils.pointInPolyline(point, this.points, this.lineWidth);
  }

  /**
   * FIXME: perfect-freehand generating stroke points has some base cases.
   * You can rename this function to `render` to see the difference.
   */
  _broken_render(ctx: CanvasRenderingContext2D): void {
    ctx.translate(this.lineWidth / 2, this.lineWidth / 2);

    // render origin points
    const originPath2d = new Path2D();
    for (const point of this.points) {
      originPath2d.ellipse(point[0], point[1] - 20, 1, 1, 0, 0, 2 * Math.PI);
    }
    ctx.strokeStyle = 'green';
    ctx.stroke(originPath2d);

    // render stroke points
    const stroke = getSolidStrokePoints(this.points, this.lineWidth);
    const strokePath2d = new Path2D();
    for (const point of stroke) {
      strokePath2d.ellipse(
        point.point[0],
        point.point[1] - 10,
        1,
        1,
        0,
        0,
        2 * Math.PI
      );
    }
    ctx.strokeStyle = 'red';
    ctx.stroke(strokePath2d);

    const svgPath = Utils.getSvgPathFromStrokePoints(stroke);
    const path2d = new Path2D(svgPath);

    ctx.strokeStyle = this.color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke(path2d);
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.translate(this.lineWidth / 2, this.lineWidth / 2);

    if (this.tiny) {
      const path2d = new Path2D();
      path2d.ellipse(
        0,
        0,
        this.lineWidth / 2,
        this.lineWidth / 2,
        0,
        0,
        2 * Math.PI
      );

      ctx.fillStyle = this.color;
      ctx.fill(path2d);
      return;
    }

    const path2d = new Path2D();
    path2d.moveTo(this.points[0][0], this.points[0][1]);
    for (const point of this.points) {
      path2d.lineTo(point[0], point[1]);
    }

    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke(path2d);
  }

  serialize(): Record<string, unknown> {
    return {
      id: this.id,
      index: this.index,
      type: this.type,
      xywh: serializeXYWH(this.x, this.y, this.w, this.h),
      color: this.color,
      points: JSON.stringify(this.points),
    };
  }

  static deserialize(data: Record<string, unknown>): BrushElement {
    const element = new BrushElement(data.id as string);
    element.index = data.index as string;

    const [x, y, w, h] = deserializeXYWH(data.xywh as string);
    element.setBound(x, y, w, h);
    element.color = data.color as string;
    element.points = JSON.parse(data.points as string);
    return element;
  }
}
