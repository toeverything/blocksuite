import { assertExists } from '@blocksuite/store';

import type { Bound } from './bound.js';
import { Graph } from './graph.js';
import { almostEqual } from './math-utils.js';
import { PriorityQueue } from './priority-queue.js';
import { type IVec } from './vec.js';

export class AStarAlgorithm {
  private _cameFrom = new Map<IVec, IVec | null>();
  private _frontier!: PriorityQueue<
    IVec,
    [diagonalCount: number, pointPriority: number, distCost: number]
  >;

  private _graph: Graph;
  private _costSoFar = new Map<IVec, number>();
  private _diagonalCount = new Map<IVec, number>();
  private _pointPriority = new Map<IVec, number>();
  private _current: IVec | undefined;
  private _complete = false;

  constructor(
    points: IVec[],
    private _sp: IVec,
    private _ep: IVec,
    private _originalSp: IVec,
    private _originalEp: IVec,
    blocks: Bound[] = [],
    expandBlocks: Bound[] = []
  ) {
    this._sp[2] = 0;
    this._ep[2] = 0;
    this._originalEp[2] = 0;
    this._graph = new Graph([...points], blocks);
    this._init();
  }
  private _init() {
    this._cameFrom.set(this._sp, this._originalSp);
    this._cameFrom.set(this._originalSp, null);
    this._cameFrom.set(this._originalEp, this._ep);

    this._costSoFar.set(this._sp, 0);
    this._diagonalCount.set(this._sp, 0);
    this._pointPriority.set(this._sp, 0);
    this._frontier = new PriorityQueue<
      IVec,
      [diagonalCount: number, pointPriority: number, distCost: number]
    >((a, b) => {
      if (a[2] + 0.01 < b[2]) return -1;
      else if (a[2] - 0.01 > b[2]) return 1;
      else if (a[0] < b[0]) return -1;
      else if (a[0] > b[0]) return 1;
      else if (a[1] > b[1]) return -1;
      else if (a[1] < b[1]) return 1;
      else return 0;
    });
    this._frontier.enqueue(this._sp, [0, 0, 0]);
  }

  private _heuristic(a: IVec, b: IVec): number {
    return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
  }

  private _getDiagonalCount(a: IVec, last?: IVec, last2?: IVec): number {
    last = last ?? this._cameFrom.get(a) ?? undefined;
    if (!last) return 0;
    last2 = last2 ?? this._cameFrom.get(last) ?? undefined;
    if (!last2) return 0;
    if (almostEqual(a[0], last[0]) && almostEqual(a[0], last2[0])) return 0;
    if (almostEqual(a[1], last[1]) && almostEqual(a[1], last2[1])) return 0;
    return 1;
  }

  private _almostEqual(a: IVec, b: IVec): boolean {
    return almostEqual(a[0], b[0]) && almostEqual(a[1], b[1]);
  }

  public step() {
    if (this._complete) return;
    this._current = this._frontier.dequeue();
    const current = this._current;
    if (!current) {
      this._complete = true;
      return;
    }
    if (this._almostEqual(current, this._ep)) {
      this._complete = true;
      return;
    }
    const neighbors = this._graph.neighbors(current);
    const index = neighbors.findIndex(n =>
      this._almostEqual(n, this._cameFrom.get(current) ?? [])
    );
    if (index !== -1) {
      neighbors.splice(index, 1);
    }

    for (let i = 0; i < neighbors.length; i++) {
      const next = neighbors[i];
      if (
        this._almostEqual(current, this._ep) &&
        !this._almostEqual(next, this._originalEp)
      )
        continue;
      const curCost = this._costSoFar.get(current);
      const curDiagoalCount = this._diagonalCount.get(current);
      const curPointPriority = this._pointPriority.get(current);

      assertExists(curCost);
      const newCost = curCost + this._graph.cost(current, next);

      assertExists(curDiagoalCount);
      let newDiagonalCount =
        curDiagoalCount +
        this._getDiagonalCount(next, current) +
        this._getDiagonalCount(this._originalEp, next, current);

      if (current !== this._sp) {
        newDiagonalCount -= this._getDiagonalCount(this._originalEp, current);
      }

      assertExists(next[2]);
      assertExists(curPointPriority);
      const newPointPriority = curPointPriority + next[2];
      let canUpdate = false;

      const lastCost = this._costSoFar.get(next);
      const lastDiagonalCount = this._diagonalCount.get(next);
      const lastPointPriority = this._pointPriority.get(next);
      if (!lastCost || newCost - lastCost < -0.01) {
        canUpdate = true;
      } else if (almostEqual(newCost, lastCost)) {
        assertExists(lastPointPriority);
        assertExists(lastDiagonalCount);
        const compensation = (newDiagonalCount - lastDiagonalCount) * 3;
        if (newPointPriority >= lastPointPriority + compensation) {
          canUpdate = true;
        } else if (newPointPriority === lastPointPriority + compensation) {
          if (newDiagonalCount < lastDiagonalCount) {
            canUpdate = true;
          }
        }
      }

      if (canUpdate) {
        this._costSoFar.set(next, newCost);
        this._diagonalCount.set(next, newDiagonalCount);
        this._pointPriority.set(next, newPointPriority);
        const priority: [number, number, number] = [
          newDiagonalCount,
          newPointPriority,
          newCost + this._heuristic(next, this._ep),
        ];
        this._frontier.enqueue(next, priority);
        this._cameFrom.set(next, current);
      }
    }
  }

  public reset() {
    this._cameFrom.clear();
    this._costSoFar.clear();
    this._diagonalCount.clear();
    this._pointPriority.clear();
    this._complete = false;
    this._init();
  }

  public run() {
    while (!this._complete) {
      this.step();
    }
  }

  get path() {
    const rst: IVec[] = [];
    let current: null | undefined | IVec = this._complete
      ? this._originalEp
      : this._current;
    while (current) {
      rst.unshift(current);
      current = this._cameFrom.get(current);
    }
    return rst;
  }
}
