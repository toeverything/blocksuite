import { getStroke } from '../../perfect-freehand/getStroke.js';
import {
  Bound,
  getBoundFromPoints,
  inflateBound,
  transformPointsToNewBound,
} from '../../utils/bound.js';
import {
  getSvgPathFromStroke,
  lineIntersects,
} from '../../utils/math-utils.js';
import { type IVec, Vec } from '../../utils/vec.js';
import { type HitTestOptions, SurfaceElement } from '../surface-element.js';
import type { IBrush } from './types.js';

function getSolidStrokePoints(points: number[][], lineWidth: number) {
  return getStroke(points, {
    size: lineWidth,
    thinning: 0.6,
    streamline: 0.5,
    smoothing: 0.5,
    easing: t => Math.sin((t * Math.PI) / 2),
    simulatePressure: true,
  });
}

export class BrushElement extends SurfaceElement<IBrush> {
  private _testCanvas = document.createElement('canvas');
  private _testCtx = this._testCanvas.getContext(
    '2d'
  ) as CanvasRenderingContext2D;

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

  intersectWithLine(pa: IVec, pb: IVec) {
    const { points } = this;

    const box = Bound.deserialize(this.xywh);
    const tl = box.tl;

    if (box.w < 8 && box.h < 8) {
      return Vec.distanceToLineSegment(pa, pb, box.center) < 5;
    }

    if (box.intersectLine(pa, pb, true)) {
      for (let i = 1; i < points.length; i++) {
        if (
          lineIntersects(
            Vec.add(points[i - 1], tl),
            Vec.add(points[i], tl),
            pa,
            pb
          )
        ) {
          return true;
        }
      }
    }
    return false;
  }

  override hitTest(x: number, y: number, options?: HitTestOptions): boolean {
    const insideBoundingBox = super.hitTest(x, y, options);

    if (!insideBoundingBox) return false;

    const command = getSvgPathFromStroke(getSolidStrokePoints(this.points, 3));
    const path = new Path2D(command);

    if (this._testCtx.lineWidth !== (options?.expand ?? 1)) {
      this._testCtx.lineWidth = options?.expand ?? 1;
    }

    return this._testCtx.isPointInStroke(path, x - this.x, y - this.y);
  }

  override render(ctx: CanvasRenderingContext2D, matrix: DOMMatrix) {
    const {
      points,
      lineWidth,
      color,
      rotate,
      widthAndHeight: [w, h],
    } = this;
    const cx = w / 2;
    const cy = h / 2;

    ctx.setTransform(
      matrix.translateSelf(cx, cy).rotateSelf(rotate).translateSelf(-cx, -cy)
    );

    const stroke = getSolidStrokePoints(points, lineWidth);
    const commands = getSvgPathFromStroke(stroke);
    const path = new Path2D(commands);

    ctx.fillStyle = this.computedValue(color);
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
