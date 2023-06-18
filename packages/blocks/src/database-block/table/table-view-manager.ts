import type { BlockSuiteRoot } from '@blocksuite/lit';
import type { Page } from '@blocksuite/store';
import { assertExists } from '@blocksuite/store';

import type { FilterGroup } from '../common/ast.js';
import { columnManager, multiSelectHelper } from '../common/column-manager.js';
import type {
  TableMixColumn,
  TableViewColumn,
  TableViewData,
} from '../common/view-manager.js';
import type {
  ColumnDataUpdater,
  DatabaseBlockModel,
  InsertPosition,
} from '../database-model.js';
import { insertPositionToIndex } from '../database-model.js';
import { evalFilter } from '../logical/eval-filter.js';
import { registerInternalRenderer } from './components/column-type/index.js';
import type { ColumnRenderer } from './register.js';
import type { Column, SetValueOption } from './types.js';

const renderer = registerInternalRenderer();

export interface TableViewManager {
  get name(): string;

  get filter(): FilterGroup;

  get columns(): ColumnManager[];

  get readonly(): boolean;

  get rows(): string[];

  deleteRow(ids: string[]): void;

  updateName(name: string): void;

  updateFilter(filter: FilterGroup): void;

  moveColumn(column: string, toAfterOfColumn: InsertPosition): void;

  newColumn(toAfterOfColumn: InsertPosition): void;

  preColumn(id: string): TableMixColumn | undefined;

  nextColumn(id: string): TableMixColumn | undefined;
}

export interface ColumnManager<
  Value = unknown,
  Data extends Record<string, unknown> = Record<string, unknown>
> {
  get id(): string;

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

  /**
   * @deprecated
   */
  get page(): Page;
}

export class DatabaseTableViewManager implements TableViewManager {
  _columns: ColumnManager[];

  readonly rows: string[];

  constructor(
    private _model: DatabaseBlockModel,
    private _view: TableViewData,
    _root: BlockSuiteRoot,
    searchString: string
  ) {
    this._columns = [
      new DatabaseTitleColumnManager(0, this._model, _root),
      ...this._view.columns.map((column, i) => {
        return new DatabaseColumnManager(
          column,
          this._model,
          this._view,
          false,
          i === this._view.columns.length - 1
        );
      }),
    ];

    this.rows = this.filteredRows(searchString);
  }

  private filteredRows(searchString: string) {
    return this._model.children
      .filter(v => {
        if (searchString) {
          const containsSearchString = this.columns.some(column => {
            return column.getStringValue(v.id).includes(searchString);
          });
          if (!containsSearchString) {
            return false;
          }
        }
        const rowMap = Object.fromEntries(
          this.columns.map(column => [column.id, column.getFilterValue(v.id)])
        );
        return evalFilter(this.filter, rowMap);
      })
      .map(v => v.id);
  }

  get columns(): ColumnManager[] {
    return this._columns;
  }

  get filter(): FilterGroup {
    return this._view.filter;
  }

  get name(): string {
    return this._view.name;
  }

  get readonly(): boolean {
    return false;
  }

  updateFilter(filter: FilterGroup): void {
    this._model.updateView(this._view.id, 'table', data => {
      data.filter = filter;
    });
    this._model.applyViewsUpdate();
  }

  updateName(name: string): void {
    //
  }

  moveColumn(id: string, toAfterOfColumn: InsertPosition): void {
    this._model.page.captureSync();
    this._model.updateView(this._view.id, 'table', view => {
      const columnIndex = view.columns.findIndex(v => v.id === id);
      if (columnIndex < 0) {
        return;
      }
      const [column] = view.columns.splice(columnIndex, 1);
      const index = insertPositionToIndex(toAfterOfColumn, view.columns);
      view.columns.splice(index, 0, column);
    });
    this._model.applyColumnUpdate();
  }

  newColumn(position: InsertPosition): void {
    this._model.page.captureSync();
    this._model.addColumn(
      position,
      multiSelectHelper.create(`Column ${this._columns.length + 1}`)
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
    this._model.page.updateBlock(this._model, {
      children: this._model.children.filter(v => !ids.includes(v.id)),
    });
  }
}

export class DatabaseColumnManager implements ColumnManager {
  protected _dataColumn: Column;

  constructor(
    protected _column: TableViewColumn,
    protected _model: DatabaseBlockModel,
    protected _view: TableViewData,
    protected _isFirst: boolean,
    protected _isLast: boolean
  ) {
    const dataColumn = this._model.columns.find(v => v.id === this._column.id);
    assertExists(dataColumn);
    this._dataColumn = dataColumn;
  }

  get data(): Record<string, unknown> {
    return this._dataColumn.data;
  }

  get hide(): boolean {
    return this._column.hide ?? false;
  }

  get id(): string {
    return this._column.id;
  }

  get isFirst(): boolean {
    return this._isFirst;
  }

  get isLast(): boolean {
    return this._isLast;
  }

  get name(): string {
    return this._dataColumn.name;
  }

  get renderer(): ColumnRenderer {
    return renderer.get(this.type);
  }

  get type(): string {
    return this._dataColumn.type;
  }

  get width(): number {
    return this._column.width;
  }

  getValue(rowId: string): unknown | undefined {
    return this._model.getCell(rowId, this.id)?.value;
  }

  setValue(
    rowId: string,
    value: unknown | undefined,
    option?: SetValueOption
  ): void {
    const captureSync = option?.captureSync ?? true;
    if (captureSync) {
      this._model.page.captureSync();
    }
    this._model.updateCell(rowId, { columnId: this.id, value });
    this._model.applyColumnUpdate();
  }

  updateData(updater: ColumnDataUpdater): void {
    this._model.page.captureSync();
    this._model.updateColumnData(this.id, updater);
  }

  updateHide(hide: boolean): void {
    //TODO
  }

  updateName(name: string): void {
    this._model.page.captureSync();
    this._model.updateColumn(this.id, () => ({
      name,
    }));
    this._model.applyColumnUpdate();
  }

  updateWidth(width: number): void {
    this._model.page.captureSync();
    this._model.updateView(this._view.id, 'table', data => {
      data.columns.forEach(v => {
        if (v.id === this.id) {
          v.width = width;
        }
      });
    });
    this._model.applyViewsUpdate();
  }

  get delete(): (() => void) | undefined {
    return () => {
      this._model.page.captureSync();
      this._model.deleteColumn(this.id);
      this._model.deleteCellsByColumn(this.id);
      this._model.applyColumnUpdate();
    };
  }

  get duplicate(): (() => void) | undefined {
    return () => {
      this._model.page.captureSync();
      const currentSchema = this._model.getColumn(this.id);
      assertExists(currentSchema);
      const { id: copyId, ...nonIdProps } = currentSchema;
      const schema = { ...nonIdProps };
      const id = this._model.addColumn(this.id, schema);
      this._model.applyColumnUpdate();
      this._model.copyCellsByColumn(copyId, id);
    };
  }

  get updateType(): undefined | ((type: string) => void) {
    return toType => {
      const currentType = this.type;
      this._model.page.captureSync();
      const [newColumnData, update = () => null] =
        columnManager.convertCell(currentType, toType, this.data) ?? [];
      this._model.updateColumn(this.id, () => ({
        type: toType,
        data: newColumnData ?? columnManager.defaultData(toType),
      }));
      this._model.updateCellByColumn(this.id, update);
    };
  }

  get readonly(): boolean {
    return this.page.readonly;
  }

  captureSync(): void {
    this.page.captureSync();
  }

  get page(): Page {
    return this._model.page;
  }

  getFilterValue(rowId: string): unknown {
    return this.getValue(rowId);
  }

  getStringValue(rowId: string): string {
    return (
      columnManager.toString(this.type, this.getValue(rowId), this.data) ?? ''
    );
  }
}

export class DatabaseTitleColumnManager implements ColumnManager {
  constructor(
    protected _index: number,
    protected _model: DatabaseBlockModel,
    protected _root: BlockSuiteRoot
  ) {}

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
    this.page.captureSync();
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
    return this.page.readonly;
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
    return this.page.getBlockById(rowId)?.text?.toString() ?? '';
  }
}
