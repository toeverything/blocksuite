import { ICompareable } from './heap.js';
import { createKey } from './util.js';

export class Point extends ICompareable {
  /** G stands for the cost from start to current point */
  G: number;
  /** H stands for the cost from current point to end point */
  H: number;
  parent: Point | null;
  xy: number[];
  key: string;

  constructor(xy: number[], G = 0, parent: Point | null = null) {
    super();

    this.G = G;
    this.H = 0;
    this.parent = parent;
    this.xy = xy;
    this.key = createKey(xy);
  }

  /** F stands for the sum of G and H */
  get F() {
    return this.G + this.H;
  }

  setParent(parent: Point) {
    this.parent = parent;
  }

  compare(other: Point) {
    return this.F - other.F;
  }
}
