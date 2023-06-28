import type { Bound } from './bound.js';
import { linePolygonIntersects } from './math-utils.js';
import { type IVec, Vec } from './vec.js';

export class Graph {
  private _xMap = new Map<number, IVec[]>();
  private _yMap = new Map<number, IVec[]>();
  constructor(
    private points: IVec[],
    private blocks: Bound[] = [],
    private expandBlocks: Bound[] = []
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
      this.expandBlocks.some(block => {
        const rst = linePolygonIntersects(sp, ep, block.points);
        return block.isPointInBound(Vec.lrp(sp, ep, 0.5)) || rst?.length === 2;
      }) ||
      this.blocks.some(block => {
        return !!linePolygonIntersects(sp, ep, block.points);
      })
    );
  }

  neighbors(curPoint: IVec): IVec[] {
    const [x, y] = curPoint;
    const neighbors = new Set<IVec>();
    const xPoints = this._xMap.get(x);
    const yPoints = this._yMap.get(y);
    const xOffset = [0, 5];
    const yOffset = [5, 0];
    if (xPoints) {
      let plusMin = Infinity;
      let minusMin = Infinity;
      let plusPoint: IVec | undefined;
      let minusPoint: IVec | undefined;
      xPoints.forEach(point => {
        if (Vec.isEqual(point, curPoint)) return;
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
        !this._isBlock(Vec.sub(curPoint, xOffset), Vec.add(plusPoint, xOffset))
      ) {
        neighbors.add(plusPoint);
      }
      if (
        minusPoint &&
        !this._isBlock(Vec.add(curPoint, xOffset), Vec.sub(minusPoint, xOffset))
      )
        neighbors.add(minusPoint);
    }
    if (yPoints) {
      let plusMin = Infinity;
      let minusMin = Infinity;
      let plusPoint: IVec | undefined;
      let minusPoint: IVec | undefined;
      yPoints.forEach(point => {
        if (Vec.isEqual(point, curPoint)) return;
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
        !this._isBlock(Vec.sub(curPoint, yOffset), Vec.add(plusPoint, yOffset))
      )
        neighbors.add(plusPoint);
      if (
        minusPoint &&
        !this._isBlock(Vec.add(curPoint, yOffset), Vec.sub(minusPoint, yOffset))
      )
        neighbors.add(minusPoint);
    }

    return Array.from(neighbors);
  }

  cost(point: IVec, point2: IVec) {
    return Math.abs(point[0] - point2[0]) + Math.abs(point[1] - point2[1]);
  }
}
