import { getStroke } from '../../perfect-freehand/getStroke.js';
import {
  Bound,
  getBoundFromPoints,
  inflateBound,
  transformPointsToNewBound,
} from '../../utils/bound.js';
import { Utils } from '../../utils/tl-utils.js';
import { SurfaceElement } from '../surface-element.js';
import type { IBrush } from './types.js';

function getSolidStrokePoints(points: number[][], lineWidth: number) {
  return getStroke(points, {
    size: lineWidth,
    thinning: 0.6,
    streamline: 0.5,
    smoothing: 0.5,
    easing: t => Math.sin((t * Math.PI) / 2),
    simulatePressure: false,
  });
}

export class BrushElement extends SurfaceElement<IBrush> {
  /* Brush mouse coords relative to left-top corner */
  get points() {
    const points = this.yMap.get('points') as IBrush['points'];
    return points;
  }

  get color() {
    const color = this.yMap.get('color') as IBrush['color'];
    return color;
  }

  get lineWidth() {
    const lineWidth = this.yMap.get('lineWidth') as IBrush['lineWidth'];
    return lineWidth;
  }

  override render(ctx: CanvasRenderingContext2D) {
    const stroke = getSolidStrokePoints(this.points, this.lineWidth);
    const commands = Utils.getSvgPathFromStroke(stroke);
    const path = new Path2D(commands);

    ctx.fillStyle = this.transformPropertyValue(this.color);
    ctx.fill(path);
  }

  override applyUpdate(props: Partial<IBrush>) {
    const updates: Partial<IBrush> = { ...props };

    const { points, xywh } = props;

    if (points?.length) {
      const lineWidth = this.lineWidth;
      const bound = getBoundFromPoints(points);
      const boundWidthLineWidth = inflateBound(bound, lineWidth);
      const relativePoints = points.map(([x, y]) => {
        return [x - boundWidthLineWidth.x, y - boundWidthLineWidth.y];
      });
      updates.points = relativePoints;

      updates.xywh = boundWidthLineWidth.serialize();
    }

    if (xywh) {
      const bound = Bound.deserialize(xywh);
      const { lineWidth } = this;
      const transformed = transformPointsToNewBound(
        this.points.map(([x, y]) => ({ x, y })),
        this,
        lineWidth / 2,
        bound,
        lineWidth / 2
      );

      updates.points = transformed.points.map(p => [p.x, p.y]);
      updates.xywh = transformed.bound.serialize();
    }

    if (props.lineWidth && props.lineWidth !== this.lineWidth) {
      const bound = updates.xywh ? Bound.deserialize(updates.xywh) : this;
      const points = updates.points ?? this.points;
      const transformed = transformPointsToNewBound(
        points.map(([x, y]) => ({ x, y })),
        bound,
        this.lineWidth / 2,
        inflateBound(bound, props.lineWidth - this.lineWidth),
        props.lineWidth / 2
      );

      updates.points = transformed.points.map(p => [p.x, p.y]);
      updates.xywh = transformed.bound.serialize();
    }

    for (const key in updates) {
      this.yMap.set(key, updates[key as keyof IBrush] as IBrush[keyof IBrush]);
    }
  }
}
