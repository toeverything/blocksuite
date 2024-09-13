import { computed, type ReadonlySignal } from '@preact/signals-core';

import type { Column } from './column.js';
import type { Row } from './row.js';
import type { SingleView } from './single-view.js';

export interface Cell<
  Value = unknown,
  Data extends Record<string, unknown> = Record<string, unknown>,
> {
  view: SingleView;

  columnId: string;
  column: Column<Value, Data>;

  rowId: string;
  row: Row;

  isEmpty$: ReadonlySignal<boolean>;
  value$: ReadonlySignal<Value | undefined>;
  stringValue$: ReadonlySignal<string>;
  jsonValue$: ReadonlySignal<unknown>;

  setValue(value: Value | undefined): void;

  getExtra(): unknown;
}

export class CellBase<
  Value = unknown,
  Data extends Record<string, unknown> = Record<string, unknown>,
> implements Cell<Value, Data>
{
  column$ = computed(() => {
    return this.view.columnGet(this.columnId) as Column<Value, Data>;
  });

  isEmpty$: ReadonlySignal<boolean> = computed(() => {
    return this.meta$.value.config.isEmpty(this.value$.value);
  });

  jsonValue$: ReadonlySignal<unknown> = computed(() => {
    return this.view.cellGetJsonValue(this.rowId, this.columnId);
  });

  meta$ = computed(() => {
    return this.view.viewManager.dataSource.getPropertyMeta(
      this.column.type$.value
    );
  });

  stringValue$: ReadonlySignal<string> = computed(() => {
    return this.view.cellGetStringValue(this.rowId, this.columnId)!;
  });

  value$ = computed(() => {
    return this.view.viewManager.dataSource.cellGetValue(
      this.rowId,
      this.columnId
    ) as Value;
  });

  get column(): Column<Value, Data> {
    return this.column$.value;
  }

  get row(): Row {
    return this.view.rowGet(this.rowId);
  }

  constructor(
    public view: SingleView,
    public columnId: string,
    public rowId: string
  ) {}

  getExtra(): unknown {
    return undefined;
  }

  setValue(value: unknown | undefined): void {
    this.view.viewManager.dataSource.cellChangeValue(
      this.rowId,
      this.columnId,
      value
    );
  }
}
