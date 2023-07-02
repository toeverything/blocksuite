import type { Bound } from './bound.js';
import { almostEqual, linePolygonIntersects } from './math-utils.js';
import { type IVec } from './vec.js';

export class Graph {
  private _xMap = new Map<number, IVec[]>();
  private _yMap = new Map<number, IVec[]>();
  constructor(
    private points: IVec[],
    private blocks: Bound[] = [],
    private expandedBlocks: Bound[] = [],
    private excludedPoints: IVec[] = []
  ) {
    const xMap = this._xMap;
    const yMap = this._yMap;
    this.points.forEach(point => {
      const [x, y] = point;
      if (!xMap.has(x)) xMap.set(x, []);
      if (!yMap.has(y)) yMap.set(y, []);
      xMap.get(x)?.push(point);
      yMap.get(y)?.push(point);
    });
  }
  private _isBlock(sp: IVec, ep: IVec) {
    return (
      this.blocks.some(block => {
        const rst = linePolygonIntersects(sp, ep, block.points);
        return (
          rst?.length === 2 ||
          block.isPointInBound(sp, 0) ||
          block.isPointInBound(ep, 0) ||
          [
            block.leftLine,
            block.upperLine,
            block.rightLine,
            block.lowerLine,
          ].some(line => {
            return this._isOverlap(line, [sp, ep]);
          })
        );
      }) ||
      this.expandedBlocks.some(block => {
        const result = linePolygonIntersects(sp, ep, block.expand(-0.5).points);
        return result?.length === 2;
      })
    );
  }

  private _isOverlap(line: IVec[], line2: IVec[]) {
    if (
      [line[0][1], line[1][1], line2[0][1], line2[1][1]].every(y =>
        almostEqual(y, line[0][1], 0.02)
      )
    ) {
      if (
        !(
          Math.max(line[0][0], line[1][0]) <
            Math.min(line2[0][0], line2[1][0]) ||
          Math.min(line[0][0], line[1][0]) > Math.max(line2[0][0], line2[1][0])
        )
      ) {
        return true;
      }
    } else if (
      [line[0][0], line[1][0], line2[0][0], line2[1][0]].every(x =>
        almostEqual(x, line[0][0], 0.02)
      )
    ) {
      if (
        !(
          Math.max(line[0][1], line[1][1]) <
            Math.min(line2[0][1], line2[1][1]) ||
          Math.min(line[0][1], line[1][1]) > Math.max(line2[0][1], line2[1][1])
        )
      ) {
        return true;
      }
    }
    return false;
  }

  neighbors(curPoint: IVec): IVec[] {
    const [x, y] = curPoint;
    const neighbors = new Set<IVec>();
    const xPoints = this._xMap.get(x);
    const yPoints = this._yMap.get(y);
    if (xPoints) {
      let plusMin = Infinity;
      let minusMin = Infinity;
      let plusPoint: IVec | undefined;
      let minusPoint: IVec | undefined;
      xPoints.forEach(point => {
        if (this._almostEqual(point, curPoint)) return;
        const dif = point[1] - curPoint[1];
        if (dif > 0 && dif < plusMin) {
          plusMin = dif;
          plusPoint = point;
        }
        if (dif < 0 && Math.abs(dif) < minusMin) {
          minusMin = Math.abs(dif);
          minusPoint = point;
        }
      });
      if (
        plusPoint &&
        (this._canSkipBlock(plusPoint) || !this._isBlock(curPoint, plusPoint))
      ) {
        neighbors.add(plusPoint);
      }
      if (
        minusPoint &&
        (this._canSkipBlock(minusPoint) || !this._isBlock(curPoint, minusPoint))
      )
        neighbors.add(minusPoint);
    }
    if (yPoints) {
      let plusMin = Infinity;
      let minusMin = Infinity;
      let plusPoint: IVec | undefined;
      let minusPoint: IVec | undefined;
      yPoints.forEach(point => {
        if (this._almostEqual(point, curPoint)) return;
        const dif = point[0] - curPoint[0];
        if (dif > 0 && dif < plusMin) {
          plusMin = dif;
          plusPoint = point;
        }
        if (dif < 0 && Math.abs(dif) < minusMin) {
          minusMin = Math.abs(dif);
          minusPoint = point;
        }
      });
      if (
        plusPoint &&
        (this._canSkipBlock(plusPoint) || !this._isBlock(curPoint, plusPoint))
      )
        neighbors.add(plusPoint);
      if (
        minusPoint &&
        (this._canSkipBlock(minusPoint) || !this._isBlock(curPoint, minusPoint))
      )
        neighbors.add(minusPoint);
    }

    return Array.from(neighbors);
  }

  private _almostEqual(point: IVec, point2: IVec) {
    return almostEqual(point[0], point2[0]) && almostEqual(point[1], point2[1]);
  }

  private _canSkipBlock(point: IVec) {
    return this.excludedPoints.some(excludedPoint => {
      return this._almostEqual(point, excludedPoint);
    });
  }

  cost(point: IVec, point2: IVec) {
    return Math.abs(point[0] - point2[0]) + Math.abs(point[1] - point2[1]);
  }
}
