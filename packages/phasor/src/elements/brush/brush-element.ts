import type { IBound } from '../../consts.js';
import { getStrokePoints } from '../../perfect-freehand/getStrokePoints.js';
import { Bound, getBoundFromPoints } from '../../utils/bound.js';
import { isPointIn } from '../../utils/hit-utils.js';
import { simplePick } from '../../utils/std.js';
import { Utils } from '../../utils/tl-utils.js';
import { deserializeXYWH, serializeXYWH, setXYWH } from '../../utils/xywh.js';
import { BaseElement, type HitTestOptions } from '../base-element.js';
import type { BrushProps, SerializedBrushProps } from './types.js';
import { validateBrushProps } from './utils.js';

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
    x: minX - lineWidth / 2,
    y: minY - lineWidth / 2,
    w: width < lineWidth ? lineWidth : width + lineWidth,
    h: height < lineWidth ? lineWidth : height + lineWidth,
  };
}

export class BrushElement extends BaseElement {
  type = 'brush' as const;
  color = '#000000';
  override x = 0;
  override y = 0;
  override w = 0;
  override h = 0;

  /* Brush mouse coords relative to left-top corner */
  points: number[][] = [];
  lineWidth = 4;

  hitTest(x: number, y: number, options?: HitTestOptions) {
    return isPointIn(this, x, y);
  }

  render(ctx: CanvasRenderingContext2D) {
    const stroke = getSolidStrokePoints(this.points, this.lineWidth);
    const commands = Utils.getSvgPathFromStrokePoints(stroke);
    const path = new Path2D(commands);

    ctx.strokeStyle = this.transformPropertyValue(this.color);
    ctx.lineWidth = this.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke(path);
  }

  serialize(): SerializedBrushProps {
    return {
      id: this.id,
      index: this.index,
      type: this.type,
      xywh: this._xywh,

      color: this.color,
      lineWidth: this.lineWidth,
      points: this.points,
    };
  }

  static deserialize(data: Record<string, unknown>): BrushElement {
    if (!validateBrushProps(data)) {
      throw new Error('Invalid brush props.');
    }
    const element = new BrushElement(data.id as string);
    BrushElement.applySerializedProps(element, data);
    return element;
  }

  static override applySerializedProps(
    element: BrushElement,
    props: Partial<SerializedBrushProps>
  ) {
    super.applySerializedProps(element, props);
  }

  static override getUpdatedSerializedProps(
    element: BrushElement,
    props: Partial<SerializedBrushProps>
  ) {
    const updated = { ...props };

    const { points, xywh } = props;
    const lineWidth = props.lineWidth ?? element.lineWidth;
    if (points?.length) {
      const bound = getBoundFromPoints(points);
      bound.x = bound.x - lineWidth / 2;
      bound.y = bound.y - lineWidth / 2;
      bound.w = bound.w + lineWidth;
      bound.h = bound.h + lineWidth;
      const relativePoints = points.map(([x, y]) => {
        return [x - bound.x, y - bound.y];
      });
      updated.points = relativePoints;
      updated.xywh = bound.serialize();
    }

    if (xywh) {
      const bound = Bound.deserialize(xywh);
      const { lineWidth } = element as BrushElement;
      const elementH = Math.max(element.h - lineWidth, 1);
      const elementW = Math.max(element.w - lineWidth, 1);
      const boundH = Math.max(bound.h - lineWidth, 1);
      const boundW = Math.max(bound.w - lineWidth, 1);
      const points = (element as BrushElement).points.map(([x, y]) => {
        return [boundW * (x / elementW), boundH * (y / elementH)];
      });
      updated.xywh = serializeXYWH(
        bound.x,
        bound.y,
        boundW + lineWidth,
        boundH + lineWidth
      );
      updated.points = points;
    }

    return updated;
  }
}
