import { assertExists } from '@blocksuite/store';

import { getArrowPoints } from '../index.js';
import { Overlay } from '../renderer.js';
import type { Bound } from './bound.js';
import { Graph } from './graph.js';
import { almostEqual } from './math-utils.js';
import { PriorityQueue } from './priority-queue.js';
import { type IVec, Vec } from './vec.js';
class AStarOverlay extends Overlay {
  reached: IVec[] = [];
  frontier: IVec[] = [];
  edges: IVec[][] = [];
  next: IVec | undefined = [];
  override render(ctx: CanvasRenderingContext2D): void {
    this.reached.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p[0], p[1], 6, 0, Math.PI * 2);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'red';
      ctx.stroke();
    });
    this.edges.forEach(edge => {
      const sp = edge[0];
      const ep = edge[1];
      ctx.beginPath();
      ctx.moveTo(sp[0], sp[1]);
      ctx.lineTo(ep[0], ep[1]);

      const { sides } = getArrowPoints(sp, ep, 10);

      ctx.moveTo(sides[0][0], sides[0][1]);
      ctx.lineTo(ep[0], ep[1]);
      ctx.lineTo(sides[1][0], sides[1][1]);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'red';
      ctx.stroke();
    });
    if (this.next) {
      ctx.beginPath();
      ctx.arc(this.next[0], this.next[1], 6, 0, Math.PI * 2);
      ctx.lineWidth = 1;
      ctx.fillStyle = 'red';
      ctx.fill();
    }

    this.frontier.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p[0], p[1], 6, 0, Math.PI * 2);
      ctx.lineWidth = 1;
      ctx.font = '4px';
      (ctx.fillStyle = 'brown'), ctx.fillText(p[3].toFixed(0), p[0], p[1]);
      (ctx.fillStyle = 'blue'), ctx.fillText(p[4].toFixed(0), p[0], p[1] + 8);
      (ctx.fillStyle = 'green'), ctx.fillText(p[5].toFixed(2), p[0], p[1] + 16);
      ctx.stroke();
    });
  }
}
const overlay = new AStarOverlay();

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
  //for debug
  private _reached: IVec[] = [];
  private _edges: IVec[][] = [];
  overlay = overlay;
  constructor(
    points: IVec[],
    private _sp: IVec,
    private _ep: IVec,
    private _originalSp: IVec,
    private _originalEp: IVec,
    blocks: Bound[] = [],
    expandBlocks: Bound[] = []
  ) {
    if (this._sp === this._ep) this._ep = [...this._sp];
    if (this._ep === this._originalEp) this._originalEp = [...this._ep];
    if (this._sp === this._originalSp) this._originalSp = [...this._sp];
    this._sp[2] = 0;
    this._ep[2] = 0;
    this._originalEp[2] = 0;
    this._graph = new Graph([...points], blocks, expandBlocks);
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

  public step() {
    if (this._complete) return;
    this._current = this._frontier.dequeue();
    const current = this._current;
    if (!current) {
      this._complete = true;
      return;
    }
    if (Vec.isEqual(current, this._ep)) {
      this._complete = true;
      // console.log('diag count', diagonalCount.get(current))
      // console.log('point priority', pointPriority.get(current))
      return;
    }
    const neighbors = this._graph.neighbors(current);
    const index = neighbors.findIndex(n =>
      Vec.isEqual(n, this._cameFrom.get(current) ?? [])
    );
    if (index !== -1) {
      neighbors.splice(index, 1);
    }

    for (let i = 0; i < neighbors.length; i++) {
      const next = neighbors[i];
      if (
        Vec.isEqual(current, this._ep) &&
        !Vec.isEqual(next, this._originalEp)
      )
        continue;
      const newCost =
        this._costSoFar.get(current)! + this._graph.cost(current, next);
      let newDiagonalCount =
        this._diagonalCount.get(current)! +
        this._getDiagonalCount(next, current);
      if (current !== this._sp) {
        newDiagonalCount -= this._getDiagonalCount(this._originalEp, current);
      }
      newDiagonalCount += this._getDiagonalCount(
        this._originalEp,
        next,
        current
      );

      // if (Vec.isEqual(next, this._ep)) {

      //   newDiagonalCount += this._getDiagonalCount(
      //     this._originalEp,
      //     this._ep,
      //     current
      //   );
      // }
      assertExists(next[2]);
      const newPointPriority = this._pointPriority.get(current)! + next[2];
      let canUpdate = false;

      const lastCost = this._costSoFar.get(next);
      const lastDiagonalCount = this._diagonalCount.get(next);
      const lastPointPriority = this._pointPriority.get(next);
      if (!lastCost || newCost - lastCost! < -0.01) {
        canUpdate = true;
      } else if (almostEqual(newCost, lastCost)) {
        if (newDiagonalCount < lastDiagonalCount!) {
          canUpdate = true;
        } else if (newDiagonalCount === lastDiagonalCount) {
          if (newPointPriority > lastPointPriority!) {
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

    // for debug
    this._reached.push(current);
    overlay.reached = this._reached;
    overlay.frontier = this._frontier.heap.map(item => {
      return [
        ...item.value,
        item.priority[0],
        item.priority[1],
        item.priority[2],
      ];
    });
    this._edges = [];
    overlay.next = this._frontier.heap[0]?.value;
    this._frontier.heap.forEach(item => {
      let current = item.value;
      while (current) {
        const from = this._cameFrom.get(current);
        if (from) {
          this._edges.push([from, current]);
        }
        current = from as IVec;
      }
    });
    overlay.edges = this._edges;
  }

  public reset() {
    this._reached = [];
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
