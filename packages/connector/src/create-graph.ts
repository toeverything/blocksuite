interface Point {
  x: number;
  y: number;
}

export class Rectangle {
  readonly id = Math.random().toString(16).slice(2);
  x: number;
  y: number;
  w: number;
  h: number;

  constructor(x: number, y: number, w: number, h: number) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  get minX() {
    return this.x;
  }

  get maxX() {
    return this.x + this.w;
  }

  get minY() {
    return this.y;
  }

  get maxY() {
    return this.y + this.h;
  }

  inflate(horizontal: number, vertical: number) {
    return new Rectangle(
      this.x - horizontal,
      this.y - vertical,
      this.w + horizontal * 2,
      this.h + vertical * 2
    );
  }

  contains(x: number, y: number) {
    return x >= this.minX && x <= this.maxX && y >= this.minY && y <= this.maxY;
  }

  relativeDirection(x: number, y: number): 'left' | 'top' | 'right' | 'bottom' {
    const c = {
      left: Math.abs(x - this.x),
      right: Math.abs(x - this.x - this.w),
      top: Math.abs(y - this.y),
      bottom: Math.abs(y - this.y - this.h),
    };
    let min: number;
    let d = 'top';
    Object.entries(c).forEach(([k, v]) => {
      if (min === undefined) {
        min = v;
        d = k;
      } else {
        if (v < min) {
          min = v;
          d = k;
        }
      }
    });
    return d as 'left' | 'top' | 'right' | 'bottom';
  }
}

interface Rulers {
  columns: number[];
  rows: number[];
}

function createRulers(
  rectangles: Rectangle[],
  points: Point[],
  margin: number[]
): Rulers {
  const columns = new Set<number>();
  const rows = new Set<number>();

  rectangles.forEach(rect => {
    columns.add(rect.minX);
    columns.add(rect.maxX);
    rows.add(rect.minY);
    rows.add(rect.maxY);
  });

  points.forEach(p => {
    columns.add(p.x);
    rows.add(p.y);
  });
  const sortedColumns = [...columns.values()].sort((a, b) => a - b);
  const sortedRows = [...rows.values()].sort((a, b) => a - b);
  return {
    columns: [
      sortedColumns[0] - margin[0],
      ...sortedColumns,
      sortedColumns[sortedColumns.length - 1] + margin[0],
    ],
    rows: [
      sortedRows[0] - margin[1],
      ...sortedRows,
      sortedRows[sortedRows.length - 1] + margin[1],
    ],
  };
}

function createNodes(
  rulers: Rulers,
  rectangles: Rectangle[],
  points: Point[]
): Point[] {
  const results: Point[] = [];
  const cache: Set<string> = new Set();
  const gridX: Set<number> = new Set();
  const gridY: Set<number> = new Set();

  function addPoint(x: number, y: number, force = false) {
    if (!force && rectangles.find(r => r.contains(x, y))) {
      return;
    }
    const p = { x, y };
    const key = `${x}:${y}`;
    if (cache.has(key)) {
      return;
    }
    cache.add(key);
    gridX.add(x);
    gridY.add(y);
    results.push(p);
  }

  const { rows, columns } = rulers;
  for (let i = 0; i < rows.length; i++) {
    const isRowEdge = i === 0 || i === rows.length - 2;
    for (let j = 0; j < columns.length; j++) {
      const isColumnEdge = j === 0 || j === columns.length - 2;

      const currentX = columns[j];
      const currentY = rows[i];
      addPoint(currentX, currentY);

      const nextX = isColumnEdge ? undefined : columns[j + 1];
      const nextY = isRowEdge ? undefined : rows[i + 1];

      if (nextX) {
        addPoint((currentX + nextX) / 2, currentY);
      }
      if (nextY) {
        addPoint(currentX, (currentY + nextY) / 2);
      }
      if (nextX && nextY) {
        addPoint((currentX + nextX) / 2, (currentY + nextY) / 2);
      }
    }
  }

  const sortedGridX = [...gridX.values()].sort((a, b) => a - b);
  const sortedGridY = [...gridY.values()].sort((a, b) => a - b);
  points.forEach(p => {
    const rect = rectangles.find(r => r.contains(p.x, p.y));
    if (rect) {
      const direction = rect.relativeDirection(p.x, p.y);
      switch (direction) {
        case 'left': {
          let index = sortedGridX.indexOf(p.x);
          while (index > -1) {
            const columnsValue = sortedGridX[index];
            if (cache.has(`${columnsValue}:${p.y}`)) {
              break;
            }
            addPoint(columnsValue, p.y, true);
            index--;
          }
          break;
        }
        case 'top': {
          let index = sortedGridY.indexOf(p.y);
          while (index > -1) {
            const rowsValue = sortedGridY[index];
            if (cache.has(`${p.x}:${rowsValue}`)) {
              break;
            }
            addPoint(p.x, rowsValue, true);
            index--;
          }
          break;
        }
        case 'right': {
          let index = sortedGridX.indexOf(p.x);
          while (index < sortedGridX.length) {
            const columnsValue = sortedGridX[index];
            if (cache.has(`${columnsValue}:${p.y}`)) {
              break;
            }
            addPoint(columnsValue, p.y, true);
            index++;
          }
          break;
        }
        case 'bottom': {
          let index = sortedGridY.indexOf(p.y);
          while (index < sortedGridY.length) {
            const rowsValue = sortedGridY[index];
            if (cache.has(`${p.x}:${rowsValue}`)) {
              break;
            }
            addPoint(p.x, rowsValue, true);
            index++;
          }
          break;
        }
      }
    }
  });

  return results;
}

interface GraphNode {
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

class Graph {
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
}

export interface CreateGraphReturned {
  rectangles: Rectangle[];
  points: Point[];

  inflatedRectangles: Rectangle[];

  rulers: Rulers;
  nodes: Point[];
  graph: Graph;
}

export function createGraph(
  rectangles: Rectangle[],
  points: Point[],
  margin = [10, 10]
): CreateGraphReturned {
  const inflatedRects = rectangles.map(r => r.inflate(margin[0], margin[1]));
  const rulers = createRulers(inflatedRects, points, margin);
  const nodes = createNodes(rulers, inflatedRects, points);
  const graph = new Graph(nodes);
  return {
    rectangles,
    points,
    inflatedRectangles: inflatedRects,
    rulers,
    nodes,
    graph,
  };
}

export function simplifyPath(points: Point[]) {
  if (points.length <= 2) {
    return points;
  }
  const path = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const next = points[i + 1];
    if (
      (prev.x === cur.x && cur.x === next?.x) ||
      (prev.y === cur.y && cur.y === next?.y)
    ) {
      // nothing
    } else {
      path.push(cur);
    }
  }
  return path;
}
