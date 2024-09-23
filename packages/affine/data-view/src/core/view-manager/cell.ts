import { computed, type ReadonlySignal } from '@preact/signals-core';

import type { Property } from './property.js';
import type { Row } from './row.js';
import type { SingleView } from './single-view.js';

export interface Cell<
  Value = unknown,
  Data extends Record<string, unknown> = Record<string, unknown>,
> {
  view: SingleView;

  propertyId: string;
  property: Property<Value, Data>;

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
  isEmpty$: ReadonlySignal<boolean> = computed(() => {
    return this.meta$.value.config.isEmpty(this.value$.value);
  });

  jsonValue$: ReadonlySignal<unknown> = computed(() => {
    return this.view.cellJsonValueGet(this.rowId, this.propertyId);
  });

  meta$ = computed(() => {
    return this.view.manager.dataSource.propertyMetaGet(
      this.property.type$.value
    );
  });

  property$ = computed(() => {
    return this.view.propertyGet(this.propertyId) as Property<Value, Data>;
  });

  stringValue$: ReadonlySignal<string> = computed(() => {
    return this.view.cellStringValueGet(this.rowId, this.propertyId)!;
  });

  value$ = computed(() => {
    return this.view.manager.dataSource.cellValueGet(
      this.rowId,
      this.propertyId
    ) as Value;
  });

  get property(): Property<Value, Data> {
    return this.property$.value;
  }

  get row(): Row {
    return this.view.rowGet(this.rowId);
  }

  constructor(
    public view: SingleView,
    public propertyId: string,
    public rowId: string
  ) {}

  getExtra(): unknown {
    return undefined;
  }

  setValue(value: unknown | undefined): void {
    this.view.manager.dataSource.cellValueChange(
      this.rowId,
      this.propertyId,
      value
    );
  }
}
