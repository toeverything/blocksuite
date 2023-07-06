import type { BlockSuiteRoot } from '@blocksuite/lit';
import type { Page } from '@blocksuite/store';
import { assertExists, Slot } from '@blocksuite/store';
import { undefined } from 'zod';

import type { FilterGroup } from '../common/ast.js';
import type { TableMixColumn, TableViewData } from '../common/view-manager.js';
import type { ColumnDataUpdater, DatabaseBlockModel, InsertPosition } from '../database-model.js';
import { insertPositionToIndex } from '../database-model.js';
import { evalFilter } from '../logical/eval-filter.js';
import { registerInternalRenderer } from './components/column-type/index.js';
import { DEFAULT_COLUMN_WIDTH } from './consts.js';
import type { ColumnRenderer } from './register.js';
import type { SetValueOption } from './types.js';

const renderer = registerInternalRenderer();

export interface TableViewManager {
  get name(): string;

  get filter(): FilterGroup;

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

  columnGetPreColumn(columnId: string): string | undefined;

  columnGetNextColumn(columnId: string): string | undefined;

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
    update: Slot
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

export interface DataSourceProperty {
  id: string;
  name: string;
  type: string;
  data: Record<string, unknown>;
  changeName: (name: string) => void;
  changeType: (type: string) => void;
  changeData: (data: Record<string, unknown>) => void;
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
  propertyChangeData: (propertyId: string, data: Record<string, unknown>) => void;
  propertyAdd: (insertPosition: InsertPosition) => string;
  propertyDelete: (ids: string) => void;

  slots: {
    update: Slot;
  };
}

export interface ViewSourceProperty {

}

export interface ViewSource {
  readonly id: string;
  readonly properties: ViewSourceProperty[];
  readonly rows: string[];
  readonly getCell: (rowId: string, propertyId: string) => unknown;
  readonly setCell: (rowId: string, propertyId: string, value: unknown) => void;
  readonly slots: {
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
    private updateView: (updater: (view: TableViewData) => Partial<TableViewData>) => void,
    private dataSource: DataSource,
  ) {
    this.dataSource.slots.update
      .pipe(this.slots.update);
  }

  private filteredRows(searchString: string) {
    return this.dataSource.rows
      .filter(id => {
        if (searchString) {
          const containsSearchString = this.columns.some(columnId => {
            return this.cellGetStringValue(id, columnId).includes(searchString);
          });
          if (!containsSearchString) {
            return false;
          }
        }
        const rowMap = Object.fromEntries(
          this.columnManagerList.map(column => [column.id, column.getFilterValue(id)]),
        );
        return evalFilter(this.filter, rowMap);
      });
  }

  get columnManagerList(): ColumnManager[] {
    return this.getView().columns.map((property) => {
      return this.columnGet(property.id);
    });
  }

  get filter(): FilterGroup {
    return this.getView().filter;
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
        return;
      }
      const [column] = view.columns.splice(columnIndex, 1);
      const index = insertPositionToIndex(toAfterOfColumn, view.columns);
      view.columns.splice(index, 0, column);
    });
  }

  newColumn(position: InsertPosition): void {
    const id = this.dataSource.propertyAdd(
      position,
    );

    this._model.applyColumnUpdate();
  }

  nextColumn(id: string): TableMixColumn | undefined {
    return this._columns[this._columns.findIndex(v => v.id === id) + 1];
  }

  preColumn(id: string): TableMixColumn | undefined {
    return this._columns[this._columns.findIndex(v => v.id === id) - 1];
  }

  deleteRow(ids: string[]): void {
    this.dataSource.deleteRows(ids);
    // this._model.page.updateBlock(this._model, {
    //   children: this._model.children.filter(v => !ids.includes(v.id)),
    // });
  }

  addRow(insertPosition: InsertPosition): string {
    return this.dataSource.addRow(insertPosition);
    // const index = insertPositionToIndex(insertPosition, this._model.children);
    // return this._model.page.addBlock(
    //   'affine:paragraph',
    //   {},
    //   this._model.id,
    //   index,
    // );
  }

  public slots = {
    update: new Slot,
  };

  public cellGetFilterValue(rowId: string, columnId: string): unknown {
    return undefined;
  }

  public cellGetRenderValue(rowId: string, columnId: string): unknown {
    return this.dataSource.cellGetValue(rowId, columnId);
  }

  public cellGetStringValue(rowId: string, columnId: string): string {
    return '';
  }

  public cellUpdateRenderValue(rowId: string, columnId: string, value: unknown): void {
    this.dataSource.cellChangeValue(rowId, columnId, value);
  }

  public columnAdd(toAfterOfColumn: InsertPosition): void {
  }

  public columnDelete(columnId: string): void {
  }

  public columnDuplicate(columnId: string): void {
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
    return '';
  }

  public columnGetIndex(columnId: string): number {
    return 0;
  }

  public columnGetName(columnId: string): string {
    return this.dataSource.propertyGetName(columnId);
  }

  public columnGetNextColumn(columnId: string): string | undefined {
    return undefined;
  }

  public columnGetPreColumn(columnId: string): string | undefined {
    return undefined;
  }

  private getViewColumn(id: string) {
    return this.getView().columns.find(v => v.id);
  }

  public columnGetType(columnId: string): string {
    return this.dataSource.propertyGetType(columnId);
  }

  public columnGetWidth(columnId: string): number {
    return this.getView().columns.find(v => v.id === columnId)?.width ?? DEFAULT_COLUMN_WIDTH;
  }

  public columnMove(columnId: string, toAfterOfColumn: InsertPosition): void {
  }

  public columnUpdateData(columnId: string, data: Record<string, unknown>): void {
  }

  public columnUpdateHide(columnId: string, hide: boolean): void {
  }

  public columnUpdateName(columnId: string, name: string): void {
  }

  public columnUpdateType(columnId: string, type: string): void {
  }

  public columnUpdateWidth(columnId: string, width: number): void {
  }

  public get columns(): string[] {
    return [];
  }

  public rowAdd(insertPosition: InsertPosition): string {
    return '';
  }

  public rowDelete(ids: string[]): void {
  }
}

export class DatabaseColumnManager implements ColumnManager {

  constructor(
    protected propertyId: string,
    protected viewManager: TableViewManager,
  ) {
  }

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
    return this.viewManager.columnGetIndex(this.id) === this.viewManager.columnManagerList.length - 1;
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

  setValue(
    rowId: string,
    value: unknown | undefined,
  ): void {
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

  }

  get duplicate(): (() => void) | undefined {
  }

  get updateType(): undefined | ((type: string) => void) {
  }

  get readonly(): boolean {
  }

  captureSync(): void {

  }

  getFilterValue(rowId: string): unknown {
    return this.viewManager.cellGetFilterValue(this.id, rowId);
  }

  getStringValue(rowId: string): string {
    return this.viewManager.cellGetStringValue(this.id, rowId);
  }
}

export class DatabaseTitleColumnManager implements ColumnManager {
  constructor(
    protected _index: number,
    protected _model: DatabaseBlockModel,
    protected _root: BlockSuiteRoot,
  ) {
  }

  get id(): string {
    return 'title';
  }

  get name(): string {
    return this._model.titleColumnName;
  }

  get width(): number {
    return this._model.titleColumnWidth;
  }

  get data(): Record<string, unknown> {
    return {};
  }

  get type(): string {
    return 'title';
  }

  get index(): number {
    return 0;
  }

  getValue(rowId: string): unknown | undefined {
    const block = this._model.page.getBlockById(rowId);
    assertExists(block);
    return this._root.renderModel(block);
  }

  setValue(rowId: string, value: unknown | undefined, option?: SetValueOption) {
    //
  }

  updateName(name: string) {
    this._model.page.captureSync();
    this._model.page.updateBlock(this._model, {
      titleColumnName: name,
    });
  }

  updateWidth(width: number) {
    this._model.page.captureSync();
    this._model.page.updateBlock(this._model, {
      titleColumnWidth: width,
    });
  }

  get delete(): (() => void) | undefined {
    return undefined;
  }

  get duplicate(): (() => void) | undefined {
    return undefined;
  }

  get updateType(): undefined | ((type: string) => void) {
    return undefined;
  }

  captureSync(): void {
    this._model.page.captureSync();
  }

  get hide(): boolean {
    return false;
  }

  get isFirst(): boolean {
    return this._index === 0;
  }

  get isLast(): boolean {
    return false;
  }

  get page(): Page {
    return this._model.page;
  }

  get readonly(): boolean {
    return this._model.page.readonly;
  }

  get renderer(): ColumnRenderer {
    return renderer.get(this.type);
  }

  updateData(updater: ColumnDataUpdater<Record<string, unknown>>): void {
    //
  }

  updateHide(hide: boolean): void {
    //
  }

  getFilterValue(rowId: string): unknown {
    return this.getStringValue(rowId);
  }

  getStringValue(rowId: string): string {
    return this._model.page.getBlockById(rowId)?.text?.toString() ?? '';
  }
}
