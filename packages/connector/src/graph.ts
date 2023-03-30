import type { Point } from './simplify-path.js';

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

function isDirectionChanged(p: Point, fromNode: GraphNode) {
  if (fromNode.parent) {
    if (
      (fromNode.x === fromNode.parent.x && fromNode.x !== p.x) ||
      (fromNode.y === fromNode.parent.y && fromNode.y !== p.y)
    ) {
      return true;
    }
  }
  return false;
}

export class Graph {
  nodes: Record<string, GraphNode> = {};
  edges: Record<string, Set<string>> = {};
  connections: Array<GraphNode[]> = [];

  gridX: number[] = [];
  gridY: number[] = [];

  constructor(points: Point[]) {
    this._init(points);
  }

  private _init(points: Point[]) {
    this._addGraphNodesAndInitGrid(points);
    this._linkGraphNodes();
  }

  private _createGraphNode(p: Point): GraphNode {
    return {
      x: p.x,
      y: p.y,
      parent: null,
      cost: (fromNode: GraphNode) => {
        const basic = Math.abs(p.x - fromNode.x) + Math.abs(p.y - fromNode.y);
        const directionChanged = isDirectionChanged(p, fromNode);
        return basic + (directionChanged ? 10 : 0);
      },
      f: 0,
      h: 0,
      g: 0,
    };
  }

  private _addGraphNodesAndInitGrid(points: Point[]) {
    const xs = new Set<number>();
    const ys = new Set<number>();

    points.forEach(p => {
      const node = this._createGraphNode(p);
      xs.add(p.x);
      ys.add(p.y);
      const key = Graph.getKey(p);
      this.nodes[key] = node;
      this.edges[key] = new Set();
    });

    this.gridX = [...xs.values()].sort((a, b) => a - b);
    this.gridY = [...ys.values()].sort((a, b) => a - b);
  }

  private _linkGraphNodes() {
    const { gridX, gridY } = this;
    for (let i = 0; i < gridX.length; i++) {
      for (let j = 0; j < gridY.length; j++) {
        const key = Graph.getKey({ x: gridX[i], y: gridY[j] });
        if (!this.nodes[key]) {
          continue;
        }
        if (j > 0) {
          const topKey = Graph.getKey({ x: gridX[i], y: gridY[j - 1] });
          if (this.nodes[topKey]) {
            this.edges[key].add(topKey);
            this.edges[topKey].add(key);
            this.connections.push([this.nodes[key], this.nodes[topKey]]);
          }
        }
        if (i > 0) {
          const leftKey = Graph.getKey({ x: gridX[i - 1], y: gridY[j] });
          if (this.nodes[leftKey]) {
            this.edges[key].add(leftKey);
            this.edges[leftKey].add(key);
            this.connections.push([this.nodes[key], this.nodes[leftKey]]);
          }
        }
      }
    }
  }

  neighbors(node: GraphNode) {
    const key = Graph.getKey(node);
    const n: GraphNode[] = [];
    this.edges[key].forEach(k => {
      n.push(this.nodes[k]);
    });
    return n;
  }

  getNode(p: Point) {
    const k = Graph.getKey(p);
    return this.nodes[k];
  }

  static getKey({ x, y }: Point) {
    return `${x}:${y}`;
  }

  static parseKey(key: string): Point {
    const [x, y] = key.split(':').map(n => Number(n));
    return { x, y };
  }
}
