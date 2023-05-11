import { assertExists } from '@blocksuite/store';

import { GRID_SIZE, type IBound } from './consts.js';
import type { SurfaceElement } from './elements/surface-element.js';
import { intersects, isPointIn } from './utils/hit-utils.js';

function getGridIndex(val: number) {
  return Math.ceil(val / GRID_SIZE) - 1;
}

function rangeFromBound(a: IBound): number[] {
  const minRow = getGridIndex(a.x);
  const maxRow = getGridIndex(a.x + a.w);
  const minCol = getGridIndex(a.y);
  const maxCol = getGridIndex(a.y + a.h);
  return [minRow, maxRow, minCol, maxCol];
}

export function compare(a: SurfaceElement, b: SurfaceElement): number {
  if (a.index > b.index) return 1;
  else if (a.index < b.index) return -1;
  return a.id > b.id ? 1 : -1;
}

export class GridManager {
  private _grids: Map<string, Set<SurfaceElement>> = new Map();
  private _elementToGrids: Map<SurfaceElement, Set<Set<SurfaceElement>>> =
    new Map();

  private _createGrid(row: number, col: number) {
    const id = row + '|' + col;
    const elements: Set<SurfaceElement> = new Set();
    this._grids.set(id, elements);
    return elements;
  }

  private _getGrid(row: number, col: number) {
    const id = row + '|' + col;
    return this._grids.get(id);
  }

  get isEmpty() {
    return this._grids.size === 0;
  }

  add(element: SurfaceElement) {
    const [minRow, maxRow, minCol, maxCol] = rangeFromBound(element);
    const grids = new Set<Set<SurfaceElement>>();
    this._elementToGrids.set(element, grids);

    for (let i = minRow; i <= maxRow; i++) {
      for (let j = minCol; j <= maxCol; j++) {
        let grid = this._getGrid(i, j);
        if (!grid) {
          grid = this._createGrid(i, j);
        }
        grid.add(element);
        grids.add(grid);
      }
    }
  }

  remove(element: SurfaceElement) {
    const grids = this._elementToGrids.get(element);
    assertExists(grids);

    for (const grid of grids) {
      grid.delete(element);
    }
  }

  boundHasChanged(a: IBound, b: IBound) {
    const [minRow, maxRow, minCol, maxCol] = rangeFromBound(a);
    const [minRow2, maxRow2, minCol2, maxCol2] = rangeFromBound(b);
    return (
      minRow !== minRow2 ||
      maxRow !== maxRow2 ||
      minCol !== minCol2 ||
      maxCol !== maxCol2
    );
  }

  search(bound: IBound): SurfaceElement[] {
    const [minRow, maxRow, minCol, maxCol] = rangeFromBound(bound);
    const results: Set<SurfaceElement> = new Set();
    for (let i = minRow; i <= maxRow; i++) {
      for (let j = minCol; j <= maxCol; j++) {
        const gridElements = this._getGrid(i, j);
        if (!gridElements) continue;

        for (const element of gridElements) {
          if (intersects(element, bound)) {
            results.add(element);
          }
        }
      }
    }

    // sort elements in set based on index
    const sorted = Array.from(results).sort(compare);

    return sorted;
  }

  pick(x: number, y: number): SurfaceElement[] {
    const row = getGridIndex(x);
    const col = getGridIndex(y);
    const gridElements = this._getGrid(row, col);
    if (!gridElements) return [];

    const results: SurfaceElement[] = [];
    for (const element of gridElements) {
      if (isPointIn(element, x, y)) {
        results.push(element);
      }
    }

    return results;
  }
}
