import type { IBound } from '@blocksuite/global/utils';
import type { BlockModel, Doc } from '@blocksuite/store';

import {
  Bound,
  getBoundsWithRotation,
  intersects,
  isPointIn,
} from '@blocksuite/global/utils';

import { compare } from '../utils/layer.js';
import { GfxBlockElementModel, type GfxModel } from './gfx-block-model.js';
import { SurfaceBlockModel } from './surface/surface-model.js';

function getGridIndex(val: number) {
  return Math.ceil(val / DEFAULT_GRID_SIZE) - 1;
}

function rangeFromBound(a: IBound): number[] {
  if (a.rotate) a = getBoundsWithRotation(a);
  const minRow = getGridIndex(a.x);
  const maxRow = getGridIndex(a.x + a.w);
  const minCol = getGridIndex(a.y);
  const maxCol = getGridIndex(a.y + a.h);
  return [minRow, maxRow, minCol, maxCol];
}

function rangeFromElement(ele: GfxModel): number[] {
  const bound = ele.elementBound;
  const minRow = getGridIndex(bound.x);
  const maxRow = getGridIndex(bound.maxX);
  const minCol = getGridIndex(bound.y);
  const maxCol = getGridIndex(bound.maxY);
  return [minRow, maxRow, minCol, maxCol];
}

function rangeFromElementExternal(ele: GfxModel): number[] | null {
  if (!ele.externalXYWH) return null;

  const bound = Bound.deserialize(ele.externalXYWH);
  const minRow = getGridIndex(bound.x);
  const maxRow = getGridIndex(bound.maxX);
  const minCol = getGridIndex(bound.y);
  const maxCol = getGridIndex(bound.maxY);
  return [minRow, maxRow, minCol, maxCol];
}

export const DEFAULT_GRID_SIZE = 3000;

export class GridManager {
  private _elementToGrids = new Map<GfxModel, Set<Set<GfxModel>>>();

  private _externalElementToGrids = new Map<GfxModel, Set<Set<GfxModel>>>();

  private _externalGrids = new Map<string, Set<GfxModel>>();

  private _grids = new Map<string, Set<GfxModel>>();

  get isEmpty() {
    return this._grids.size === 0;
  }

  private _addToExternalGrids(element: GfxModel) {
    const range = rangeFromElementExternal(element);

    if (!range) {
      this._removeFromExternalGrids(element);
      return;
    }

    const [minRow, maxRow, minCol, maxCol] = range;
    const grids = new Set<Set<GfxModel>>();
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
    const elements = new Set<GfxModel>();
    this._externalGrids.set(id, elements);
    return elements;
  }

  private _createGrid(row: number, col: number) {
    const id = row + '|' + col;
    const elements = new Set<GfxModel>();
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

  private _removeFromExternalGrids(element: GfxModel) {
    const grids = this._externalElementToGrids.get(element);
    if (grids) {
      for (const grid of grids) {
        grid.delete(element);
      }
    }
  }

  private _searchExternal(bound: IBound, strict = false): Set<GfxModel> {
    const [minRow, maxRow, minCol, maxCol] = rangeFromBound(bound);
    const results = new Set<GfxModel>();
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

  add(element: GfxModel) {
    this._addToExternalGrids(element);

    const [minRow, maxRow, minCol, maxCol] = rangeFromElement(element);
    const grids = new Set<Set<GfxModel>>();
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
    filter?: (model: GfxModel) => boolean
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
          if ((!filter || filter(element)) && check(element.elementBound)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  pick(x: number, y: number): GfxModel[] {
    const row = getGridIndex(x);
    const col = getGridIndex(y);
    const gridElements = this._getGrid(row, col);
    if (!gridElements) return [];

    const results: GfxModel[] = [];
    for (const element of gridElements) {
      if (
        isPointIn(getBoundsWithRotation(Bound.deserialize(element.xywh)), x, y)
      ) {
        results.push(element);
      }
    }

    return results;
  }

  remove(element: GfxModel) {
    const grids = this._elementToGrids.get(element);
    if (grids) {
      for (const grid of grids) {
        grid.delete(element);
      }
    }

    this._removeFromExternalGrids(element);
  }
  search(
    bound: IBound,
    strict?: boolean,
    options?: {
      useSet?: false;
      filter?: (model: GfxModel) => boolean;
    }
  ): GfxModel[];
  search(
    bound: IBound,
    strict: boolean | undefined,
    options: {
      useSet: true;
      filter?: (model: GfxModel) => boolean;
    }
  ): Set<GfxModel>;

  search(
    bound: IBound,
    strict = false,
    options: {
      /**
       * If true, return a set of elements instead of an array
       */
      useSet?: boolean;
      filter?: (model: GfxModel) => boolean;
    } = {
      useSet: false,
    }
  ): GfxModel[] | Set<GfxModel> {
    const results: Set<GfxModel> = this._searchExternal(bound, strict);
    const [minRow, maxRow, minCol, maxCol] = rangeFromBound(bound);
    const b = Bound.from(bound);
    const returnSet = options.useSet ?? false;
    const filter = options.filter;

    for (let i = minRow; i <= maxRow; i++) {
      for (let j = minCol; j <= maxCol; j++) {
        const gridElements = this._getGrid(i, j);
        if (!gridElements) continue;
        for (const element of gridElements) {
          if (
            (!filter || filter(element)) && strict
              ? b.contains(element.elementBound)
              : intersects(element.elementBound, b)
          ) {
            results.add(element);
          }
        }
      }
    }

    if (returnSet) return results;

    // sort elements in set based on index
    const sorted = Array.from(results).sort(compare);

    return sorted;
  }

  update(element: GfxModel) {
    this.remove(element);
    this.add(element);
  }

  watch(blocks: { doc?: Doc; surface?: SurfaceBlockModel | null }) {
    const disposables: { dispose: () => void }[] = [];
    const { doc, surface } = blocks;
    const isRenderableBlock = (
      block: BlockModel
    ): block is GfxBlockElementModel => {
      return (
        block instanceof GfxBlockElementModel &&
        (block.parent?.role === 'root' ||
          block.parent instanceof SurfaceBlockModel)
      );
    };

    if (doc) {
      disposables.push(
        doc.slots.blockUpdated.on(payload => {
          if (payload.type === 'add') {
            if (isRenderableBlock(payload.model)) {
              this.add(payload.model);
            }
          }

          if (payload.type === 'update') {
            if (payload.props.key === 'xywh') {
              this.update(
                doc.getBlock(payload.id)?.model as GfxBlockElementModel
              );
            }
          }

          if (payload.type === 'delete') {
            if (payload.model instanceof GfxBlockElementModel) {
              this.remove(payload.model);
            }
          }
        })
      );

      Object.values(doc.blocks.peek()).forEach(block => {
        if (isRenderableBlock(block.model)) {
          this.add(block.model);
        }
      });
    }

    if (surface) {
      disposables.push(
        surface.elementAdded.on(payload => {
          this.add(surface.getElementById(payload.id)!);
        })
      );

      disposables.push(
        surface.elementRemoved.on(payload => {
          this.remove(payload.model);
        })
      );

      disposables.push(
        surface.elementUpdated.on(payload => {
          if (payload.props['xywh'] || payload.props['externalXYWH']) {
            this.update(surface.getElementById(payload.id)!);
          }
        })
      );

      surface.elementModels.forEach(model => {
        this.add(model);
      });
    }

    return () => {
      disposables.forEach(d => d.dispose());
    };
  }
}
