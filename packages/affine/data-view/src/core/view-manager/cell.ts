import { computed, type ReadonlySignal } from '@preact/signals-core';

import type { Property } from './property.js';
import type { Row } from './row.js';
import type { SingleView } from './single-view.js';

export interface Cell<
  Value = unknown,
  Data extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly rowId: string;
  readonly view: SingleView;
  readonly row: Row;
  readonly propertyId: string;
  readonly property: Property<Value, Data>;
  readonly isEmpty$: ReadonlySignal<boolean>;
  readonly stringValue$: ReadonlySignal<string>;
  readonly jsonValue$: ReadonlySignal<unknown>;

  readonly value$: ReadonlySignal<Value | undefined>;
  valueSet(value: Value | undefined): void;
}

export class CellBase<
  Value = unknown,
  Data extends Record<string, unknown> = Record<string, unknown>,
> implements Cell<Value, Data>
{
  meta$ = computed(() => {
    return this.view.manager.dataSource.propertyMetaGet(
      this.property.type$.value
    );
  });

  value$ = computed(() => {
    return this.view.manager.dataSource.cellValueGet(
      this.rowId,
      this.propertyId
    ) as Value;
  });

  isEmpty$: ReadonlySignal<boolean> = computed(() => {
    return this.meta$.value.config.isEmpty({
      value: this.value$.value,
      dataSource: this.view.manager.dataSource,
    });
  });

  jsonValue$: ReadonlySignal<unknown> = computed(() => {
    return this.view.cellJsonValueGet(this.rowId, this.propertyId);
  });

  property$ = computed(() => {
    return this.view.propertyGet(this.propertyId) as Property<Value, Data>;
  });

  stringValue$: ReadonlySignal<string> = computed(() => {
    return this.view.cellStringValueGet(this.rowId, this.propertyId)!;
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

  valueSet(value: unknown | undefined): void {
    this.view.manager.dataSource.cellValueChange(
      this.rowId,
      this.propertyId,
      value
    );
  }
}
