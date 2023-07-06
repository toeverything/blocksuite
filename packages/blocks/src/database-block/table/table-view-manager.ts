import { Slot } from '@blocksuite/store';

import type { FilterGroup } from '../common/ast.js';
import { columnManager } from '../common/column-manager.js';
import type { TableMixColumn, TableViewData } from '../common/view-manager.js';
import type { ColumnDataUpdater, InsertPosition } from '../database-model.js';
import { insertPositionToIndex } from '../database-model.js';
import { evalFilter } from '../logical/eval-filter.js';
import { registerInternalRenderer } from './components/column-type/index.js';
import { DEFAULT_COLUMN_WIDTH } from './consts.js';
import type { ColumnRenderer } from './register.js';
import type { SetValueOption } from './types.js';

const renderer = registerInternalRenderer();

export interface TableViewManager {
  get id(): string;

  get name(): string;

  get filter(): FilterGroup;

  setSearch(str: string): void;

  updateName(name: string): void;

  updateFilter(filter: FilterGroup): void;

  get readonly(): boolean;

  get columnManagerList(): ColumnManager[];

  get columns(): string[];

  get rows(): string[];

  cellGetRenderValue(rowId: string, columnId: string): unknown;

  cellGetFilterValue(rowId: string, columnId: string): unknown;

  cellGetStringValue(rowId: string, columnId: string): string;

  cellUpdateRenderValue(rowId: string, columnId: string, value: unknown): void;

  rowDelete(ids: string[]): void;

  rowAdd(insertPosition: InsertPosition): string;

  columnMove(columnId: string, toAfterOfColumn: InsertPosition): void;

  columnAdd(toAfterOfColumn: InsertPosition): void;

  columnDelete(columnId: string): void;

  columnDuplicate(columnId: string): void;

  columnGet(columnId: string): ColumnManager;

  columnGetPreColumn(columnId: string): ColumnManager | undefined;

  columnGetNextColumn(columnId: string): ColumnManager | undefined;

  columnGetWidth(columnId: string): number;

  columnGetName(columnId: string): string;

  columnGetType(columnId: string): string;

  columnGetHide(columnId: string): boolean;

  columnGetData(columnId: string): Record<string, unknown>;

  columnGetIndex(columnId: string): number;

  columnGetIdByIndex(index: number): string;

  columnUpdateWidth(columnId: string, width: number): void;

  columnUpdateName(columnId: string, name: string): void;

  columnUpdateHide(columnId: string, hide: boolean): void;

  columnUpdateType(columnId: string, type: string): void;

  columnUpdateData(columnId: string, data: Record<string, unknown>): void;

  deleteRow(ids: string[]): void;

  addRow(insertPosition: InsertPosition): string;

  moveColumn(column: string, toAfterOfColumn: InsertPosition): void;

  newColumn(toAfterOfColumn: InsertPosition): void;

  preColumn(id: string): TableMixColumn | undefined;

  nextColumn(id: string): TableMixColumn | undefined;

  slots: {
    update: Slot;
  };
}

export interface ColumnManager<
  Value = unknown,
  Data extends Record<string, unknown> = Record<string, unknown>
> {
  get id(): string;

  get index(): number;

  get type(): string;

  get name(): string;

  get width(): number;

  get hide(): boolean;

  get data(): Data;

  get readonly(): boolean;

  get renderer(): ColumnRenderer;

  get isFirst(): boolean;

  get isLast(): boolean;

  getStringValue(rowId: string): string;

  getFilterValue(rowId: string): unknown;

  getValue(rowId: string): Value | undefined;

  setValue(rowId: string, value: Value | undefined, ops?: SetValueOption): void;

  updateWidth(width: number): void;

  updateData(updater: ColumnDataUpdater<Data>): void;

  updateHide(hide: boolean): void;

  updateName(name: string): void;

  get updateType(): undefined | ((type: string) => void);

  get delete(): undefined | (() => void);

  get duplicate(): undefined | (() => void);

  /**
   * @deprecated
   */
  captureSync(): void;
}

export interface DataSource {
  properties: string[];
  rows: string[];
  cellGetValue: (rowId: string, propertyId: string) => unknown;
  cellChangeValue: (rowId: string, propertyId: string, value: unknown) => void;
  rowAdd: (insertPosition: InsertPosition) => string;
  rowDelete: (ids: string[]) => void;
  propertyGetName: (propertyId: string) => string;
  propertyGetType: (propertyId: string) => string;
  propertyGetData: (propertyId: string) => Record<string, unknown>;
  propertyChangeName: (propertyId: string, name: string) => void;
  propertyChangeType: (propertyId: string, type: string) => void;
  propertyChangeData: (
    propertyId: string,
    data: Record<string, unknown>
  ) => void;
  propertyAdd: (insertPosition: InsertPosition) => string;
  propertyDelete: (id: string) => void;
  propertyDuplicate: (columnId: string) => void;

  slots: {
    update: Slot;
  };
}

export class DatabaseTableViewManager implements TableViewManager {
  private searchString = '';

  get rows(): string[] {
    return this.filteredRows(this.searchString);
  }

  constructor(
    private getView: () => TableViewData,
    private updateView: (
      updater: (view: TableViewData) => Partial<TableViewData>
    ) => void,
    private dataSource: DataSource
  ) {
    this.dataSource.slots.update.pipe(this.slots.update);
  }

  setSearch(str: string): void {
    this.searchString = str;
    this.slots.update.emit();
  }

  private filteredRows(searchString: string) {
    return this.dataSource.rows.filter(id => {
      if (searchString) {
        const containsSearchString = this.columns.some(columnId => {
          return this.cellGetStringValue(id, columnId).includes(searchString);
        });
        if (!containsSearchString) {
          return false;
        }
      }
      if (this.filter.conditions.length) {
        const rowMap = Object.fromEntries(
          this.columnManagerList.map(column => [
            column.id,
            column.getFilterValue(id),
          ])
        );
        return evalFilter(this.filter, rowMap);
      }
      return true;
    });
  }

  get columnManagerList(): ColumnManager[] {
    return this.columns.map(id => this.columnGet(id));
  }

  get filter(): FilterGroup {
    return this.getView().filter;
  }

  get id() {
    return this.getView().id;
  }

  get name(): string {
    return this.getView().name;
  }

  get readonly(): boolean {
    return false;
  }

  updateFilter(filter: FilterGroup): void {
    this.updateView(() => {
      return {
        filter,
      };
    });
  }

  updateName(name: string): void {
    //
  }

  moveColumn(id: string, toAfterOfColumn: InsertPosition): void {
    this.updateView(view => {
      const columnIndex = view.columns.findIndex(v => v.id === id);
      if (columnIndex < 0) {
        return {};
      }
      const columns = [...view.columns];
      const [column] = columns.splice(columnIndex, 1);
      const index = insertPositionToIndex(toAfterOfColumn, columns);
      columns.splice(index, 0, column);
      return {
        columns,
      };
    });
  }

  newColumn(position: InsertPosition): void {
    const id = this.dataSource.propertyAdd(position);
    this.updateView(view => {
      const index = insertPositionToIndex(position, view.columns);
      const columns = [...view.columns];
      columns.splice(index, 0, {
        id,
        width: DEFAULT_COLUMN_WIDTH,
        hide: false,
      });
      return {
        columns,
      };
    });
  }

  nextColumn(id: string): ColumnManager | undefined {
    return this.columnManagerList[this.columnGetIndex(id) + 1];
  }

  preColumn(id: string): ColumnManager | undefined {
    return this.columnManagerList[this.columnGetIndex(id) - 1];
  }

  deleteRow(ids: string[]): void {
    this.dataSource.rowDelete(ids);
  }

  addRow(insertPosition: InsertPosition): string {
    return this.dataSource.rowAdd(insertPosition);
  }

  public slots = {
    update: new Slot(),
  };

  public cellGetFilterValue(rowId: string, columnId: string): unknown {
    return columnManager
      .getColumn(this.columnGetType(columnId))
      .toJson(
        this.cellGetRenderValue(rowId, columnId),
        this.columnGetData(columnId)
      );
  }

  public cellGetRenderValue(rowId: string, columnId: string): unknown {
    return this.dataSource.cellGetValue(rowId, columnId);
  }

  public cellGetStringValue(rowId: string, columnId: string): string {
    return (
      columnManager.toString(
        this.columnGetType(columnId),
        this.cellGetRenderValue(rowId, columnId),
        this.columnGetData(columnId)
      ) ?? ''
    );
  }

  public cellUpdateRenderValue(
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

  public columnGet(columnId: string): ColumnManager {
    return new DatabaseColumnManager(columnId, this);
  }

  public columnGetData(columnId: string): Record<string, unknown> {
    return this.dataSource.propertyGetData(columnId);
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

  public columnGetNextColumn(columnId: string): ColumnManager | undefined {
    return this.columnGet(
      this.columnGetIdByIndex(this.columnGetIndex(columnId) + 1)
    );
  }

  public columnGetPreColumn(columnId: string): ColumnManager | undefined {
    return this.columnGet(
      this.columnGetIdByIndex(this.columnGetIndex(columnId) - 1)
    );
  }

  public columnGetType(columnId: string): string {
    return this.dataSource.propertyGetType(columnId);
  }

  public columnGetWidth(columnId: string): number {
    return (
      this.getView().columns.find(v => v.id === columnId)?.width ??
      DEFAULT_COLUMN_WIDTH
    );
  }

  public columnMove(columnId: string, toAfterOfColumn: InsertPosition): void {
    this.updateView(view => {
      const columns = [...view.columns];
      const index = columns.findIndex(v => v.id === columnId);
      if (index < 0) {
        return {};
      }
      const [column] = columns.splice(index, 1);
      const toIndex = insertPositionToIndex(toAfterOfColumn, columns);
      columns.splice(toIndex, 0, column);
      return {
        columns,
      };
    });
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

  public columnUpdateWidth(columnId: string, width: number): void {
    this.updateView(view => {
      return {
        columns: view.columns.map(v =>
          v.id === columnId ? { ...v, width: v.width } : v
        ),
      };
    });
  }

  public get columns(): string[] {
    return this.getView().columns.map(v => v.id);
  }

  public rowAdd(insertPosition: InsertPosition): string {
    return this.dataSource.rowAdd(insertPosition);
  }

  public rowDelete(ids: string[]): void {
    this.dataSource.rowDelete(ids);
  }
}

export class DatabaseColumnManager implements ColumnManager {
  constructor(
    protected propertyId: string,
    protected viewManager: TableViewManager
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

  get renderer(): ColumnRenderer {
    return renderer.get(this.type);
  }

  get type(): string {
    return this.viewManager.columnGetType(this.id);
  }

  get width(): number {
    return this.viewManager.columnGetWidth(this.id);
  }

  getValue(rowId: string): unknown | undefined {
    return this.viewManager.cellGetRenderValue(rowId, this.id);
  }

  setValue(rowId: string, value: unknown | undefined): void {
    this.viewManager.cellUpdateRenderValue(this.id, rowId, value);
  }

  updateData(updater: ColumnDataUpdater): void {
    const data = this.viewManager.columnGetData(this.id);
    this.viewManager.columnUpdateData(this.id, { ...data, ...updater(data) });
  }

  updateHide(hide: boolean): void {
    //TODO
  }

  updateName(name: string): void {
    this.viewManager.columnUpdateName(this.id, name);
  }

  updateWidth(width: number): void {
    this.viewManager.columnUpdateWidth(this.id, width);
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
    //
  }

  getFilterValue(rowId: string): unknown {
    return this.viewManager.cellGetFilterValue(this.id, rowId);
  }

  getStringValue(rowId: string): string {
    return this.viewManager.cellGetStringValue(this.id, rowId);
  }
}
