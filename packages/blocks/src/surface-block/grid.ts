import type { IBound } from '@blocksuite/global/utils';

import {
  Bound,
  getBoundsWithRotation,
  intersects,
  isPointIn,
} from '@blocksuite/global/utils';

import { GRID_SIZE } from './consts.js';
import { compare } from './managers/layer-utils.js';

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

function rangeFromElement<T extends BlockSuite.EdgelessModel>(
  ele: T
): number[] {
  const bound = ele.elementBound;
  const minRow = getGridIndex(bound.x);
  const maxRow = getGridIndex(bound.maxX);
  const minCol = getGridIndex(bound.y);
  const maxCol = getGridIndex(bound.maxY);
  return [minRow, maxRow, minCol, maxCol];
}

function rangeFromElementExternal<T extends BlockSuite.EdgelessModel>(
  ele: T
): number[] | null {
  if (!ele.externalXYWH) return null;

  const bound = Bound.deserialize(ele.externalXYWH);
  const minRow = getGridIndex(bound.x);
  const maxRow = getGridIndex(bound.maxX);
  const minCol = getGridIndex(bound.y);
  const maxCol = getGridIndex(bound.maxY);
  return [minRow, maxRow, minCol, maxCol];
}

export class GridManager<T extends BlockSuite.EdgelessModel> {
  private _elementToGrids = new Map<T, Set<Set<T>>>();

  private _externalElementToGrids = new Map<T, Set<Set<T>>>();

  private _externalGrids = new Map<string, Set<T>>();

  private _grids = new Map<string, Set<T>>();

  private _addToExternalGrids(element: T) {
    const range = rangeFromElementExternal(element);

    if (!range) {
      this._removeFromExternalGrids(element);
      return;
    }

    const [minRow, maxRow, minCol, maxCol] = range;
    const grids = new Set<Set<T>>();
    this._externalElementToGrids.set(element, grids);

    for (let i = minRow; i <= maxRow; i++) {
      for (let j = minCol; j <= maxCol; j++) {
        let grid = this._getExternalGrid(i, j);
        if (!grid) {
          grid = this._createExternalGrid(i, j);
        }
        grid.add(element);
        grids.add(grid);
      }
    }
  }

  private _createExternalGrid(row: number, col: number) {
    const id = row + '|' + col;
    const elements = new Set<T>();
    this._externalGrids.set(id, elements);
    return elements;
  }

  private _createGrid(row: number, col: number) {
    const id = row + '|' + col;
    const elements = new Set<T>();
    this._grids.set(id, elements);
    return elements;
  }

  private _getExternalGrid(row: number, col: number) {
    const id = row + '|' + col;
    return this._externalGrids.get(id);
  }

  private _getGrid(row: number, col: number) {
    const id = row + '|' + col;
    return this._grids.get(id);
  }

  private _removeFromExternalGrids(element: T) {
    const grids = this._externalElementToGrids.get(element);
    if (grids) {
      for (const grid of grids) {
        grid.delete(element);
      }
    }
  }

  private _searchExternal(bound: IBound, strict = false): Set<T> {
    const [minRow, maxRow, minCol, maxCol] = rangeFromBound(bound);
    const results = new Set<T>();
    const b = Bound.from(bound);

    for (let i = minRow; i <= maxRow; i++) {
      for (let j = minCol; j <= maxCol; j++) {
        const gridElements = this._getExternalGrid(i, j);
        if (!gridElements) continue;

        for (const element of gridElements) {
          const externalBound = element.externalBound;
          if (
            externalBound &&
            (strict
              ? b.contains(externalBound)
              : intersects(externalBound, bound))
          ) {
            results.add(element);
          }
        }
      }
    }

    return results;
  }

  add(element: T) {
    this._addToExternalGrids(element);

    const [minRow, maxRow, minCol, maxCol] = rangeFromElement(element);
    const grids = new Set<Set<T>>();
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

  /**
   *
   * @param bound
   * @param strict
   * @param reverseChecking If true, check if the bound is inside the elements instead of checking if the elements are inside the bound
   * @returns
   */
  has(
    bound: IBound,
    strict: boolean = false,
    reverseChecking: boolean = false,
    exclude?: Set<T>
  ) {
    const [minRow, maxRow, minCol, maxCol] = rangeFromBound(bound);
    const b = Bound.from(bound);
    const check = reverseChecking
      ? (target: Bound) => {
          return strict ? target.contains(b) : intersects(b, target);
        }
      : (target: Bound) => {
          return strict ? b.contains(target) : intersects(target, b);
        };

    for (let i = minRow; i <= maxRow; i++) {
      for (let j = minCol; j <= maxCol; j++) {
        const gridElements = this._getGrid(i, j);
        if (!gridElements) continue;
        for (const element of gridElements) {
          if (!exclude?.has(element) && check(element.elementBound)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  pick(x: number, y: number): T[] {
    const row = getGridIndex(x);
    const col = getGridIndex(y);
    const gridElements = this._getGrid(row, col);
    if (!gridElements) return [];

    const results: T[] = [];
    for (const element of gridElements) {
      if (
        isPointIn(getBoundsWithRotation(Bound.deserialize(element.xywh)), x, y)
      ) {
        results.push(element);
      }
    }

    return results;
  }

  remove(element: T) {
    const grids = this._elementToGrids.get(element);
    if (grids) {
      for (const grid of grids) {
        grid.delete(element);
      }
    }

    this._removeFromExternalGrids(element);
  }

  search(bound: IBound, strict?: boolean, getSet?: false): T[];
  search(bound: IBound, strict: boolean | undefined, getSet: true): Set<T>;
  search(bound: IBound, strict = false, getSet: boolean = false): T[] | Set<T> {
    const results: Set<T> = this._searchExternal(bound, strict);
    const [minRow, maxRow, minCol, maxCol] = rangeFromBound(bound);
    const b = Bound.from(bound);

    for (let i = minRow; i <= maxRow; i++) {
      for (let j = minCol; j <= maxCol; j++) {
        const gridElements = this._getGrid(i, j);
        if (!gridElements) continue;
        for (const element of gridElements) {
          if (
            strict
              ? b.contains(element.elementBound)
              : intersects(element.elementBound, bound)
          ) {
            results.add(element);
          }
        }
      }
    }

    if (getSet) return results;

    // sort elements in set based on index
    const sorted = Array.from(results).sort(compare);

    return sorted;
  }

  update(element: T) {
    this.remove(element);
    this.add(element);
  }

  get isEmpty() {
    return this._grids.size === 0;
  }
}
