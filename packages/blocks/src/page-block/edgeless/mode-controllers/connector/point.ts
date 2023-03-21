import { ICompareable } from './heap.js';
import { Key } from './util.js';

export class Point extends ICompareable {
  public G: number;
  public H: number;
  public parent: Point | null;
  public xy: number[];
  public key: string;
  public F: number;

  constructor(xy: number[], G = 0, parent: Point | null = null) {
    super();

    this.G = G;
    this.H = 0;
    this.parent = parent;
    this.xy = xy;
    this.key = Key(xy);
    this.F = G;
  }

  setParent(parent: Point) {
    this.parent = parent;
  }

  setG(G: number) {
    this.G = G;
    this.F = this.H + this.G;
  }

  setH(H: number) {
    this.H = H;
    this.F = this.H + this.G;
  }

  compare(other: Point) {
    return this.F - other.F;
  }
}
