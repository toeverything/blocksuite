import { Bound, Renderable } from '@blocksuite/phasor';

import { Point } from '../../__internal__/utils/rect.js';
import type { Alignable } from '../../__internal__/utils/types.js';
import { type FrameBlockModel } from '../../frame-block/frame-model.js';
import type { EdgelessPageBlockComponent } from './edgeless-page-block.js';

class SnapRender extends Renderable {
  private _alignPoints: [Point, Point][] = [];
  private _alignDistributePoints: [Point, Point][] = [];

  constructor(private _snapManager: EdgelessSnapManager) {
    super();
  }

  update(
    alignPoints: [Point, Point][],
    alignDistributePoints: [Point, Point][]
  ) {
    this._alignPoints = alignPoints;
    this._alignDistributePoints = alignDistributePoints;
  }

  override render(ctx: CanvasRenderingContext2D) {
    if (
      this._alignPoints.length === 0 &&
      this._alignDistributePoints.length === 0
    )
      return;
    const { viewport } = this._snapManager.container.surface;
    const strokeWidth = 1 / viewport.zoom;
    const offset = 5 / viewport.zoom;
    ctx.strokeStyle = '#1672F3';
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    this._alignPoints.forEach(points => {
      let d = '';
      if (points[0].x === points[1].x) {
        const x = points[0].x;
        const minY = Math.min(points[0].y, points[1].y);
        const maxY = Math.max(points[0].y, points[1].y);
        d = `M${x},${minY - offset}L${x},${maxY}`;
      } else {
        const y = points[0].y;
        const minX = Math.min(points[0].x, points[1].x);
        const maxX = Math.max(points[0].x, points[1].x);
        d = `M${minX - offset},${y}L${maxX + offset},${y}`;
      }
      ctx.stroke(new Path2D(d));
    });
    this._alignDistributePoints.forEach(points => {
      const bar = 10 / viewport.zoom;
      let d = '';
      if (points[0].x === points[1].x) {
        const x = points[0].x;
        const minY = Math.min(points[0].y, points[1].y) + offset;
        const maxY = Math.max(points[0].y, points[1].y) - offset;
        d = `M${x},${minY}L${x},${maxY}
        M${x - bar},${minY}L${x + bar},${minY}
        M${x - bar},${maxY}L${x + bar},${maxY} `;
      } else {
        const y = points[0].y;
        const minX = Math.min(points[0].x, points[1].x) + offset;
        const maxX = Math.max(points[0].x, points[1].x) - offset;
        d = `M${minX},${y}L${maxX},${y}
        M${minX},${y - bar}L${minX},${y + bar}
        M${maxX},${y - bar}L${maxX},${y + bar}`;
      }
      ctx.stroke(new Path2D(d));
    });
  }
}

export class EdgelessSnapManager {
  constructor(public container: EdgelessPageBlockComponent) {}

  private _alignBounds: Bound[] = [];
  private _alignPoints: [Point, Point][] = [];
  private _alignDistributePoints: [Point, Point][] = [];
  private _threshold = 5;
  private _snapRender = new SnapRender(this);

  public prepareAlign(elements: Alignable[]): Bound {
    if (elements.length === 0) return new Bound();
    const { page, surface } = this.container;
    const { viewport } = surface;
    const viewportBounds = Bound.from(viewport.viewportBounds);
    viewport.addRenderable(this._snapRender);

    const frames = page.getBlockByFlavour('affine:frame') as FrameBlockModel[];
    const phasorElements = surface.getElements();

    this._alignBounds = [];
    (<Alignable[]>[...frames, ...phasorElements]).forEach(alignable => {
      const bound = Bound.deserialize(alignable.xywh);
      if (
        viewportBounds.isIntersectWithBound(bound) &&
        !elements.includes(alignable)
      ) {
        this._alignBounds.push(bound);
      }
    });

    return elements.reduce((prev, element) => {
      return prev.unite(Bound.deserialize(element.xywh));
    }, Bound.deserialize(elements[0].xywh));
  }

  public align(bound: Bound): { dx: number; dy: number } {
    const rst = { dx: 0, dy: 0 };
    const { _threshold: threshold } = this;
    const { surface } = this.container;
    const { viewport } = surface;

    this._alignPoints = [];
    for (const other of this._alignBounds) {
      // Calculate center-to-center and center-to-side distances
      const centerXDistance = other.center[0] - bound.center[0];
      const centerYDistance = other.center[1] - bound.center[1];

      const leftDistance = other.minX - bound.center[0];
      const rightDistance = other.maxX - bound.center[0];
      const topDistance = other.minY - bound.center[1];
      const bottomDistance = other.maxY - bound.center[1];

      // Calculate side-to-side distances
      const leftToLeft = other.minX - bound.minX;
      const leftToRight = other.maxX - bound.minX;
      const rightToLeft = other.minX - bound.maxX;
      const rightToRight = other.maxX - bound.maxX;

      const topToTop = other.minY - bound.minY;
      const topToBottom = other.maxY - bound.minY;
      const bottomToTop = other.minY - bound.maxY;
      const bottomToBottom = other.maxY - bound.maxY;

      const xDistances = [
        centerXDistance,
        leftDistance,
        rightDistance,
        leftToLeft,
        leftToRight,
        rightToLeft,
        rightToRight,
      ];

      const yDistances = [
        centerYDistance,
        topDistance,
        bottomDistance,
        topToTop,
        topToBottom,
        bottomToTop,
        bottomToBottom,
      ];
      let closestX = Number.MAX_VALUE;
      let closestY = Number.MAX_VALUE;
      const xDistancesAbs = xDistances.map(Math.abs);
      const yDistancesAbs = yDistances.map(Math.abs);
      closestX = Math.min(...xDistancesAbs);
      closestY = Math.min(...yDistancesAbs);

      if (closestX < threshold) {
        const index = xDistancesAbs.indexOf(closestX);
        rst.dx = xDistances[index];
        const alignPointX = [
          other.center[0],
          other.minX,
          other.maxX,
          bound.minX + rst.dx,
          bound.minX + rst.dx,
          bound.maxX + rst.dx,
          bound.maxX + rst.dx,
        ][index];
        this._alignPoints[0] = [
          new Point(alignPointX, bound.center[1]),
          new Point(alignPointX, other.center[1]),
        ];
      }

      if (closestY < threshold) {
        const index = yDistancesAbs.indexOf(closestY);
        rst.dy = yDistances[index];
        const alignPointY = [
          other.center[1],
          other.minY,
          other.maxY,
          bound.minY + rst.dy,
          bound.minY + rst.dy,
          bound.maxY + rst.dy,
          bound.maxY + rst.dy,
        ][index];
        this._alignPoints[1] = [
          new Point(bound.center[0], alignPointY),
          new Point(other.center[0], alignPointY),
        ];
      }
    }

    // distribute align
    this._alignDistributePoints = [];
    if (rst.dx === 0) {
      const wBoxes: Bound[] = [];
      this._alignBounds.forEach(box => {
        if (box.isHorizontalCross(bound)) {
          wBoxes.push(box);
        }
      });
      let dif = Infinity;
      let min = Infinity;
      for (let i = 0; i < wBoxes.length; i++) {
        for (let j = i + 1; j < wBoxes.length; j++) {
          let lb = wBoxes[i],
            rb = wBoxes[j];
          if (!lb.isHorizontalCross(rb)) continue;
          if (lb.isIntersectWithBound(rb)) continue;
          if (rb.maxX < lb.minX) {
            const temp = rb;
            rb = lb;
            lb = temp;
          }
          /** align middle */
          let _centerX = 0;
          const updateDif = () => {
            dif = Math.abs(bound.center[0] - _centerX);
            if (dif <= threshold && dif < min) {
              min = dif;
              rst.dx = _centerX - bound.center[0];
              /**
               * calculate points to draw
               */
              const ys = [lb.minY, lb.maxY, rb.minY, rb.maxY].sort(
                (a, b) => a - b
              );
              const y = (ys[1] + ys[2]) / 2;
              const offset = 2 / viewport.zoom;
              const xs = [
                _centerX - bound.w / 2 - offset,
                _centerX + bound.w / 2 + offset,
                rb.minX,
                rb.maxX,
                lb.minX,
                lb.maxX,
              ].sort((a, b) => a - b);
              this._alignDistributePoints[0] = [
                new Point(xs[1], y),
                new Point(xs[2], y),
              ];
              this._alignDistributePoints[1] = [
                new Point(xs[3], y),
                new Point(xs[4], y),
              ];
            }
          };
          if (lb.horizontalDistance(rb) > bound.w) {
            _centerX = (lb.maxX + rb.minX) / 2;
            updateDif();
          }
          /** align left */
          _centerX = lb.minX - (rb.minX - lb.maxX) - bound.w / 2;
          updateDif();
          /** align right */
          _centerX = rb.minX - lb.maxX + rb.maxX + bound.w / 2;
          updateDif();
        }
      }
    }
    if (rst.dy === 0) {
      const hBoxes: Bound[] = [];
      this._alignBounds.forEach(box => {
        if (box.isVerticalCross(bound)) {
          hBoxes.push(box);
        }
      });
      let dif = Infinity;
      let min = Infinity;
      for (let i = 0; i < hBoxes.length; i++) {
        for (let j = i + 1; j < hBoxes.length; j++) {
          let ub = hBoxes[i],
            db = hBoxes[j];
          if (!ub.isVerticalCross(db)) continue;
          if (ub.isIntersectWithBound(db)) continue;
          if (db.maxY < ub.minX) {
            const temp = ub;
            ub = db;
            db = temp;
          }
          /** align middle */
          let _centerY = 0;
          const updateDif = () => {
            dif = Math.abs(bound.center[1] - _centerY);
            if (dif <= threshold && dif < min) {
              min = dif;
              rst.dy = _centerY - bound.center[1];
              /**
               * calculate points to draw
               */
              const xs = [ub.minX, ub.maxX, db.minX, db.maxX].sort(
                (a, b) => a - b
              );
              const x = (xs[1] + xs[2]) / 2;
              const offset = 2 / viewport.zoom;
              const ys = [
                _centerY - bound.h / 2 - offset,
                _centerY + bound.h / 2 + offset,
                db.minY,
                db.maxY,
                ub.minY,
                ub.maxY,
              ].sort((a, b) => a - b);
              this._alignDistributePoints[3] = [
                new Point(x, ys[1]),
                new Point(x, ys[2]),
              ];
              this._alignDistributePoints[4] = [
                new Point(x, ys[3]),
                new Point(x, ys[4]),
              ];
            }
          };
          if (ub.verticalDistance(db) > bound.h) {
            _centerY = (ub.maxY + db.minY) / 2;
            updateDif();
          }
          /** align upper */
          _centerY = ub.minY - (db.minY - ub.maxY) - bound.h / 2;
          updateDif();
          /** align lower */
          _centerY = db.minY - ub.maxY + db.maxY + bound.h / 2;
          updateDif();
        }
      }
    }
    this._draw();
    return rst;
  }

  public reset() {
    const { viewport } = this.container.surface;
    this._alignBounds = [];
    this._alignPoints = [];
    this._alignDistributePoints = [];
    viewport.removeRenderable(this._snapRender);
  }

  private _draw() {
    const { surface } = this.container;
    this._snapRender.update(this._alignPoints, this._alignDistributePoints);
    surface.refresh();
  }
}
