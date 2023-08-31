import type { Disposable } from '@blocksuite/global/utils';
import { Slot } from '@blocksuite/global/utils';

import type {
  DataSource,
  DetailSlots,
} from '../../__internal__/datasource/base.js';
import type { UniComponent } from '../../components/uni-component/uni-component.js';
import type { TType } from '../logical/typesystem.js';
import type { ColumnDataUpdater, InsertPosition } from '../types.js';
import type { FilterGroup, Variable } from './ast.js';
import type {
  CellRenderer,
  ColumnConfig,
  ColumnConfigManager,
} from './columns/manager.js';
import { columnManager } from './columns/manager.js';
import { columnRenderer } from './columns/renderer.js';

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

  filterSetVisible(visible: boolean): void;

  get vars(): Variable[];

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

  rowAdd(insertPosition: InsertPosition): string;

  columnAdd(toAfterOfColumn: InsertPosition, type?: string): string;

  columnDelete(columnId: string): void;

  columnDuplicate(columnId: string): void;

  columnGet(columnId: string): DataViewColumnManager;

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

  get allColumnConfig(): ColumnConfig[];

  get columnConfigManager(): ColumnConfigManager;

  getIcon(type: string): UniComponent | undefined;

  /**
   * @deprecated
   */
  captureSync(): void;

  slots: {
    update: Slot;
  };

  onCellUpdate(
    rowId: string,
    columnId: string,
    callback: () => void
  ): Disposable;

  columnMove(columnId: string, position: InsertPosition): void;

  deleteView(): void;

  get isDeleted(): boolean;

  get detailSlots(): DetailSlots;
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

  /**
   * @deprecated
   */
  captureSync(): void;
}

export abstract class BaseDataViewManager implements DataViewManager {
  private searchString = '';
  private _filterVisible = true;

  get rows(): string[] {
    return this.filteredRows(this.searchString);
  }

  protected constructor(protected dataSource: DataSource) {
    this.dataSource.slots.update.pipe(this.slots.update);
  }

  setSearch(str: string): void {
    this.searchString = str;
    this.slots.update.emit();
  }

  public abstract isShow(rowId: string): boolean;

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

  get columnManagerList(): ReturnType<this['columnGet']>[] {
    return this.columns.map(
      id => this.columnGet(id) as ReturnType<this['columnGet']>
    );
  }

  get readonly(): boolean {
    return false;
  }

  public slots = {
    update: new Slot(),
  };

  onCellUpdate(
    rowId: string,
    columnId: string,
    callback: () => void
  ): Disposable {
    return this.dataSource.onCellUpdate(rowId, columnId, callback);
  }

  public cellGetValue(rowId: string, columnId: string): unknown {
    return columnManager
      .getColumn(this.columnGetType(columnId))
      .formatValue(
        this.dataSource.cellGetValue(rowId, columnId),
        this.columnGetData(columnId)
      );
  }

  public cellGetJsonValue(rowId: string, columnId: string): unknown {
    return columnManager
      .getColumn(this.columnGetType(columnId))
      .toJson(
        this.dataSource.cellGetValue(rowId, columnId),
        this.columnGetData(columnId)
      );
  }

  public cellGetRenderValue(rowId: string, columnId: string): unknown {
    return this.dataSource.cellGetRenderValue(rowId, columnId);
  }

  public cellGetStringValue(rowId: string, columnId: string): string {
    return (
      columnManager
        .getColumn(this.columnGetType(columnId))
        .toString(
          this.dataSource.cellGetValue(rowId, columnId),
          this.columnGetData(columnId)
        ) ?? ''
    );
  }

  public cellGetExtra(rowId: string, columnId: string): unknown {
    return this.dataSource.cellGetExtra(rowId, columnId);
  }

  public cellSetValueFromString(columnId: string, cellData: string) {
    return (
      columnManager
        .getColumn(this.columnGetType(columnId))
        .fromString(cellData, this.columnGetData(columnId)) ?? ''
    );
  }

  public cellUpdateRenderValue(
    rowId: string,
    columnId: string,
    value: unknown
  ): void {
    this.dataSource.cellChangeValue(rowId, columnId, value);
  }

  public cellUpdateValue(
    rowId: string,
    columnId: string,
    value: unknown
  ): void {
    this.dataSource.cellChangeValue(rowId, columnId, value);
  }

  public columnAdd(position: InsertPosition, type?: string): string {
    const id = this.dataSource.propertyAdd(position, type);
    this.columnMove(id, position);
    return id;
  }

  public columnDelete(columnId: string): void {
    this.dataSource.propertyDelete(columnId);
  }

  public columnDuplicate(columnId: string): void {
    const id = this.dataSource.propertyDuplicate(columnId);
    this.columnMove(id, {
      before: false,
      id: columnId,
    });
  }

  public abstract columnGet(columnId: string): DataViewColumnManager;

  public columnGetData(columnId: string): Record<string, unknown> {
    return this.dataSource.propertyGetData(columnId);
  }

  public columnGetDataType(columnId: string): TType {
    return columnManager
      .getColumn(this.columnGetType(columnId))
      .dataType(this.columnGetData(columnId));
  }

  public abstract columnGetHide(columnId: string): boolean;

  public abstract columnUpdateHide(columnId: string, hide: boolean): void;

  public columnGetIdByIndex(index: number): string {
    return this.columns[index];
  }

  public columnGetReadonly(columnId: string): boolean {
    return this.dataSource.propertyGetReadonly(columnId);
  }

  public columnGetIndex(columnId: string): number {
    return this.columns.indexOf(columnId);
  }

  public columnGetName(columnId: string): string {
    return this.dataSource.propertyGetName(columnId);
  }

  public columnGetNextColumn(
    columnId: string
  ): DataViewColumnManager | undefined {
    return this.columnGet(
      this.columnGetIdByIndex(this.columnGetIndex(columnId) + 1)
    );
  }

  public columnGetPreColumn(
    columnId: string
  ): DataViewColumnManager | undefined {
    return this.columnGet(
      this.columnGetIdByIndex(this.columnGetIndex(columnId) - 1)
    );
  }

  public columnGetType(columnId: string): string {
    return this.dataSource.propertyGetType(columnId);
  }

  public columnUpdateData(
    columnId: string,
    data: Record<string, unknown>
  ): void {
    this.dataSource.propertyChangeData(columnId, data);
  }

  public columnUpdateName(columnId: string, name: string): void {
    this.dataSource.propertyChangeName(columnId, name);
  }

  public columnUpdateType(columnId: string, type: string): void {
    this.dataSource.propertyChangeType(columnId, type);
  }

  public abstract get columns(): string[];

  public abstract get detailColumns(): string[];

  public abstract get columnsWithoutFilter(): string[];

  public rowAdd(insertPosition: InsertPosition | number): string {
    return this.dataSource.rowAdd(insertPosition);
  }

  public rowDelete(ids: string[]): void {
    this.dataSource.rowDelete(ids);
  }

  public captureSync(): void {
    this.dataSource.captureSync();
  }

  public abstract get id(): string;

  public abstract get type(): string;

  public get allColumnConfig(): ColumnConfig[] {
    return this.dataSource.allPropertyConfig;
  }

  public get columnConfigManager(): ColumnConfigManager {
    return this.dataSource.columnConfigManager;
  }

  public getIcon(type: string): UniComponent | undefined {
    return columnRenderer.get(type).icon;
  }

  abstract columnMove(columnId: string, position: InsertPosition): void;

  public abstract deleteView(): void;

  public abstract get isDeleted(): boolean;

  public get detailSlots(): DetailSlots {
    return this.dataSource.detailSlots;
  }

  abstract get filter(): FilterGroup;

  abstract updateFilter(filter: FilterGroup): void;

  get vars(): Variable[] {
    return this.columnsWithoutFilter.map(id => {
      const v = this.columnGet(id);
      return {
        id: v.id,
        name: v.name,
        type: columnManager.getColumn(v.type).dataType(v.data),
        icon: v.icon,
      };
    });
  }

  filterSetVisible(visible: boolean): void {
    this._filterVisible = visible;
    this.slots.update.emit();
  }

  get filterVisible(): boolean {
    return this._filterVisible;
  }
}

export abstract class BaseDataViewColumnManager
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
    return columnRenderer.get(this.type).cellRenderer;
  }

  get detailRenderer(): CellRenderer {
    return columnRenderer.get(this.type).detailCellRenderer ?? this.renderer;
  }

  get type(): string {
    return this.dataViewManager.columnGetType(this.id);
  }

  get dataType(): TType {
    return columnManager.getColumn(this.type).dataType(this.data);
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

  captureSync(): void {
    this.dataViewManager.captureSync();
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

  public get icon(): UniComponent | undefined {
    if (!this.type) return undefined;
    return this.dataViewManager.getIcon(this.type);
  }

  onCellUpdate(rowId: string, callback: () => void): Disposable {
    return this.dataViewManager.onCellUpdate(rowId, this.id, callback);
  }
}
