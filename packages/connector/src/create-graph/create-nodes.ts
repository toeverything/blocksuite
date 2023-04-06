import { Graph } from '../graph.js';
import type { Rectangle } from '../rectangle.js';
import type { Point } from '../simplify-path.js';
import type { Rulers } from './types.js';

type FindPointInRect = (x: number, y: number) => Rectangle | undefined;
type AddPoint = (x: number, y: number, force?: boolean) => void;
type HasPoint = (x: number, y: number) => boolean;

function createValidNodesAndGrid(findPointInRect: FindPointInRect) {
  const nodes: Point[] = [];
  const cache: Set<string> = new Set();
  const gridX: Set<number> = new Set();
  const gridY: Set<number> = new Set();

  const addPoint: AddPoint = (x: number, y: number, force = false) => {
    if (!force && findPointInRect(x, y)) {
      return;
    }
    const p = { x, y };
    const key = Graph.getKey(p);
    if (cache.has(key)) {
      return;
    }
    cache.add(key);
    gridX.add(x);
    gridY.add(y);
    nodes.push(p);
  };

  const hasPoint: HasPoint = (x: number, y: number) => {
    const key = Graph.getKey({ x, y });
    return cache.has(key);
  };

  return {
    nodes,
    getGrid: () => {
      const sortedGridX = [...gridX.values()].sort((a, b) => a - b);
      const sortedGridY = [...gridY.values()].sort((a, b) => a - b);
      return {
        gridX: sortedGridX,
        gridY: sortedGridY,
      };
    },
    addPoint,
    hasPoint,
  };
}

function addRulersPoints(rulers: Rulers, addPoint: AddPoint) {
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
}

function forceAddPointsAsNodes(
  points: Point[],
  gridX: number[],
  gridY: number[],
  addPoint: AddPoint,
  hasPoint: HasPoint,
  findPointInRect: FindPointInRect
) {
  points.forEach(p => {
    const rect = findPointInRect(p.x, p.y);
    if (rect) {
      const direction = rect.relativeDirection(p.x, p.y);
      switch (direction) {
        case 'left': {
          let index = gridX.indexOf(p.x);
          while (index > -1) {
            const columnsValue = gridX[index];
            if (hasPoint(columnsValue, p.y)) {
              break;
            }
            addPoint(columnsValue, p.y, true);
            index--;
          }
          break;
        }
        case 'right': {
          let index = gridX.indexOf(p.x);
          while (index < gridX.length) {
            const columnsValue = gridX[index];
            if (hasPoint(columnsValue, p.y)) {
              break;
            }
            addPoint(columnsValue, p.y, true);
            index++;
          }
          break;
        }
        case 'top': {
          let index = gridY.indexOf(p.y);
          while (index > -1) {
            const rowsValue = gridY[index];
            if (hasPoint(p.x, rowsValue)) {
              break;
            }
            addPoint(p.x, rowsValue, true);
            index--;
          }
          break;
        }
        case 'bottom': {
          let index = gridY.indexOf(p.y);
          while (index < gridY.length) {
            const rowsValue = gridY[index];
            if (hasPoint(p.x, rowsValue)) {
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
}

export function createNodes(
  rulers: Rulers,
  rectangles: Rectangle[],
  points: Point[]
): Point[] {
  const findPointInRect: FindPointInRect = (x, y) =>
    rectangles.find(r => r.contains(x, y));
  const { nodes, addPoint, hasPoint, getGrid } =
    createValidNodesAndGrid(findPointInRect);

  addRulersPoints(rulers, addPoint);
  const { gridX, gridY } = getGrid();
  forceAddPointsAsNodes(
    points,
    gridX,
    gridY,
    addPoint,
    hasPoint,
    findPointInRect
  );

  return nodes;
}
