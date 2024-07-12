import { type Disposable, Slot, assertExists } from '@blocksuite/global/utils';

import type { ColumnMeta } from '../column/column-config.js';
import type { CellRenderer, ColumnConfig } from '../column/index.js';
import type { FilterGroup, Variable } from '../common/ast.js';
import type { DataSource, DetailSlots } from '../common/data-source/base.js';
import type { DataViewContextKey } from '../common/data-source/context.js';
import type { SingleViewSource } from '../common/index.js';
import type { TType } from '../logical/typesystem.js';
import type { ColumnDataUpdater, InsertToPosition } from '../types.js';
import type { UniComponent } from '../utils/uni-component/index.js';
import type { DataViewDataType } from './data-view.js';

export interface DataViewManager {
  cellGetExtra(rowId: string, columnId: string): undefined | unknown;

  cellGetJsonValue(rowId: string, columnId: string): unknown;

  cellGetRenderValue(rowId: string, columnId: string): unknown;

  cellGetStringValue(rowId: string, columnId: string): string;

  cellGetValue(rowId: string, columnId: string): unknown;

  cellSetValueFromString(
    columnId: string,
    value: string
  ): {
    data?: Record<string, unknown>;
    value: unknown;
  };

  cellUpdateRenderValue(rowId: string, columnId: string, value: unknown): void;

  cellUpdateValue(rowId: string, columnId: string, value: unknown): void;

  columnAdd(toAfterOfColumn: InsertToPosition, type?: string): string;

  columnDelete(columnId: string): void;

  columnDuplicate(columnId: string): void;

  columnGet(columnId: string): DataViewColumnManager;

  columnGetData(columnId: string): Record<string, unknown>;

  columnGetDataType(columnId: string): TType;

  columnGetHide(columnId: string): boolean;

  columnGetIdByIndex(index: number): string;

  columnGetIndex(columnId: string): number;

  columnGetMeta(type: string): ColumnMeta;

  columnGetName(columnId: string): string;

  columnGetNextColumn(columnId: string): DataViewColumnManager | undefined;

  columnGetPreColumn(columnId: string): DataViewColumnManager | undefined;

  columnGetReadonly(columnId: string): boolean;

  columnGetType(columnId: string): string;

  columnMove(columnId: string, position: InsertToPosition): void;

  columnUpdateData(columnId: string, data: Record<string, unknown>): void;

  columnUpdateHide(columnId: string, hide: boolean): void;

  columnUpdateName(columnId: string, name: string): void;

  columnUpdateType(columnId: string, type: string): void;

  deleteView(): void;

  duplicateView(): void;

  filterSetVisible(visible: boolean): void;

  get allColumnConfig(): ColumnConfig[];

  get columnManagerList(): DataViewColumnManager[];

  get columns(): string[];

  get columnsWithoutFilter(): string[];

  get detailColumns(): string[];

  get detailSlots(): DetailSlots;

  get filter(): FilterGroup;

  get filterVisible(): boolean;

  get id(): string;

  get isDeleted(): boolean;

  get readonly(): boolean;

  get rows(): string[];

  get type(): string;

  get vars(): Variable[];

  getContext<T>(key: DataViewContextKey<T>): T | undefined;

  getIcon(type: string): UniComponent | undefined;

  onCellUpdate(
    rowId: string,
    columnId: string,
    callback: () => void
  ): Disposable;

  rowAdd(insertPosition: InsertToPosition): string;
  rowDelete(ids: string[]): void;

  rowMove(rowId: string, position: InsertToPosition): void;
  slots: {
    update: Slot<{
      viewId: string;
    }>;
  };

  updateFilter(filter: FilterGroup): void;
}

export interface DataViewColumnManager<
  Value = unknown,
  Data extends Record<string, unknown> = Record<string, unknown>,
> {
  get data(): Data;

  get dataType(): TType;

  get dataViewManager(): DataViewManager;

  get delete(): (() => void) | undefined;

  get detailRenderer(): CellRenderer;

  get duplicate(): (() => void) | undefined;

  get hide(): boolean;

  get icon(): UniComponent | undefined;

  get id(): string;

  get index(): number;

  get isFirst(): boolean;

  get isLast(): boolean;

  get name(): string;

  get readonly(): boolean;

  get renderer(): CellRenderer;

  get type(): string;

  get updateType(): ((type: string) => void) | undefined;

  getExtra(rowId: string): unknown;

  getJsonValue(rowId: string): unknown;

  getStringValue(rowId: string): string;

  getValue(rowId: string): Value | undefined;

  isEmpty(rowId: string): boolean;

  onCellUpdate(rowId: string, callback: () => void): Disposable;

  setValue(rowId: string, value: Value | undefined): void;

  updateData(updater: ColumnDataUpdater<Data>): void;

  updateHide(hide: boolean): void;

  updateName(name: string): void;
}

export abstract class DataViewManagerBase<ViewData extends DataViewDataType>
  implements DataViewManager
{
  private _dataSource?: DataSource;

  private _filterVisible?: boolean;

  private _viewSource?: SingleViewSource<ViewData>;

  private searchString = '';

  slots = {
    update: new Slot<{
      viewId: string;
    }>(),
  };

  private filteredRows(searchString: string) {
    return this.dataSource.rows.filter(id => {
      if (searchString) {
        const containsSearchString = this.columns.some(columnId => {
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

  cellGetExtra(rowId: string, columnId: string): unknown {
    return this.dataSource.cellGetExtra(rowId, columnId);
  }

  cellGetJsonValue(rowId: string, columnId: string): unknown {
    return this.dataSource
      .getPropertyMeta(this.columnGetType(columnId))
      .model.toJson(
        this.dataSource.cellGetValue(rowId, columnId),
        this.columnGetData(columnId)
      );
  }

  cellGetRenderValue(rowId: string, columnId: string): unknown {
    return this.dataSource.cellGetRenderValue(rowId, columnId);
  }

  cellGetStringValue(rowId: string, columnId: string): string {
    return (
      this.dataSource
        .getPropertyMeta(this.columnGetType(columnId))
        .model.toString(
          this.dataSource.cellGetValue(rowId, columnId),
          this.columnGetData(columnId)
        ) ?? ''
    );
  }

  cellGetValue(rowId: string, columnId: string): unknown {
    return this.dataSource
      .getPropertyMeta(this.columnGetType(columnId))
      .model.formatValue(
        this.dataSource.cellGetValue(rowId, columnId),
        this.columnGetData(columnId)
      );
  }

  cellSetValueFromString(columnId: string, cellData: string) {
    return (
      this.dataSource
        .getPropertyMeta(this.columnGetType(columnId))
        .model.fromString(cellData, this.columnGetData(columnId)) ?? ''
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

  columnGetDataType(columnId: string): TType {
    return this.dataSource
      .getPropertyMeta(this.columnGetType(columnId))
      .model.dataType(this.columnGetData(columnId));
  }

  columnGetIdByIndex(index: number): string {
    return this.columns[index];
  }

  columnGetIndex(columnId: string): number {
    return this.columns.indexOf(columnId);
  }

  columnGetMeta(type: string): ColumnMeta {
    return this.dataSource.getPropertyMeta(type);
  }

  columnGetName(columnId: string): string {
    return this.dataSource.propertyGetName(columnId);
  }

  columnGetNextColumn(columnId: string): DataViewColumnManager | undefined {
    return this.columnGet(
      this.columnGetIdByIndex(this.columnGetIndex(columnId) + 1)
    );
  }

  columnGetPreColumn(columnId: string): DataViewColumnManager | undefined {
    return this.columnGet(
      this.columnGetIdByIndex(this.columnGetIndex(columnId) - 1)
    );
  }

  columnGetReadonly(columnId: string): boolean {
    return this.dataSource.propertyGetReadonly(columnId);
  }

  columnGetType(columnId: string): string {
    return this.dataSource.propertyGetType(columnId);
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

  filterSetVisible(visible: boolean): void {
    this._filterVisible = visible;
    this.slots.update.emit({ viewId: this.id });
  }

  getContext<T>(key: DataViewContextKey<T>): T | undefined {
    return this.dataSource.getContext(key);
  }

  getIcon(type: string): UniComponent | undefined {
    return this.dataSource.getPropertyMeta(type).renderer.icon;
  }

  init(dataSource: DataSource, viewSource: SingleViewSource<ViewData>) {
    this._dataSource = dataSource;
    this._viewSource = viewSource;
    this._dataSource.slots.update
      .flatMap(() => ({ viewId: this.id }))
      .pipe(this.slots.update);
    this._viewSource.updateSlot.pipe(this.slots.update);
  }

  onCellUpdate(
    rowId: string,
    columnId: string,
    callback: () => void
  ): Disposable {
    return this.dataSource.onCellUpdate(rowId, columnId, callback);
  }

  rowAdd(insertPosition: InsertToPosition | number): string {
    return this.dataSource.rowAdd(insertPosition);
  }

  rowDelete(ids: string[]): void {
    this.dataSource.rowDelete(ids);
  }

  rowMove(rowId: string, position: InsertToPosition): void {
    this.dataSource.rowMove(rowId, position);
  }

  setSearch(str: string): void {
    this.searchString = str;
    this.slots.update.emit({ viewId: this.id });
  }

  get allColumnConfig(): ColumnConfig[] {
    return this.dataSource.addPropertyConfigList;
  }

  get columnManagerList(): ReturnType<this['columnGet']>[] {
    return this.columns.map(
      id => this.columnGet(id) as ReturnType<this['columnGet']>
    );
  }

  protected get dataSource(): DataSource {
    assertExists(this._dataSource, 'data source is not set');
    return this._dataSource;
  }

  get detailSlots(): DetailSlots {
    return this.dataSource.detailSlots;
  }

  get filterVisible(): boolean {
    return this._filterVisible ?? this.filter.conditions.length > 0;
  }

  get readonly(): boolean {
    return false;
  }

  get rows(): string[] {
    return this.filteredRows(this.searchString);
  }

  get vars(): Variable[] {
    return this.columnsWithoutFilter.map(id => {
      const v = this.columnGet(id);
      const propertyMeta = this.dataSource.getPropertyMeta(v.type);
      return {
        icon: v.icon,
        id: v.id,
        name: v.name,
        type: propertyMeta.model.dataType(v.data),
      };
    });
  }

  protected get viewSource(): SingleViewSource<ViewData> {
    assertExists(this._viewSource, 'view source is not set');
    return this._viewSource;
  }

  abstract columnGet(columnId: string): DataViewColumnManager;

  abstract columnGetHide(columnId: string): boolean;

  abstract columnMove(columnId: string, position: InsertToPosition): void;

  abstract columnUpdateHide(columnId: string, hide: boolean): void;

  abstract get columns(): string[];

  abstract get columnsWithoutFilter(): string[];

  abstract deleteView(): void;

  abstract get detailColumns(): string[];

  abstract duplicateView(): void;

  abstract get filter(): FilterGroup;

  abstract get id(): string;

  abstract get isDeleted(): boolean;

  abstract isShow(rowId: string): boolean;

  abstract get type(): string;

  abstract updateFilter(filter: FilterGroup): void;
}

export abstract class DataViewColumnManagerBase
  implements DataViewColumnManager
{
  protected constructor(
    protected propertyId: string,
    public dataViewManager: DataViewManager
  ) {}

  getExtra(rowId: string): unknown {
    return this.dataViewManager.cellGetExtra(rowId, this.id);
  }

  getJsonValue(rowId: string): unknown {
    return this.dataViewManager.cellGetJsonValue(rowId, this.id);
  }

  getStringValue(rowId: string): string {
    return this.dataViewManager.cellGetStringValue(rowId, this.id);
  }

  getValue(rowId: string): undefined | unknown {
    return this.dataViewManager.cellGetRenderValue(rowId, this.id);
  }

  isEmpty(rowId: string): boolean {
    return this.dataViewManager
      .columnGetMeta(this.type)
      .model.ops.isEmpty(this.getValue(rowId));
  }

  onCellUpdate(rowId: string, callback: () => void): Disposable {
    return this.dataViewManager.onCellUpdate(rowId, this.id, callback);
  }

  setValue(rowId: string, value: undefined | unknown): void {
    this.dataViewManager.cellUpdateRenderValue(rowId, this.id, value);
  }

  setValueFromString(value: string) {
    const result = this.dataViewManager.cellSetValueFromString(this.id, value);

    if (result.data) {
      this.dataViewManager.columnUpdateData(this.id, result.data);
    }
    return result.value;
  }

  updateData(updater: ColumnDataUpdater): void {
    const data = this.dataViewManager.columnGetData(this.id);
    this.dataViewManager.columnUpdateData(this.id, {
      ...data,
      ...updater(data),
    });
  }

  updateHide(hide: boolean): void {
    this.dataViewManager.columnUpdateHide(this.id, hide);
  }

  updateName(name: string): void {
    this.dataViewManager.columnUpdateName(this.id, name);
  }

  get data(): Record<string, unknown> {
    return this.dataViewManager.columnGetData(this.id);
  }

  get dataType(): TType {
    return this.dataViewManager.columnGetDataType(this.id);
  }

  get delete(): (() => void) | undefined {
    return () => this.dataViewManager.columnDelete(this.id);
  }

  get detailRenderer(): CellRenderer {
    return (
      this.dataViewManager.columnGetMeta(this.type).renderer
        .detailCellRenderer ?? this.renderer
    );
  }

  get duplicate(): (() => void) | undefined {
    return () => this.dataViewManager.columnDuplicate(this.id);
  }

  get hide(): boolean {
    return this.dataViewManager.columnGetHide(this.id);
  }

  get icon(): UniComponent | undefined {
    if (!this.type) return undefined;
    return this.dataViewManager.getIcon(this.type);
  }

  get id(): string {
    return this.propertyId;
  }

  get index(): number {
    return this.dataViewManager.columnGetIndex(this.id);
  }

  get isFirst(): boolean {
    return this.dataViewManager.columnGetIndex(this.id) === 0;
  }

  get isLast(): boolean {
    return (
      this.dataViewManager.columnGetIndex(this.id) ===
      this.dataViewManager.columnManagerList.length - 1
    );
  }

  get name(): string {
    return this.dataViewManager.columnGetName(this.id);
  }

  get readonly(): boolean {
    return (
      this.dataViewManager.readonly ||
      this.dataViewManager.columnGetReadonly(this.id)
    );
  }

  get renderer(): CellRenderer {
    return this.dataViewManager.columnGetMeta(this.type).renderer.cellRenderer;
  }

  get type(): string {
    return this.dataViewManager.columnGetType(this.id);
  }

  get updateType(): ((type: string) => void) | undefined {
    return type => this.dataViewManager.columnUpdateType(this.id, type);
  }
}
