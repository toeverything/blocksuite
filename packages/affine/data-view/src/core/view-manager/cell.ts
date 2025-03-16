import { computed, type ReadonlySignal } from '@preact/signals-core';

import type { Property } from './property.js';
import type { Row } from './row.js';
import type { SingleView } from './single-view.js';

export interface Cell<
  RawValue = unknown,
  JsonValue = unknown,
  Data extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly rowId: string;
  readonly view: SingleView;
  readonly row: Row;
  readonly propertyId: string;
  readonly property: Property<RawValue, JsonValue, Data>;
  readonly isEmpty$: ReadonlySignal<boolean>;
  readonly stringValue$: ReadonlySignal<string>;
  readonly jsonValue$: ReadonlySignal<JsonValue>;

  readonly value$: ReadonlySignal<RawValue | undefined>;

  valueSet(value: RawValue | undefined): void;
}

export class CellBase<
  RawValue = unknown,
  JsonValue = unknown,
  Data extends Record<string, unknown> = Record<string, unknown>,
> implements Cell<RawValue, JsonValue, Data>
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
    ) as RawValue;
  });

  isEmpty$: ReadonlySignal<boolean> = computed(() => {
    return (
      this.meta$.value?.config.jsonValue.isEmpty({
        value: this.jsonValue$.value,
        dataSource: this.view.manager.dataSource,
      }) ?? true
    );
  });

  jsonValue$: ReadonlySignal<JsonValue> = computed(() => {
    return this.view.cellJsonValueGet(this.rowId, this.propertyId) as JsonValue;
  });

  property$ = computed(() => {
    return this.view.propertyGet(this.propertyId) as Property<
      RawValue,
      JsonValue,
      Data
    >;
  });

  stringValue$: ReadonlySignal<string> = computed(() => {
    return this.view.cellStringValueGet(this.rowId, this.propertyId)!;
  });

  get property(): Property<RawValue, JsonValue, Data> {
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

  valueSet(value: RawValue | undefined): void {
    this.view.manager.dataSource.cellValueChange(
      this.rowId,
      this.propertyId,
      value
    );
  }
}
