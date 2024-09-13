import { computed, type ReadonlySignal } from '@preact/signals-core';

import type { CellRenderer } from '../column/index.js';
import type { TType } from '../logical/typesystem.js';
import type { ColumnDataUpdater } from '../types.js';
import type { UniComponent } from '../utils/uni-component/index.js';
import type { Cell } from './cell.js';
import type { SingleView } from './single-view.js';

export interface Column<
  Value = unknown,
  Data extends Record<string, unknown> = Record<string, unknown>,
> {
  get view(): SingleView;

  get id(): string;

  get index(): number;

  type$: ReadonlySignal<string>;

  dataType$: ReadonlySignal<TType>;

  name$: ReadonlySignal<string>;

  hide$: ReadonlySignal<boolean>;

  cells$: ReadonlySignal<Cell[]>;

  data$: ReadonlySignal<Data>;

  readonly$: ReadonlySignal<boolean>;

  renderer$: ReadonlySignal<CellRenderer | undefined>;

  detailRenderer$: ReadonlySignal<CellRenderer | undefined>;

  get isFirst(): boolean;

  get isLast(): boolean;

  cellGet(rowId: string): Cell<Value>;

  getStringValue(rowId: string): string;

  getValue(rowId: string): Value | undefined;

  setValue(rowId: string, value: Value | undefined): void;

  setValueFromString(rowId: string, value: string): void;

  updateData(updater: ColumnDataUpdater<Data>): void;

  updateHide(hide: boolean): void;

  updateName(name: string): void;

  get updateType(): undefined | ((type: string) => void);

  get delete(): undefined | (() => void);

  get duplicate(): undefined | (() => void);

  get icon(): UniComponent | undefined;
}

export abstract class ColumnBase<
  Value = unknown,
  Data extends Record<string, unknown> = Record<string, unknown>,
> implements Column<Value, Data>
{
  cells$ = computed(() => {
    return this.view.rows$.value.map(id => this.cellGet(id));
  });

  data$ = computed(() => {
    return this.view.columnGetData(this.id) as Data;
  });

  dataType$ = computed(() => {
    return this.view.columnGetDataType(this.id)!;
  });

  detailRenderer$ = computed(() => {
    return (
      this.view.columnGetMeta(this.type$.value)?.renderer.detailCellRenderer ??
      this.renderer$.value
    );
  });

  hide$ = computed(() => {
    return this.view.columnGetHide(this.id);
  });

  name$ = computed(() => {
    return this.view.columnGetName(this.id);
  });

  readonly$ = computed(() => {
    return this.view.readonly$.value || this.view.columnGetReadonly(this.id);
  });

  renderer$ = computed(() => {
    return this.view.columnGetMeta(this.type$.value)?.renderer.cellRenderer;
  });

  type$ = computed(() => {
    return this.view.columnGetType(this.id)!;
  });

  get delete(): (() => void) | undefined {
    return () => this.view.columnDelete(this.id);
  }

  get duplicate(): (() => void) | undefined {
    return () => this.view.columnDuplicate(this.id);
  }

  get icon(): UniComponent | undefined {
    if (!this.type$.value) return undefined;
    return this.view.getIcon(this.type$.value);
  }

  get id(): string {
    return this.columnId;
  }

  get index(): number {
    return this.view.columnGetIndex(this.id);
  }

  get isFirst(): boolean {
    return this.view.columnGetIndex(this.id) === 0;
  }

  get isLast(): boolean {
    return (
      this.view.columnGetIndex(this.id) ===
      this.view.columnManagerList$.value.length - 1
    );
  }

  get updateType(): undefined | ((type: string) => void) {
    return type => this.view.columnUpdateType(this.id, type);
  }

  constructor(
    public view: SingleView,
    public columnId: string
  ) {}

  cellGet(rowId: string): Cell<Value> {
    return this.view.cellGet(rowId, this.id) as Cell<Value>;
  }

  getStringValue(rowId: string): string {
    return this.cellGet(rowId).stringValue$.value;
  }

  getValue(rowId: string): Value | undefined {
    return this.cellGet(rowId).value$.value;
  }

  setValue(rowId: string, value: Value | undefined): void {
    return this.cellGet(rowId).setValue(value);
  }

  setValueFromString(rowId: string, value: string): void {
    const data = this.view.columnParseValueFromString(this.id, value);
    if (!data) {
      return;
    }
    if (data.data) {
      this.updateData(() => data.data as Data);
    }
    this.setValue(rowId, data.value as Value);
  }

  updateData(updater: ColumnDataUpdater<Data>): void {
    const data = this.data$.value;
    this.view.columnUpdateData(this.id, {
      ...data,
      ...updater(data),
    });
  }

  updateHide(hide: boolean): void {
    this.view.columnUpdateHide(this.id, hide);
  }

  updateName(name: string): void {
    this.view.columnUpdateName(this.id, name);
  }
}
