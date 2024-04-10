import { assertEquals } from '@blocksuite/global/utils';

import type { SelectTag } from '../../_common/components/index.js';
import type { DataViewColumnManager } from './data-view-manager.js';

/**
 * Class for computing statistics on a DataViewColumnManager column.
 * Supports various statistical operations such as counting, sum, mean, median, mode, max, min, range,
 * and specific operations for checkbox columns.
 */
export class ColumnDataStats<
  Column extends DataViewColumnManager = DataViewColumnManager,
> {
  private dataViewManager: Column['dataViewManager'];

  /**
   * Constructs a new ColumnDataStats instance.
   *
   * @param column The column for which statistics are computed.
   */
  constructor(private column: Column) {
    this.dataViewManager = column.dataViewManager;
  }

  /**
   * Returns the number of cells in the column.
   */
  countAll() {
    return this.dataViewManager.rows.length;
  }

  /**
   * Returns the number of cells in the column with a value in it.
   */
  countValues() {
    return this._getColumnValueCounts();
  }

  /**
   * Returns the number of unique values in the column.
   */
  countUniqueValues() {
    return [...new Set(this._getAllValuesAsString())].length;
  }

  /**
   * Returns the number of cells in the column which are *empty*.
   */
  countEmpty() {
    return this._getEmptyCellCount();
  }

  /**
   * Returns the number of cells in the column which are *not empty*.
   */
  countNonEmpty() {
    return this._getNonEmptyCellCount();
  }

  /**
   * Returns the percent of cells in the column which are empty.
   */
  percentEmpty() {
    return this._getEmptyCellCount() / this.countAll();
  }

  /**
   * Returns the percent of cells in the column which are not empty.
   */
  percentNonEmpty() {
    return 1.0 - this.percentEmpty();
  }

  // Math Ops

  /**
   * Returns the sum of all values in the column.
   */
  sum() {
    const values = this._getColValuesAsNumber();
    let sum = 0;
    for (const val of values) sum += val;
    return sum;
  }

  /**
   * Returns the average of values in the column.
   */
  mean() {
    const values = this._getColValuesAsNumber();
    let sum = 0;
    for (const val of values) sum += val;
    return sum / values.length;
  }

  /**
   * Returns the median of the column.
   */
  median() {
    const values = this._getColValuesAsNumber().sort((a, b) => a - b);
    const n = values.length;
    const mid = Math.floor(n / 2);

    if (n % 2 === 0) {
      return (values[mid - 1] + values[mid]) / 2;
    } else {
      return values[mid];
    }
  }

  /**
   * Returns the mode of the column.
   */
  mode() {
    const values = this._getColValuesAsNumber();

    const frequencyMap = new Map<number, number>();

    values.forEach(value => {
      const cur = frequencyMap.get(value);
      cur === undefined
        ? frequencyMap.set(value, 1)
        : frequencyMap.set(value, cur + 1);
    });

    let mode = 0;
    let maxFrequency = 0;

    frequencyMap.forEach((frequency, element) => {
      if (frequency > maxFrequency) {
        mode = element;
        maxFrequency = frequency;
      }
    });

    return mode;
  }

  /**
   * Returns the maximum value in the column.
   */
  max() {
    const values = this._getColValuesAsNumber();

    return Math.max(...values);
  }

  /**
   * Returns the minimum value in the column.
   */
  min() {
    const values = this._getColValuesAsNumber();

    return Math.min(...values);
  }

  /**
   * Returns the range of the value in the column (max - min).
   */
  range() {
    return this.max() - this.min();
  }

  // Checkbox

  /**
   * Returns the number of checked checkboxes.
   */
  checked() {
    let checked = 0;
    const values = this._getCheckBoxColValues();
    for (const value of values) {
      if (value) checked++;
    }
    return checked;
  }

  /**
   * Returns the number of unchecked checkboxes.
   */
  notChecked() {
    let notChecked = 0;
    const values = this._getCheckBoxColValues();
    for (const value of values) {
      if (!value) notChecked++;
    }
    return notChecked;
  }

  /**
   * Returns the percent of checked checkboxes.
   */
  percentChecked() {
    this._assertColumnType('checkbox');
    return this.checked() / this.countAll();
  }

  /**
   * Returns the percent of unchecked checkboxes.
   */
  percentNotChecked() {
    this._assertColumnType('checkbox');
    return 1.0 - this.percentChecked();
  }

  private _assertColumnType(type: string) {
    assertEquals(
      this.column.type,
      type,
      `This function should only be called in a column of type ${type}`
    );
  }

  private _getEmptyCellCount() {
    let empty = 0;

    for (const rId of this.dataViewManager.rows) {
      const colVal = this.column.getStringValue(rId).trim();
      if (colVal === '') empty++;
    }
    return empty;
  }

  private _getNonEmptyCellCount() {
    let notEmpty = 0;

    for (const rId of this.dataViewManager.rows) {
      const colVal = this.column.getStringValue(rId).trim();
      if (colVal !== '') notEmpty++;
    }
    return notEmpty;
  }

  // this functions also splits the individual values inside the multiselect
  private _getAllValuesAsString() {
    const colType = this.column.type;
    const colValues: string[] = [];

    for (const rId of this.dataViewManager.rows) {
      switch (colType) {
        case 'multi-select': {
          const options = (this.column.data.options ?? []) as SelectTag[];
          const values = (this.column.getValue(rId) ?? []) as string[];
          const map = new Map<string, SelectTag>(options?.map(v => [v.id, v]));
          for (const id of values) {
            const opt = map.get(id);

            if (opt) colValues.push(opt.value);
          }
          break;
        }
        default: {
          const value = this.column.getStringValue(rId);
          if (value.trim() !== '') colValues.push(value);
        }
      }
    }

    return colValues;
  }
  // gets the count of non-empty values in the column with separated out multiselect items
  private _getColumnValueCounts() {
    return this._getAllValuesAsString().length;
  }

  // @ts-ignore
  private _getColValuesAsString(noEmpty = false) {
    const val = this.dataViewManager.rows.map(rId => {
      return this.column.getStringValue(rId);
    });
    return noEmpty ? val.filter(v => v.trim() !== '') : val;
  }

  private _getColValuesAsNumber() {
    this._assertColumnType('number');
    const values: number[] = [];
    for (const rId of this.dataViewManager.rows) {
      const value = this.column.getValue(rId) as number | undefined;
      if (value !== undefined) values.push(value);
    }
    return values;
  }

  private _getCheckBoxColValues() {
    this._assertColumnType('checkbox');
    const val = this.dataViewManager.rows.map(rId => {
      return this.column.getValue(rId);
    });
    return val as (boolean | undefined)[];
  }
}
