import { type ReadonlySignal, batch, computed } from '@lit-labs/preact-signals';

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

  get type(): string;

  get dataType(): TType;

  get name(): string;

  get hide(): boolean;

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
  data$ = computed(() => {
    return this.view.columnGetData(this.id) as Data;
  });

  detailRenderer$ = computed(() => {
    return (
      this.view.columnGetMeta(this.type)?.renderer.detailCellRenderer ??
      this.renderer$.value
    );
  });

  readonly$ = computed(() => {
    return this.view.readonly$.value || this.view.columnGetReadonly(this.id);
  });

  renderer$ = computed(() => {
    return this.view.columnGetMeta(this.type)?.renderer.cellRenderer;
  });

  constructor(
    public view: SingleView,
    public columnId: string
  ) {}

  cellGet(rowId: string): Cell<Value, Data> {
    return this.view.cellGet(rowId, this.id) as Cell<Value, Data>;
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
    batch(() => {
      if (data.data) {
        this.updateData(() => data.data as Data);
      }
      this.setValue(rowId, data.value as Value);
    });
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

  get dataType(): TType {
    return this.view.columnGetDataType(this.id)!;
  }

  get delete(): (() => void) | undefined {
    return () => this.view.columnDelete(this.id);
  }

  get duplicate(): (() => void) | undefined {
    return () => this.view.columnDuplicate(this.id);
  }

  get hide(): boolean {
    return this.view.columnGetHide(this.id);
  }

  get icon(): UniComponent | undefined {
    if (!this.type) return undefined;
    return this.view.getIcon(this.type);
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

  get name(): string {
    return this.view.columnGetName(this.id);
  }

  get type(): string {
    return this.view.columnGetType(this.id)!;
  }

  get updateType(): undefined | ((type: string) => void) {
    return type => this.view.columnUpdateType(this.id, type);
  }
}
