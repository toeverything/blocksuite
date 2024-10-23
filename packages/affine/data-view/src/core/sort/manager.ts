import { computed, type ReadonlySignal } from '@preact/signals-core';

import type { SingleView } from '../view-manager/index.js';
import type { Sort, SortBy } from './types.js';

import { TableSingleView } from '../../view-presets/index.js';
import { evalSort } from './eval.js';

export type SortableView = TableSingleView;

export class SortManager {
  hasSort$ = computed(() => (this.sort$.value?.sortBy?.length ?? 0) > 0);

  setSortList = (sortList: SortBy[]) => {
    this.ops.setSortList({
      manuallySort: [],
      ...this.sort$.value,
      sortBy: sortList,
    });
  };

  sort = (rows: string[]) => {
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
  };

  sortList$ = computed(() => this.sort$.value?.sortBy ?? []);

  constructor(
    private sort$: ReadonlySignal<Sort | undefined>,
    private view: SingleView,
    private ops: {
      setSortList: (sortList: Sort) => void;
    }
  ) {}

  static canSort(view: SingleView): view is SortableView {
    return view instanceof TableSingleView;
  }
}
