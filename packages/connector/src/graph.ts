export interface Block {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface GraphElement {
  x: number;
  y: number;
  parent: GraphElement | null;
  cost(fromElement: GraphElement): number;

  f: number;
  h: number;
  g: number;
  closed?: boolean;
  visited?: boolean;
}

export class Graph {
  private _blocks: Block[] = [];
  private _start: Point;
  private _end: Point;

  private _grid: { rows: number[]; cols: number[] } = { rows: [], cols: [] };
  private _elements: Record<`${number}:${number}`, GraphElement> = {};

  private _debugStack: GraphElement[] = [];

  constructor(blocks: Block[], start: Point, end: Point) {
    this._blocks = blocks;
    this._start = start;
    this._end = end;

    this._init();
  }

  private _init() {
    const cols: Set<number> = new Set();
    const rows: Set<number> = new Set();

    this._blocks.forEach(block => {
      const { x, y, w, h } = block;
      cols.add(x);
      cols.add(x + w);
      rows.add(y);
      rows.add(y + h);
    });

    cols.add(this._start.x);
    rows.add(this._start.y);

    cols.add(this._end.x);
    rows.add(this._end.y);

    this._grid = {
      rows: [...rows.values()].sort((a, b) => a - b),
      cols: [...cols.values()].sort((a, b) => a - b),
    };
  }

  private _getOrCreateElement(x: number, y: number): GraphElement | null {
    if (
      x < 0 ||
      y < 0 ||
      x >= this._grid.cols.length ||
      y >= this._grid.rows.length
    ) {
      return null;
    }
    const key = `${x}:${y}` as const;
    const ele = this._elements[key];
    if (ele) {
      return ele;
    }
    const createdX = x;
    const createdY = y;
    const created = {
      x,
      y,
      parent: null,
      f: 0,
      h: 0,
      g: 0,
      cost: (fromElement: GraphElement) => {
        const foundIntersection = this._blocks.find(block => {
          const { x, y, w, h } = block;
          const currentX = this._grid.cols[createdX];
          const currentY = this._grid.rows[createdY];
          const fromX = this._grid.cols[fromElement.x];
          const fromY = this._grid.rows[fromElement.y];

          // current point in blocks
          if (
            currentX > x &&
            currentX < x + w &&
            currentY > y &&
            currentY < y + h
          ) {
            return true;
          }

          // from point in blocks
          if (fromX > x && fromX < x + w && fromY > y && fromY < y + h) {
            return true;
          }

          // line through
          if (fromX === currentX && fromX > x && fromX < x + w) {
            if (
              (fromY === y && currentY === y + h) ||
              (fromY === y + h && currentY === y)
            ) {
              return true;
            }
          }
          if (fromY === currentY && fromY > y && fromY < y + h) {
            if (
              (fromX === x && currentX === x + w) ||
              (fromX === x + w && currentX === x)
            ) {
              return true;
            }
          }
          return false;
        });

        // direction changed
        let turn = 0;
        if (fromElement.parent) {
          if (
            (fromElement.x === fromElement.parent.x &&
              fromElement.x !== createdX) ||
            (fromElement.y === fromElement.parent.y &&
              fromElement.y !== createdY)
          ) {
            turn = 1;
          }
        }

        return 1 + turn + (foundIntersection ? 10 : 0);
      },
    };
    this._elements[key] = created;
    this._debugStack.push(created);
    return created;
  }

  get grid() {
    return this._grid;
  }

  get debugStack() {
    return this._debugStack;
  }

  getElement(x: number, y: number) {
    const { cols, rows } = this._grid;
    const xPos = cols.indexOf(x);
    const yPos = rows.indexOf(y);
    return this._getOrCreateElement(xPos, yPos);
  }

  neighbors(element: GraphElement): GraphElement[] {
    const { x, y } = element;
    return [
      // Left
      this._getOrCreateElement(x - 1, y),
      // Right
      this._getOrCreateElement(x + 1, y),
      // Down
      this._getOrCreateElement(x, y + 1),
      // Top
      this._getOrCreateElement(x, y - 1),
    ].filter(ele => !!ele) as GraphElement[];
  }
}
