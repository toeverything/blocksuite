import { assertExists, type Disposable, Slot } from '@blocksuite/global/utils';

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
  get id(): string;

  get type(): string;

  get readonly(): boolean;

  get columnManagerList(): DataViewColumnManager[];

  get columns(): string[];

  get detailColumns(): string[];

  get columnsWithoutFilter(): string[];

  get rows(): string[];

  get filter(): FilterGroup;

  get filterVisible(): boolean;

  get vars(): Variable[];

  get allColumnConfig(): ColumnConfig[];

  get isDeleted(): boolean;

  get detailSlots(): DetailSlots;

  slots: {
    update: Slot<{
      viewId: string;
    }>;
  };

  filterSetVisible(visible: boolean): void;

  updateFilter(filter: FilterGroup): void;

  cellGetValue(rowId: string, columnId: string): unknown;

  cellGetRenderValue(rowId: string, columnId: string): unknown;

  cellGetJsonValue(rowId: string, columnId: string): unknown;

  cellGetStringValue(rowId: string, columnId: string): string;

  cellGetExtra(rowId: string, columnId: string): unknown | undefined;

  cellSetValueFromString(
    columnId: string,
    value: string
  ): {
    value: unknown;
    data?: Record<string, unknown>;
  };

  cellUpdateRenderValue(rowId: string, columnId: string, value: unknown): void;

  cellUpdateValue(rowId: string, columnId: string, value: unknown): void;

  rowDelete(ids: string[]): void;

  rowAdd(insertPosition: InsertToPosition): string;

  columnAdd(toAfterOfColumn: InsertToPosition, type?: string): string;

  columnDelete(columnId: string): void;

  columnDuplicate(columnId: string): void;

  columnGet(columnId: string): DataViewColumnManager;

  columnGetMeta(type: string): ColumnMeta;

  columnGetPreColumn(columnId: string): DataViewColumnManager | undefined;

  columnGetNextColumn(columnId: string): DataViewColumnManager | undefined;

  columnGetName(columnId: string): string;

  columnGetType(columnId: string): string;

  columnGetHide(columnId: string): boolean;

  columnGetData(columnId: string): Record<string, unknown>;

  columnGetDataType(columnId: string): TType;

  columnGetIndex(columnId: string): number;

  columnGetIdByIndex(index: number): string;

  columnGetReadonly(columnId: string): boolean;

  columnUpdateName(columnId: string, name: string): void;

  columnUpdateHide(columnId: string, hide: boolean): void;

  columnUpdateType(columnId: string, type: string): void;

  columnUpdateData(columnId: string, data: Record<string, unknown>): void;

  getIcon(type: string): UniComponent | undefined;

  onCellUpdate(
    rowId: string,
    columnId: string,
    callback: () => void
  ): Disposable;

  columnMove(columnId: string, position: InsertToPosition): void;
  rowMove(rowId: string, position: InsertToPosition): void;

  duplicateView(): void;
  deleteView(): void;

  getContext<T>(key: DataViewContextKey<T>): T | undefined;
}

export interface DataViewColumnManager<
  Value = unknown,
  Data extends Record<string, unknown> = Record<string, unknown>,
> {
  get dataViewManager(): DataViewManager;

  get id(): string;

  get index(): number;

  get type(): string;

  get dataType(): TType;

  get name(): string;

  get hide(): boolean;

  get data(): Data;

  get readonly(): boolean;

  get renderer(): CellRenderer;

  get detailRenderer(): CellRenderer;

  get isFirst(): boolean;

  get isLast(): boolean;

  isEmpty(rowId: string): boolean;

  getStringValue(rowId: string): string;

  getJsonValue(rowId: string): unknown;

  getValue(rowId: string): Value | undefined;

  getExtra(rowId: string): unknown;

  setValue(rowId: string, value: Value | undefined): void;

  updateData(updater: ColumnDataUpdater<Data>): void;

  updateHide(hide: boolean): void;

  updateName(name: string): void;

  get updateType(): undefined | ((type: string) => void);

  get delete(): undefined | (() => void);

  get duplicate(): undefined | (() => void);

  get icon(): UniComponent | undefined;

  onCellUpdate(rowId: string, callback: () => void): Disposable;
}

export abstract class DataViewManagerBase<ViewData extends DataViewDataType>
  implements DataViewManager
{
  protected get dataSource(): DataSource {
    assertExists(this._dataSource, 'data source is not set');
    return this._dataSource;
  }

  protected get viewSource(): SingleViewSource<ViewData> {
    assertExists(this._viewSource, 'view source is not set');
    return this._viewSource;
  }

  get rows(): string[] {
    return this.filteredRows(this.searchString);
  }

  get columnManagerList(): ReturnType<this['columnGet']>[] {
    return this.columns.map(
      id => this.columnGet(id) as ReturnType<this['columnGet']>
    );
  }

  get readonly(): boolean {
    return false;
  }

  abstract get columns(): string[];

  abstract get detailColumns(): string[];

  abstract get columnsWithoutFilter(): string[];

  abstract get id(): string;

  abstract get type(): string;

  get allColumnConfig(): ColumnConfig[] {
    return this.dataSource.addPropertyConfigList;
  }

  abstract get isDeleted(): boolean;

  get detailSlots(): DetailSlots {
    return this.dataSource.detailSlots;
  }

  abstract get filter(): FilterGroup;

  get vars(): Variable[] {
    return this.columnsWithoutFilter.map(id => {
      const v = this.columnGet(id);
      const propertyMeta = this.dataSource.getPropertyMeta(v.type);
      return {
        id: v.id,
        name: v.name,
        type: propertyMeta.model.dataType(v.data),
        icon: v.icon,
      };
    });
  }

  get filterVisible(): boolean {
    return this._filterVisible ?? this.filter.conditions.length > 0;
  }

  private _viewSource?: SingleViewSource<ViewData>;

  private _dataSource?: DataSource;

  private searchString = '';

  private _filterVisible?: boolean;

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

  getContext<T>(key: DataViewContextKey<T>): T | undefined {
    return this.dataSource.getContext(key);
  }

  init(dataSource: DataSource, viewSource: SingleViewSource<ViewData>) {
    this._dataSource = dataSource;
    this._viewSource = viewSource;
    this._dataSource.slots.update
      .flatMap(() => ({ viewId: this.id }))
      .pipe(this.slots.update);
    this._viewSource.updateSlot.pipe(this.slots.update);
  }

  setSearch(str: string): void {
    this.searchString = str;
    this.slots.update.emit({ viewId: this.id });
  }

  abstract isShow(rowId: string): boolean;

  onCellUpdate(
    rowId: string,
    columnId: string,
    callback: () => void
  ): Disposable {
    return this.dataSource.onCellUpdate(rowId, columnId, callback);
  }

  cellGetValue(rowId: string, columnId: string): unknown {
    return this.dataSource
      .getPropertyMeta(this.columnGetType(columnId))
      .model.formatValue(
        this.dataSource.cellGetValue(rowId, columnId),
        this.columnGetData(columnId)
      );
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

  cellGetExtra(rowId: string, columnId: string): unknown {
    return this.dataSource.cellGetExtra(rowId, columnId);
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

  abstract columnGet(columnId: string): DataViewColumnManager;

  columnGetMeta(type: string): ColumnMeta {
    return this.dataSource.getPropertyMeta(type);
  }

  columnGetData(columnId: string): Record<string, unknown> {
    return this.dataSource.propertyGetData(columnId);
  }

  columnGetDataType(columnId: string): TType {
    return this.dataSource
      .getPropertyMeta(this.columnGetType(columnId))
      .model.dataType(this.columnGetData(columnId));
  }

  abstract columnGetHide(columnId: string): boolean;

  abstract columnUpdateHide(columnId: string, hide: boolean): void;

  columnGetIdByIndex(index: number): string {
    return this.columns[index];
  }

  columnGetReadonly(columnId: string): boolean {
    return this.dataSource.propertyGetReadonly(columnId);
  }

  columnGetIndex(columnId: string): number {
    return this.columns.indexOf(columnId);
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

  rowAdd(insertPosition: InsertToPosition | number): string {
    return this.dataSource.rowAdd(insertPosition);
  }

  rowDelete(ids: string[]): void {
    this.dataSource.rowDelete(ids);
  }

  getIcon(type: string): UniComponent | undefined {
    return this.dataSource.getPropertyMeta(type).renderer.icon;
  }

  abstract columnMove(columnId: string, position: InsertToPosition): void;

  abstract deleteView(): void;

  abstract updateFilter(filter: FilterGroup): void;

  filterSetVisible(visible: boolean): void {
    this._filterVisible = visible;
    this.slots.update.emit({ viewId: this.id });
  }

  rowMove(rowId: string, position: InsertToPosition): void {
    this.dataSource.rowMove(rowId, position);
  }

  abstract duplicateView(): void;
}

export abstract class DataViewColumnManagerBase
  implements DataViewColumnManager
{
  protected constructor(
    protected propertyId: string,
    public dataViewManager: DataViewManager
  ) {}

  get index(): number {
    return this.dataViewManager.columnGetIndex(this.id);
  }

  get data(): Record<string, unknown> {
    return this.dataViewManager.columnGetData(this.id);
  }

  get hide(): boolean {
    return this.dataViewManager.columnGetHide(this.id);
  }

  get id(): string {
    return this.propertyId;
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

  get renderer(): CellRenderer {
    return this.dataViewManager.columnGetMeta(this.type).renderer.cellRenderer;
  }

  get detailRenderer(): CellRenderer {
    return (
      this.dataViewManager.columnGetMeta(this.type).renderer
        .detailCellRenderer ?? this.renderer
    );
  }

  get type(): string {
    return this.dataViewManager.columnGetType(this.id);
  }

  get dataType(): TType {
    return this.dataViewManager.columnGetDataType(this.id);
  }

  isEmpty(rowId: string): boolean {
    return this.dataViewManager
      .columnGetMeta(this.type)
      .model.ops.isEmpty(this.getValue(rowId));
  }

  getValue(rowId: string): unknown | undefined {
    return this.dataViewManager.cellGetRenderValue(rowId, this.id);
  }

  getExtra(rowId: string): unknown {
    return this.dataViewManager.cellGetExtra(rowId, this.id);
  }

  setValue(rowId: string, value: unknown | undefined): void {
    this.dataViewManager.cellUpdateRenderValue(rowId, this.id, value);
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

  get delete(): (() => void) | undefined {
    return () => this.dataViewManager.columnDelete(this.id);
  }

  get duplicate(): (() => void) | undefined {
    return () => this.dataViewManager.columnDuplicate(this.id);
  }

  get updateType(): undefined | ((type: string) => void) {
    return type => this.dataViewManager.columnUpdateType(this.id, type);
  }

  get readonly(): boolean {
    return (
      this.dataViewManager.readonly ||
      this.dataViewManager.columnGetReadonly(this.id)
    );
  }

  getJsonValue(rowId: string): unknown {
    return this.dataViewManager.cellGetJsonValue(rowId, this.id);
  }

  getStringValue(rowId: string): string {
    return this.dataViewManager.cellGetStringValue(rowId, this.id);
  }

  setValueFromString(value: string) {
    const result = this.dataViewManager.cellSetValueFromString(this.id, value);

    if (result.data) {
      this.dataViewManager.columnUpdateData(this.id, result.data);
    }
    return result.value;
  }

  get icon(): UniComponent | undefined {
    if (!this.type) return undefined;
    return this.dataViewManager.getIcon(this.type);
  }

  onCellUpdate(rowId: string, callback: () => void): Disposable {
    return this.dataViewManager.onCellUpdate(rowId, this.id, callback);
  }
}
