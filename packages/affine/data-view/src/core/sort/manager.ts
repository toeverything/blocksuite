import type { ReadonlySignal } from '@preact/signals-core';

import type { SingleView } from '../view-manager/index.js';
import type { Sort } from './types.js';

import { evalSort } from './eval.js';

export class SortManager {
  constructor(
    private sort$: ReadonlySignal<Sort | undefined>,
    private view: SingleView,
    _ops: {
      changeSortList: (sortList: Sort) => void;
    }
  ) {}

  sort(rows: string[]) {
    if (!this.sort$.value) {
      return rows;
    }
    const compare = evalSort(this.sort$.value, this.view);
    if (!compare) {
      return rows;
    }
    const newRows = rows.slice();
    newRows.sort(compare);
    return newRows;
  }
}
