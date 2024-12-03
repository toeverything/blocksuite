import { computed, type ReadonlySignal } from '@preact/signals-core';

import type { SingleView } from './single-view.js';

import { type Cell, CellBase } from './cell.js';

export interface Row {
  readonly cells$: ReadonlySignal<Cell[]>;
  readonly rowId: string;
}

export class RowBase implements Row {
  cells$ = computed(() => {
    return this.singleView.propertyIds$.value.map(propertyId => {
      return new CellBase(this.singleView, propertyId, this.rowId);
    });
  });

  constructor(
    readonly singleView: SingleView,
    readonly rowId: string
  ) {}
}
