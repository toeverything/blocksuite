import type { Rectangle } from '../rectangle.js';
import type { Point } from '../simplify-path.js';
import type { Rulers } from './types.js';

/**
 * Generating a set of horizontal and vertical rulers based on the provided rectangles, points, and margin
 * @param rectangles
 * @param points
 * @param margin [horizontal, vertical]
 * @returns
 */
export function createRulers(
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
