import { assertEquals } from '@blocksuite/global/utils';

import type { DataViewTableColumnManager } from './table-view-manager.js';

export class ColumnStats {
  // private _cache: Record<string, unknown>;
  constructor(public column: DataViewTableColumnManager) {}

  get sum() {
    this._assertColumnTypeNumber('sum');
    return 0;
  }

  get avg() {
    this._assertColumnTypeNumber('avg');

    return 0;
  }

  get mean() {
    this._assertColumnTypeNumber('mean');

    return 0;
  }

  get mod() {
    this._assertColumnTypeNumber('mod');

    return 0;
  }

  get max() {
    this._assertColumnTypeNumber('max');

    return 0;
  }

  get min() {
    this._assertColumnTypeNumber('min');

    return 0;
  }

  get range() {
    this._assertColumnTypeNumber('range');

    return 0;
  }

  get count() {
    return 0;
  }

  get countValues() {
    return 0;
  }

  get countUniqueValues() {
    return 0;
  }

  get countEmpty() {
    return 0;
  }

  get countNonEmpty() {
    return 0;
  }

  get percentEmpty() {
    return 0;
  }

  get percentNonEmpty() {
    return 0;
  }

  private _isNumberColumn() {
    return this.column.type === 'Number';
  }

  private _assertColumnTypeNumber(fnName: string) {
    assertEquals(
      this._isNumberColumn(),
      true,
      `${fnName} should only be used in column of type Number`
    );
  }

  // private _getColValuesAsString() {
  //   const dataViewManager = this.column.dataViewManager;
  //   return dataViewManager.rows.map(rId => this.column.getValue(rId));
  // }

  // private _getColValuesAsNumber() {}
}
