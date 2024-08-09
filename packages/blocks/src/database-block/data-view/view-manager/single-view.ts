import {
  type ReadonlySignal,
  computed,
  signal,
} from '@lit-labs/preact-signals';

import type { DatabaseFlags } from '../../types.js';
import type { ColumnConfig, ColumnMeta } from '../column/column-config.js';
import type { FilterGroup, Variable } from '../common/ast.js';
import type { DetailSlots } from '../common/data-source/base.js';
import type { DataViewContextKey } from '../common/data-source/context.js';
import type { TType } from '../logical/typesystem.js';
import type { InsertToPosition } from '../types.js';
import type { UniComponent } from '../utils/uni-component/index.js';
import type { DataViewDataType, ViewMeta } from '../view/data-view.js';
import type { Column } from './column.js';
import type { ViewManager } from './view-manager.js';

import { type Cell, CellBase } from './cell.js';
import { type Row, RowBase } from './row.js';

export type HeaderType = {
  titleColumn?: string;
  iconColumn?: string;
  imageColumn?: string;
};

export interface SingleView<
  ViewData extends DataViewDataType = DataViewDataType,
> {
  viewManager: ViewManager;
  viewMeta: ViewMeta;
  readonly$: ReadonlySignal<boolean>;

  delete(): void;
  duplicate(): void;
  name$: ReadonlySignal<string>;
  updateName(name: string): void;

  get id(): string;

  get type(): string;

  columns$: ReadonlySignal<string[]>;
  columnsWithoutFilter$: ReadonlySignal<string[]>;
  columnManagerList$: ReadonlySignal<Column[]>;
  detailColumns$: ReadonlySignal<string[]>;

  rows$: ReadonlySignal<string[]>;

  filter$: ReadonlySignal<FilterGroup>;
  filterVisible$: ReadonlySignal<boolean>;

  filterSetVisible(visible: boolean): void;

  updateFilter(filter: FilterGroup): void;

  vars$: ReadonlySignal<Variable[]>;

  get allColumnConfig(): ColumnConfig[];

  get detailSlots(): DetailSlots;

  featureFlags$: ReadonlySignal<DatabaseFlags>;

  cellGetValue(rowId: string, columnId: string): unknown;

  cellGetJsonValue(rowId: string, columnId: string): unknown;

  cellGetStringValue(rowId: string, columnId: string): string | undefined;

  columnParseValueFromString(
    columnId: string,
    value: string
  ):
    | {
        value: unknown;
        data?: Record<string, unknown>;
      }
    | undefined;

  cellUpdateRenderValue(rowId: string, columnId: string, value: unknown): void;

  cellUpdateValue(rowId: string, columnId: string, value: unknown): void;

  rowDelete(ids: string[]): void;

  rowAdd(insertPosition: InsertToPosition): string;

  rowGetPrev(rowId: string): string;

  rowGetNext(rowId: string): string;

  columnAdd(toAfterOfColumn: InsertToPosition, type?: string): string;

  columnDelete(columnId: string): void;

  columnDuplicate(columnId: string): void;

  columnGet(columnId: string): Column;

  columnGetMeta(type: string): ColumnMeta | undefined;

  columnGetPreColumn(columnId: string): Column | undefined;

  columnGetNextColumn(columnId: string): Column | undefined;

  columnGetName(columnId: string): string;

  columnGetType(columnId: string): string | undefined;

  columnGetHide(columnId: string): boolean;

  columnGetData(columnId: string): Record<string, unknown>;

  columnGetDataType(columnId: string): TType | undefined;

  columnGetIndex(columnId: string): number;

  columnGetIdByIndex(index: number): string;

  columnGetReadonly(columnId: string): boolean;

  columnUpdateName(columnId: string, name: string): void;

  columnUpdateHide(columnId: string, hide: boolean): void;

  columnUpdateType(columnId: string, type: string): void;

  columnUpdateData(columnId: string, data: Record<string, unknown>): void;

  getIcon(type: string): UniComponent | undefined;

  columnMove(columnId: string, position: InsertToPosition): void;

  rowMove(rowId: string, position: InsertToPosition): void;

  viewDataUpdate(updater: (viewData: ViewData) => Partial<ViewData>): void;

  viewData$: ReadonlySignal<ViewData | undefined>;

  getContext<T>(key: DataViewContextKey<T>): T | undefined;

  rowGet(rowId: string): Row;

  header$: ReadonlySignal<HeaderType>;

  cellGet(rowId: string, columnId: string): Cell;
}

export abstract class SingleViewBase<
  ViewData extends DataViewDataType = DataViewDataType,
> implements SingleView<ViewData>
{
  private _filterVisible$ = signal<boolean | undefined>(undefined);

  private searchString = signal('');

  columnManagerList$ = computed(() => {
    return this.columns$.value.map(
      id => this.columnGet(id) as ReturnType<this['columnGet']>
    );
  });

  filterVisible$ = computed(() => {
    return (
      this._filterVisible$.value ??
      (this.filter$.value?.conditions.length ?? 0) > 0
    );
  });

  name$: ReadonlySignal<string> = computed(() => {
    return this.viewData$.value?.name ?? '';
  });

  rows$ = computed(() => {
    return this.filteredRows(this.searchString.value);
  });

  vars$ = computed(() => {
    return this.columnsWithoutFilter$.value.map(id => {
      const v = this.columnGet(id);
      const propertyMeta = this.dataSource.getPropertyMeta(v.type);
      return {
        id: v.id,
        name: v.name,
        type: propertyMeta.model.dataType(v.data$.value),
        icon: v.icon,
      };
    });
  });

  viewData$ = computed(() => {
    return this.dataSource.viewDataGet(this.id) as ViewData | undefined;
  });

  constructor(
    public viewManager: ViewManager,
    public id: string
  ) {}

  private filteredRows(searchString: string): string[] {
    return this.dataSource.rows$.value.filter(id => {
      if (searchString) {
        const containsSearchString = this.columns$.value.some(columnId => {
          return this.cellGetStringValue(id, columnId)
            ?.toLowerCase()
            .includes(searchString?.toLowerCase());
        });
        if (!containsSearchString) {
          return false;
        }
      }
      return this.isShow(id);
    });
  }

  cellGet(rowId: string, columnId: string): Cell {
    return new CellBase(this, columnId, rowId);
  }

  cellGetJsonValue(rowId: string, columnId: string): unknown {
    const type = this.columnGetType(columnId);
    if (!type) {
      return;
    }
    return this.dataSource
      .getPropertyMeta(type)
      .model.toJson(
        this.dataSource.cellGetValue(rowId, columnId),
        this.columnGetData(columnId)
      );
  }

  cellGetStringValue(rowId: string, columnId: string): string | undefined {
    const type = this.columnGetType(columnId);
    if (!type) {
      return;
    }
    return (
      this.dataSource
        .getPropertyMeta(type)
        .model.toString(
          this.dataSource.cellGetValue(rowId, columnId),
          this.columnGetData(columnId)
        ) ?? ''
    );
  }

  cellGetValue(rowId: string, columnId: string): unknown {
    const type = this.columnGetType(columnId);
    if (!type) {
      return;
    }
    return this.dataSource
      .getPropertyMeta(type)
      .model.formatValue(
        this.dataSource.cellGetValue(rowId, columnId),
        this.columnGetData(columnId)
      );
  }

  cellUpdateRenderValue(rowId: string, columnId: string, value: unknown): void {
    this.dataSource.cellChangeValue(rowId, columnId, value);
  }

  cellUpdateValue(rowId: string, columnId: string, value: unknown): void {
    this.dataSource.cellChangeValue(rowId, columnId, value);
  }

  columnAdd(position: InsertToPosition, type?: string): string {
    const id = this.dataSource.propertyAdd(position, type);
    this.columnMove(id, position);
    return id;
  }

  columnDelete(columnId: string): void {
    this.dataSource.propertyDelete(columnId);
  }

  columnDuplicate(columnId: string): void {
    const id = this.dataSource.propertyDuplicate(columnId);
    this.columnMove(id, {
      before: false,
      id: columnId,
    });
  }

  columnGetData(columnId: string): Record<string, unknown> {
    return this.dataSource.propertyGetData(columnId);
  }

  columnGetDataType(columnId: string): TType | undefined {
    const type = this.columnGetType(columnId);
    if (!type) {
      return;
    }
    return this.dataSource
      .getPropertyMeta(type)
      .model.dataType(this.columnGetData(columnId));
  }

  columnGetIdByIndex(index: number): string {
    return this.columns$.value[index];
  }

  columnGetIndex(columnId: string): number {
    return this.columns$.value.indexOf(columnId);
  }

  columnGetMeta(type: string): ColumnMeta {
    return this.dataSource.getPropertyMeta(type);
  }

  columnGetName(columnId: string): string {
    return this.dataSource.propertyGetName(columnId);
  }

  columnGetNextColumn(columnId: string): Column | undefined {
    return this.columnGet(
      this.columnGetIdByIndex(this.columnGetIndex(columnId) + 1)
    );
  }

  columnGetPreColumn(columnId: string): Column | undefined {
    return this.columnGet(
      this.columnGetIdByIndex(this.columnGetIndex(columnId) - 1)
    );
  }

  columnGetReadonly(columnId: string): boolean {
    return this.dataSource.propertyGetReadonly(columnId);
  }

  columnGetType(columnId: string): string | undefined {
    return this.dataSource.propertyGetType(columnId);
  }

  columnParseValueFromString(columnId: string, cellData: string) {
    const type = this.columnGetType(columnId);
    if (!type) {
      return;
    }
    return (
      this.dataSource
        .getPropertyMeta(type)
        .model.fromString(cellData, this.columnGetData(columnId)) ?? ''
    );
  }

  columnUpdateData(columnId: string, data: Record<string, unknown>): void {
    this.dataSource.propertyChangeData(columnId, data);
  }

  columnUpdateName(columnId: string, name: string): void {
    this.dataSource.propertyChangeName(columnId, name);
  }

  columnUpdateType(columnId: string, type: string): void {
    this.dataSource.propertyChangeType(columnId, type);
  }

  delete(): void {
    this.viewManager.viewDelete(this.id);
  }

  duplicate(): void {
    this.viewManager.viewDuplicate(this.id);
  }

  filterSetVisible(visible: boolean): void {
    this._filterVisible$.value = visible;
  }

  getContext<T>(key: DataViewContextKey<T>): T | undefined {
    return this.dataSource.getContext(key);
  }

  getIcon(type: string): UniComponent | undefined {
    return this.dataSource.getPropertyMeta(type).renderer.icon;
  }

  rowAdd(insertPosition: InsertToPosition | number): string {
    return this.dataSource.rowAdd(insertPosition);
  }

  rowDelete(ids: string[]): void {
    this.dataSource.rowDelete(ids);
  }

  rowGet(rowId: string): Row {
    return new RowBase(this, rowId);
  }

  rowMove(rowId: string, position: InsertToPosition): void {
    this.dataSource.rowMove(rowId, position);
  }

  setSearch(str: string): void {
    this.searchString.value = str;
  }

  updateName(name: string): void {
    this.viewDataUpdate(() => {
      return {
        name,
      } as ViewData;
    });
  }

  viewDataUpdate(updater: (viewData: ViewData) => Partial<ViewData>): void {
    this.dataSource.viewDataUpdate(this.id, updater);
  }

  get allColumnConfig(): ColumnConfig[] {
    return this.dataSource.addPropertyConfigList;
  }

  protected get dataSource() {
    return this.viewManager.dataSource;
  }

  get detailSlots(): DetailSlots {
    return this.dataSource.detailSlots;
  }

  get featureFlags$() {
    return this.dataSource.featureFlags$;
  }

  get viewMeta() {
    return this.dataSource.viewMetaGet(this.type);
  }

  abstract columnGet(columnId: string): Column;

  abstract columnGetHide(columnId: string): boolean;

  abstract columnMove(columnId: string, position: InsertToPosition): void;

  abstract columnUpdateHide(columnId: string, hide: boolean): void;

  abstract columns$: ReadonlySignal<string[]>;

  abstract columnsWithoutFilter$: ReadonlySignal<string[]>;

  abstract detailColumns$: ReadonlySignal<string[]>;

  abstract filter$: ReadonlySignal<FilterGroup>;

  abstract header$: ReadonlySignal<HeaderType>;

  abstract isShow(rowId: string): boolean;

  abstract readonly$: ReadonlySignal<boolean>;

  abstract rowGetNext(rowId: string): string;

  abstract rowGetPrev(rowId: string): string;

  abstract get type(): string;

  abstract updateFilter(filter: FilterGroup): void;
}
