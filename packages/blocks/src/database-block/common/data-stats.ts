import { assertEquals } from '@blocksuite/global/utils';

import type { DataViewColumnManager } from './data-view-manager.js';

export class ColumnDataStats<
  Column extends DataViewColumnManager = DataViewColumnManager,
> {
  // private _cache: Record<string, unknown>;
  private dataViewManager: Column['dataViewManager'];
  constructor(private column: Column) {
    this.dataViewManager = column.dataViewManager;
  }

  sum() {
    this.assertColumnTypeNumber('sum');
    const values = this.getColValuesAsNumber();
    let sum = 0;
    for (const val of values) sum += val;
    return sum;
  }

  avg() {
    this.assertColumnTypeNumber('avg');
    const values = this.getColValuesAsNumber();
    let sum = 0;
    for (const val of values) sum += val;
    return sum / values.length;
  }

  median() {
    this.assertColumnTypeNumber('mean');
    const values = this.getColValuesAsNumber().sort((a, b) => a - b);
    const n = values.length;
    const mid = Math.floor(n / 2);

    if (n % 2 === 0) {
      return (values[mid - 1] + values[mid]) / 2;
    } else {
      return values[mid];
    }
  }

  mode() {
    this.assertColumnTypeNumber('mode');
    const values = this.getColValuesAsNumber().sort((a, b) => a - b);

    const frequencyMap = new Map();

    values.forEach(value => {
      if (frequencyMap.has(value)) {
        frequencyMap.set(value, frequencyMap.get(value) + 1);
      } else {
        frequencyMap.set(value, 1);
      }
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

  max() {
    this.assertColumnTypeNumber('max');
    const values = this.getColValuesAsNumber().sort((a, b) => a - b);
    return Math.max(...values);
  }

  min() {
    this.assertColumnTypeNumber('min');
    const values = this.getColValuesAsNumber().sort((a, b) => a - b);
    return Math.min(...values);
  }

  range() {
    this.assertColumnTypeNumber('range');

    return this.max() - this.min();
  }

  countAll() {
    return this.dataViewManager.rows.length;
  }

  countValues() {
    return this.getColValuesAsString(true).length;
  }

  countUniqueValues() {
    return [...new Set(this.getColValuesAsString(true))].length;
  }

  countEmpty() {
    return this.countAll() - this.getColValuesAsString(true).length;
  }

  countNonEmpty() {
    const nonEmpty = this.getColValuesAsString().filter(
      v => v.trim() !== ''
    ).length;
    return this.countAll() - nonEmpty;
  }

  percentEmpty() {
    return this.countEmpty() / this.countAll();
  }

  percentNonEmpty() {
    return 1.0 - this.percentEmpty();
  }

  private isColumnTypeNumber() {
    return this.column.type === 'number';
  }

  private assertColumnTypeNumber(fnName: string) {
    assertEquals(
      this.isColumnTypeNumber(),
      true,
      `${fnName} should only be used in column of type Number`
    );
  }

  private getColValuesAsString(noEmpty = false) {
    const val = this.dataViewManager.rows.map(rId => {
      return this.column.getStringValue(rId);
    });
    return noEmpty ? val.filter(v => v.trim() !== '') : val;
  }

  private getColValuesAsNumber() {
    return this.dataViewManager.rows
      .map(rId => {
        return parseInt(this.column.getStringValue(rId));
      })
      .filter(n => !isNaN(n));
  }

  // private _getColValuesAsNumber() {}
}
