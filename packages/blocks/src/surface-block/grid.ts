import { assertExists } from '@blocksuite/global/utils';

import { GRID_SIZE, type IBound } from './consts.js';
import type { SurfaceElement } from './elements/surface-element.js';
import { compare } from './managers/group-manager.js';
import { Bound } from './utils/bound.js';
import {
  getBoundsWithRotation,
  intersects,
  isPointIn,
} from './utils/math-utils.js';

function getGridIndex(val: number) {
  return Math.ceil(val / GRID_SIZE) - 1;
}

function rangeFromBound(a: IBound): number[] {
  if (a.rotate) a = getBoundsWithRotation(a);
  const minRow = getGridIndex(a.x);
  const maxRow = getGridIndex(a.x + a.w);
  const minCol = getGridIndex(a.y);
  const maxCol = getGridIndex(a.y + a.h);
  return [minRow, maxRow, minCol, maxCol];
}

function rangeFromElement(ele: SurfaceElement): number[] {
  const bound = ele.gridBound;
  const minRow = getGridIndex(bound.x);
  const maxRow = getGridIndex(bound.maxX);
  const minCol = getGridIndex(bound.y);
  const maxCol = getGridIndex(bound.maxY);
  return [minRow, maxRow, minCol, maxCol];
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
    const [minRow, maxRow, minCol, maxCol] = rangeFromElement(element);
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

  search(bound: IBound, strict = false): SurfaceElement[] {
    const [minRow, maxRow, minCol, maxCol] = rangeFromBound(bound);
    const results: Set<SurfaceElement> = new Set();
    const b = Bound.from(bound);
    for (let i = minRow; i <= maxRow; i++) {
      for (let j = minCol; j <= maxCol; j++) {
        const gridElements = this._getGrid(i, j);
        if (!gridElements) continue;
        for (const element of gridElements) {
          if (
            strict
              ? b.contains(element.gridBound)
              : intersects(element.gridBound, bound)
          ) {
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
      if (isPointIn(getBoundsWithRotation(element), x, y)) {
        results.push(element);
      }
    }

    return results;
  }
}
