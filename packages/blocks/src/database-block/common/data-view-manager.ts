import { Slot } from '@blocksuite/global/utils';

import type { DataSource } from '../../__internal__/datasource/base.js';
import type { UniComponent } from '../../components/uni-component/uni-component.js';
import type { TType } from '../logical/typesystem.js';
import type { ColumnDataUpdater, InsertPosition } from '../types.js';
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

  get rows(): string[];

  cellGetValue(rowId: string, columnId: string): unknown;

  cellGetRenderValue(rowId: string, columnId: string): unknown;

  cellGetJsonValue(rowId: string, columnId: string): unknown;

  cellGetStringValue(rowId: string, columnId: string): string;

  cellSetValueFromString(
    columnId: string,
    value: string
  ): { value: unknown; data?: Record<string, unknown> };

  cellUpdateRenderValue(rowId: string, columnId: string, value: unknown): void;

  cellUpdateValue(rowId: string, columnId: string, value: unknown): void;

  rowDelete(ids: string[]): void;

  rowAdd(insertPosition: InsertPosition): string;

  columnAdd(toAfterOfColumn: InsertPosition): void;

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
}

export interface DataViewColumnManager<
  Value = unknown,
  Data extends Record<string, unknown> = Record<string, unknown>
> {
  get id(): string;

  get index(): number;

  get type(): string;

  get name(): string;

  get hide(): boolean;

  get data(): Data;

  get readonly(): boolean;

  get renderer(): CellRenderer;

  get isFirst(): boolean;

  get isLast(): boolean;

  getStringValue(rowId: string): string;

  getJsonValue(rowId: string): unknown;

  getValue(rowId: string): Value | undefined;

  setValue(rowId: string, value: Value | undefined): void;

  updateData(updater: ColumnDataUpdater<Data>): void;

  updateHide(hide: boolean): void;

  updateName(name: string): void;

  get updateType(): undefined | ((type: string) => void);

  get delete(): undefined | (() => void);

  get duplicate(): undefined | (() => void);

  get icon(): UniComponent | undefined;

  /**
   * @deprecated
   */
  captureSync(): void;
}

export abstract class BaseDataViewManager implements DataViewManager {
  private searchString = '';

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

  public columnAdd(toAfterOfColumn: InsertPosition): void {
    this.dataSource.propertyAdd(toAfterOfColumn);
  }

  public columnDelete(columnId: string): void {
    this.dataSource.propertyDelete(columnId);
  }

  public columnDuplicate(columnId: string): void {
    this.dataSource.propertyDuplicate(columnId);
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

  public columnGetHide(columnId: string): boolean {
    return false;
  }

  public columnGetIdByIndex(index: number): string {
    return this.columns[index];
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

  public columnUpdateHide(columnId: string, hide: boolean): void {
    //TODO
  }

  public columnUpdateName(columnId: string, name: string): void {
    this.dataSource.propertyChangeName(columnId, name);
  }

  public columnUpdateType(columnId: string, type: string): void {
    this.dataSource.propertyChangeType(columnId, type);
  }

  public abstract get columns(): string[];

  public rowAdd(insertPosition: InsertPosition): string {
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
}

export abstract class BaseDataViewColumnManager
  implements DataViewColumnManager
{
  protected constructor(
    protected propertyId: string,
    public viewManager: DataViewManager
  ) {}

  get index(): number {
    return this.viewManager.columnGetIndex(this.id);
  }

  get data(): Record<string, unknown> {
    return this.viewManager.columnGetData(this.id);
  }

  get hide(): boolean {
    return this.viewManager.columnGetHide(this.id);
  }

  get id(): string {
    return this.propertyId;
  }

  get isFirst(): boolean {
    return this.viewManager.columnGetIndex(this.id) === 0;
  }

  get isLast(): boolean {
    return (
      this.viewManager.columnGetIndex(this.id) ===
      this.viewManager.columnManagerList.length - 1
    );
  }

  get name(): string {
    return this.viewManager.columnGetName(this.id);
  }

  get renderer(): CellRenderer {
    return columnRenderer.get(this.type).cellRenderer;
  }

  get type(): string {
    return this.viewManager.columnGetType(this.id);
  }

  getValue(rowId: string): unknown | undefined {
    return this.viewManager.cellGetRenderValue(rowId, this.id);
  }

  setValue(rowId: string, value: unknown | undefined): void {
    this.viewManager.cellUpdateRenderValue(rowId, this.id, value);
  }

  updateData(updater: ColumnDataUpdater): void {
    const data = this.viewManager.columnGetData(this.id);
    this.viewManager.columnUpdateData(this.id, { ...data, ...updater(data) });
  }

  updateHide(hide: boolean): void {
    // TODO
  }

  updateName(name: string): void {
    this.viewManager.columnUpdateName(this.id, name);
  }

  get delete(): (() => void) | undefined {
    return () => this.viewManager.columnDelete(this.id);
  }

  get duplicate(): (() => void) | undefined {
    return () => this.viewManager.columnDuplicate(this.id);
  }

  get updateType(): undefined | ((type: string) => void) {
    return type => this.viewManager.columnUpdateType(this.id, type);
  }

  get readonly(): boolean {
    return false;
  }

  captureSync(): void {
    this.viewManager.captureSync();
  }

  getJsonValue(rowId: string): unknown {
    return this.viewManager.cellGetJsonValue(rowId, this.id);
  }

  getStringValue(rowId: string): string {
    return this.viewManager.cellGetStringValue(rowId, this.id);
  }

  setValueFromString(value: string) {
    const result = this.viewManager.cellSetValueFromString(this.id, value);

    if (result.data) {
      this.viewManager.columnUpdateData(this.id, result.data);
    }
    return result.value;
  }

  public get icon(): UniComponent | undefined {
    if (!this.type) return undefined;
    return this.viewManager.getIcon(this.type);
  }
}
