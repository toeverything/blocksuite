import { Graph } from './graph.js';
import type { Rectangle } from './rectangle.js';
import type { Point } from './util.js';

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

  // If the point lies within the rectangle, it should be forcibly included.
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
