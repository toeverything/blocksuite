import { assertExists } from '@blocksuite/store';

import type { Bound } from './bound.js';
import { Graph } from './graph.js';
import { almostEqual } from './math-utils.js';
import { PriorityQueue } from './priority-queue.js';
import { type IVec } from './vec.js';

function cost(point: IVec, point2: IVec) {
  return Math.abs(point[0] - point2[0]) + Math.abs(point[1] - point2[1]);
}

function compare(a: [number, number, number], b: [number, number, number]) {
  if (a[2] + 0.01 < b[2]) return -1;
  else if (a[2] - 0.01 > b[2]) return 1;
  else if (a[0] < b[0]) return -1;
  else if (a[0] > b[0]) return 1;
  else if (a[1] > b[1]) return -1;
  else if (a[1] < b[1]) return 1;
  else return 0;
}

function heuristic(a: IVec, b: IVec): number {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}

function getDiagonalCount(a: IVec, last: IVec, last2: IVec): number {
  if (almostEqual(a[0], last[0]) && almostEqual(a[0], last2[0])) return 0;
  if (almostEqual(a[1], last[1]) && almostEqual(a[1], last2[1])) return 0;
  return 1;
}

function pointAlmostEqual(a: IVec, b: IVec): boolean {
  return almostEqual(a[0], b[0], 0.02) && almostEqual(a[1], b[1], 0.02);
}

export class AStarRunner {
  private _cameFrom = new Map<IVec, { from: IVec[]; indexs: number[] }>();
  private _frontier!: PriorityQueue<
    IVec,
    [diagonalCount: number, pointPriority: number, distCost: number]
  >;

  private _graph: Graph;
  private _costSoFar = new Map<IVec, number[]>();
  private _diagonalCount = new Map<IVec, number[]>();
  private _pointPriority = new Map<IVec, number[]>();
  private _current: IVec | null = null;
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
    this._graph = new Graph([...points], blocks, expandBlocks);
    this._init();
  }
  private _init() {
    this._cameFrom.set(this._sp, { from: [this._originalSp], indexs: [-1] });
    this._cameFrom.set(this._originalSp, { from: [], indexs: [] });

    this._costSoFar.set(this._sp, [0]);
    this._diagonalCount.set(this._sp, [0]);
    this._pointPriority.set(this._sp, [0]);
    this._frontier = new PriorityQueue<
      IVec,
      [diagonalCount: number, pointPriority: number, distCost: number]
    >(compare);
    this._frontier.enqueue(this._sp, [0, 0, 0]);
  }

  private _neighbors(cur: IVec) {
    const neighbors = this._graph.neighbors(cur);
    const cameFroms = this._cameFrom.get(cur);
    assertExists(cameFroms);

    cameFroms.from.forEach(from => {
      const index = neighbors.findIndex(n => pointAlmostEqual(n, from));
      if (index >= 0) {
        neighbors.splice(index, 1);
      }
    });
    if (cur === this._ep) neighbors.push(this._originalEp);
    return neighbors;
  }

  public step() {
    if (this._complete) return;
    this._current = this._frontier.dequeue();
    const current = this._current;
    if (!current) {
      this._complete = true;
      return;
    }
    if (current === this._ep && pointAlmostEqual(this._ep, this._originalEp)) {
      this._originalEp = this._ep;
    }
    const neighbors = this._neighbors(current);

    for (let i = 0; i < neighbors.length; i++) {
      const next = neighbors[i];
      const curCosts = this._costSoFar.get(current);
      const curDiagoalCounts = this._diagonalCount.get(current);
      const curPointPrioritys = this._pointPriority.get(current);
      const cameFroms = this._cameFrom.get(current);
      assertExists(curCosts);
      assertExists(curDiagoalCounts);
      assertExists(curPointPrioritys);
      assertExists(cameFroms);
      const newCosts = curCosts.map(co => co + cost(current, next));

      const newDiagonalCounts = curDiagoalCounts.map(
        (count, index) =>
          count + getDiagonalCount(next, current, cameFroms.from[index])
      );
      assertExists(next[2]);
      const newPointPrioritys = curPointPrioritys.map(
        pointPriority => pointPriority + next[2]
      );
      let index = -1;
      if (newCosts.length === 1) {
        index = 0;
      } else {
        const costsIndexs = findAllMinimalIndexs(
          newCosts,
          (a, b) => a + 0.01 < b,
          (a, b) => almostEqual(a, b, 0.02)
        );
        if (costsIndexs.length === 1) {
          index = costsIndexs[0];
        } else {
          const diagonalCounts = costsIndexs.map(i => newDiagonalCounts[i]);
          const diagonalCountsIndexs = findAllMinimalIndexs(
            diagonalCounts,
            (a, b) => a < b,
            (a, b) => a === b
          );
          if (diagonalCountsIndexs.length === 1) {
            index = costsIndexs[diagonalCountsIndexs[0]];
          } else {
            const pointPriorities = diagonalCountsIndexs.map(
              i => newPointPrioritys[costsIndexs[i]]
            );
            const pointPrioritiesIndexs = findAllMaximalIndexs(
              pointPriorities,
              (a, b) => a > b,
              (a, b) => a === b
            );
            index = pointPrioritiesIndexs[0];
          }
        }
      }
      const shouldEnqueue = !this._costSoFar.has(next);
      const nextCosts = this._costSoFar.get(next) ?? [];
      const nextDiagonalCounts = this._diagonalCount.get(next) ?? [];
      const nextPointPriorities = this._pointPriority.get(next) ?? [];
      const nextCameFrom = this._cameFrom.get(next) ?? { from: [], indexs: [] };
      nextCosts.push(newCosts[index]);
      nextDiagonalCounts.push(newDiagonalCounts[index]);
      nextPointPriorities.push(newPointPrioritys[index]);
      nextCameFrom.from.push(current);
      nextCameFrom.indexs.push(index);

      const newDiagonalCount = newDiagonalCounts[index];
      const newPointPriority = newPointPrioritys[index];
      const newCost = newCosts[index];

      this._costSoFar.set(next, nextCosts);
      this._diagonalCount.set(next, nextDiagonalCounts);
      this._pointPriority.set(next, nextPointPriorities);
      this._cameFrom.set(next, nextCameFrom);
      const newPriority: [number, number, number] = [
        newDiagonalCount,
        newPointPriority,
        newCost + heuristic(next, this._ep),
      ];
      if (shouldEnqueue) {
        this._frontier.enqueue(next, newPriority);
      } else {
        const index = this._frontier.heap.findIndex(
          item => item.value === next
        );
        const old = this._frontier.heap[index];
        if (old) {
          if (compare(newPriority, old.priority) < 0) {
            old.priority = newPriority;
            this._frontier.bubbleUp(index);
          }
        } else {
          this._frontier.enqueue(next, newPriority);
        }
      }
      if (
        pointAlmostEqual(current, this._ep) &&
        pointAlmostEqual(next, this._originalEp)
      ) {
        this._originalEp = next;
        this._complete = true;
        return;
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
    const result: IVec[] = [];
    let current: null | IVec = this._complete
      ? this._originalEp
      : this._current;
    const nextIndexs = [0];
    while (current) {
      result.unshift(current);
      const froms = this._cameFrom.get(current);
      assertExists(froms);
      const index = nextIndexs.shift();
      assertExists(index);
      nextIndexs.push(froms.indexs[index]);
      current = froms.from[index];
    }
    return result;
  }
}

function findAllMinimalIndexs(
  data: IVec,
  isLess: (a: number, b: number) => boolean,
  isEqual: (a: number, b: number) => boolean
) {
  let min = Infinity;
  let indexs: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const cur = data[i];
    if (isLess(cur, min)) {
      min = cur;
      indexs = [i];
    } else if (isEqual(cur, min)) {
      indexs.push(i);
    }
  }
  return indexs;
}

function findAllMaximalIndexs(
  data: IVec,
  isGreat: (a: number, b: number) => boolean,
  isEqual: (a: number, b: number) => boolean
) {
  let max = -Infinity;
  let indexs: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const cur = data[i];
    if (isGreat(cur, max)) {
      max = cur;
      indexs = [i];
    } else if (isEqual(cur, max)) {
      indexs.push(i);
    }
  }
  return indexs;
}
