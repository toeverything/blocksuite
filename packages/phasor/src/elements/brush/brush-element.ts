import { getStrokePoints } from '../../perfect-freehand/getStrokePoints.js';
import {
  Bound,
  getBoundFromPoints,
  inflateBound,
  transformPointsToNewBound,
} from '../../utils/bound.js';
import { isPointIn } from '../../utils/hit-utils.js';
import { Utils } from '../../utils/tl-utils.js';
import { BaseElement, type HitTestOptions } from '../base-element.js';
import type { SerializedBrushProps } from './types.js';
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

    if (points?.length) {
      const lineWidth = element.lineWidth;
      const bound = getBoundFromPoints(points);
      const boundWidthLineWidth = inflateBound(bound, lineWidth);
      const relativePoints = points.map(([x, y]) => {
        return [x - boundWidthLineWidth.x, y - boundWidthLineWidth.y];
      });
      updated.points = relativePoints;

      updated.xywh = boundWidthLineWidth.serialize();
    }

    if (xywh) {
      const bound = Bound.deserialize(xywh);
      const { lineWidth } = element;
      const transformed = transformPointsToNewBound(
        element.points.map(([x, y]) => ({ x, y })),
        element,
        lineWidth / 2,
        bound,
        lineWidth / 2
      );

      updated.points = transformed.points.map(p => [p.x, p.y]);
      updated.xywh = transformed.bound.serialize();
    }

    if (props.lineWidth && props.lineWidth !== element.lineWidth) {
      const bound = updated.xywh ? Bound.deserialize(updated.xywh) : element;
      const points = updated.points ?? element.points;
      const transformed = transformPointsToNewBound(
        points.map(([x, y]) => ({ x, y })),
        bound,
        element.lineWidth / 2,
        inflateBound(bound, props.lineWidth - element.lineWidth),
        props.lineWidth / 2
      );

      updated.points = transformed.points.map(p => [p.x, p.y]);
      updated.xywh = transformed.bound.serialize();
    }

    return updated;
  }
}
