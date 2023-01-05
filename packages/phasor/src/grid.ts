import type { Model } from './models.js';
import type { Bound } from './consts.js';
import { getGridIndex, isOverlap, isPointIn, rangeFromBound } from './utils.js';

export class GridManager {
  private _grids: Map<string, Set<Model>> = new Map();

  private _createGrid(row: number, col: number) {
    const id = row + '|' + col;
    const models: Set<Model> = new Set();
    this._grids.set(id, models);
    return models;
  }

  private _getGrid(row: number, col: number) {
    const id = row + '|' + col;
    return this._grids.get(id);
  }

  get isEmpty() {
    return this._grids.size === 0;
  }

  add(model: Model) {
    const [minRow, maxRow, minCol, maxCol] = rangeFromBound(model);
    for (let i = minRow; i <= maxRow; i++) {
      for (let j = minCol; j <= maxCol; j++) {
        let grid = this._getGrid(i, j);
        if (!grid) {
          grid = this._createGrid(i, j);
        }
        grid.add(model);
      }
    }
  }

  remove(model: Model) {
    const [minRow, maxRow, minCol, maxCol] = rangeFromBound(model);
    for (let i = minRow; i <= maxRow; i++) {
      for (let j = minCol; j <= maxCol; j++) {
        const grid = this._getGrid(i, j);
        if (!grid) continue;
        grid.delete(model);
      }
    }
  }

  boundHasChanged(a: Bound, b: Bound) {
    const [minRow, maxRow, minCol, maxCol] = rangeFromBound(a);
    const [minRow2, maxRow2, minCol2, maxCol2] = rangeFromBound(b);
    return (
      minRow !== minRow2 ||
      maxRow !== maxRow2 ||
      minCol !== minCol2 ||
      maxCol !== maxCol2
    );
  }

  search(bound: Bound): Set<Model> {
    const [minRow, maxRow, minCol, maxCol] = rangeFromBound(bound);
    const results: Set<Model> = new Set();
    for (let i = minRow; i <= maxRow; i++) {
      for (let j = minCol; j <= maxCol; j++) {
        const gridmodels = this._getGrid(i, j);
        if (!gridmodels) continue;

        for (const model of gridmodels) {
          if (isOverlap(model, bound)) {
            results.add(model);
          }
        }
      }
    }

    return results;
  }

  pick(x: number, y: number): Model[] {
    const row = getGridIndex(x);
    const col = getGridIndex(y);
    const gridmodels = this._getGrid(row, col);
    if (!gridmodels) return [];

    const results: Model[] = [];
    for (const model of gridmodels) {
      if (isPointIn(model, x, y)) {
        results.push(model);
      }
    }

    return results;
  }
}
