import type { Element } from './elements/index.js';
import type { IBound } from './consts.js';
import {
  compare,
  getGridIndex,
  isOverlap,
  isPointIn,
  rangeFromBound,
} from './utils.js';

export class GridManager {
  private _grids: Map<string, Set<Element>> = new Map();

  private _createGrid(row: number, col: number) {
    const id = row + '|' + col;
    const elements: Set<Element> = new Set();
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

  add(element: Element) {
    const [minRow, maxRow, minCol, maxCol] = rangeFromBound(element);
    for (let i = minRow; i <= maxRow; i++) {
      for (let j = minCol; j <= maxCol; j++) {
        let grid = this._getGrid(i, j);
        if (!grid) {
          grid = this._createGrid(i, j);
        }
        grid.add(element);
      }
    }
  }

  remove(element: Element) {
    const [minRow, maxRow, minCol, maxCol] = rangeFromBound(element);
    for (let i = minRow; i <= maxRow; i++) {
      for (let j = minCol; j <= maxCol; j++) {
        const grid = this._getGrid(i, j);
        if (!grid) continue;
        grid.delete(element);
      }
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

  search(bound: IBound): Element[] {
    const [minRow, maxRow, minCol, maxCol] = rangeFromBound(bound);
    const results: Set<Element> = new Set();
    for (let i = minRow; i <= maxRow; i++) {
      for (let j = minCol; j <= maxCol; j++) {
        const gridElements = this._getGrid(i, j);
        if (!gridElements) continue;

        for (const element of gridElements) {
          if (isOverlap(element, bound)) {
            results.add(element);
          }
        }
      }
    }

    // sort elements in set based on index
    const sorted = Array.from(results).sort(compare);

    return sorted;
  }

  pick(x: number, y: number): Element[] {
    const row = getGridIndex(x);
    const col = getGridIndex(y);
    const gridElements = this._getGrid(row, col);
    if (!gridElements) return [];

    const results: Element[] = [];
    for (const element of gridElements) {
      if (isPointIn(element, x, y)) {
        results.push(element);
      }
    }

    return results;
  }
}
