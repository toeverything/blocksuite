import type { Point } from './util.js';

export interface GraphNode {
  x: number;
  y: number;
  parent: GraphNode | null;
  cost(fromElement: GraphNode): number;

  f: number;
  h: number;
  g: number;
  closed?: boolean;
  visited?: boolean;
}

export class Graph {
  nodes: Record<string, GraphNode> = {};
  edges: Record<string, Set<string>> = {};
  connections: Array<GraphNode[]> = [];

  constructor(points: Point[]) {
    this._init(points);
  }

  private _init(points: Point[]) {
    const xs = new Set<number>();
    const ys = new Set<number>();

    points.forEach(p => {
      const node = {
        x: p.x,
        y: p.y,
        parent: null,
        cost: (fromElement: GraphNode) => {
          const basic =
            Math.abs(p.x - fromElement.x) + Math.abs(p.y - fromElement.y);
          // direction changed
          let turn = false;
          if (fromElement.parent) {
            if (
              (fromElement.x === fromElement.parent.x &&
                fromElement.x !== p.x) ||
              (fromElement.y === fromElement.parent.y && fromElement.y !== p.y)
            ) {
              turn = true;
            }
          }
          return basic + (turn ? 10 : 0);
        },
        f: 0,
        h: 0,
        g: 0,
      };
      xs.add(p.x);
      ys.add(p.y);
      const key = `${p.x}:${p.y}`;
      this.nodes[key] = node;
      this.edges[key] = new Set();
    });

    const gridX = [...xs.values()].sort((a, b) => a - b);
    const gridY = [...ys.values()].sort((a, b) => a - b);

    for (let i = 0; i < gridX.length; i++) {
      for (let j = 0; j < gridY.length; j++) {
        const key = `${gridX[i]}:${gridY[j]}`;
        if (!this.nodes[key]) {
          continue;
        }
        if (j > 0) {
          const k = `${gridX[i]}:${gridY[j - 1]}`;
          if (this.nodes[k]) {
            this.edges[key].add(k);
            this.edges[k].add(key);
            this.connections.push([this.nodes[key], this.nodes[k]]);
          }
        }
        if (i > 0) {
          const k = `${gridX[i - 1]}:${gridY[j]}`;
          if (this.nodes[k]) {
            this.edges[key].add(k);
            this.edges[k].add(key);
            this.connections.push([this.nodes[key], this.nodes[k]]);
          }
        }
      }
    }
  }

  neighbors(node: GraphNode) {
    const key = `${node.x}:${node.y}`;
    const n: GraphNode[] = [];
    this.edges[key].forEach(k => {
      n.push(this.nodes[k]);
    });
    return n;
  }

  getNode({ x, y }: Point) {
    return this.nodes[`${x}:${y}`];
  }
}
