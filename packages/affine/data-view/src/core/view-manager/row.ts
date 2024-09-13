import { computed, type ReadonlySignal } from '@preact/signals-core';

import type { SingleView } from './single-view.js';

import { type Cell, CellBase } from './cell.js';

export interface Row {
  cells$: ReadonlySignal<Cell[]>;
  rowId: string;
}

export class RowBase implements Row {
  cells$ = computed(() => {
    return this.singleView.columns$.value.map(columnId => {
      return new CellBase(this.singleView, columnId, this.rowId);
    });
  });

  constructor(
    readonly singleView: SingleView,
    readonly rowId: string
  ) {}
}
