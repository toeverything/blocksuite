import type { DataSource } from '../../__internal__/datasource/base.js';
import type { FilterGroup } from '../common/ast.js';
import type { RealDataViewDataTypeMap } from '../common/data-view.js';
import {
  BaseDataViewColumnManager,
  BaseDataViewManager,
} from '../common/data-view-manager.js';
import type { ViewSource } from '../common/view-source.js';
import { evalFilter } from '../logical/eval-filter.js';
import type { InsertPosition } from '../types.js';
import { insertPositionToIndex } from '../utils/insert.js';

type TableViewData = RealDataViewDataTypeMap['table'];

export class DataViewTableManager extends BaseDataViewManager {
  public override get type(): string {
    return this.view.mode;
  }

  private readonly updateView: (
    updater: (view: TableViewData) => Partial<TableViewData>
  ) => void;

  constructor(
    private viewSource: ViewSource<TableViewData>,
    dataSource: DataSource
  ) {
    super(dataSource);
    this.updateView = updater => {
      this.syncView();
      viewSource.updateView(updater);
    };
    viewSource.updateSlot.pipe(this.slots.update);
  }

  get view() {
    return this.viewSource.view;
  }

  get filter(): FilterGroup {
    return this.view.filter;
  }

  get id() {
    return this.view.id;
  }

  get name(): string {
    return this.view.name;
  }

  updateFilter(filter: FilterGroup): void {
    this.updateView(() => {
      return {
        filter,
      };
    });
  }

  updateName(name: string): void {
    this.updateView(() => {
      return {
        name,
      };
    });
  }

  private syncView() {
    if (this.view.columns.length === this.columns.length) {
      return;
    }
    this.viewSource.updateView(view => {
      return {
        columns: this.columnsWithoutFilter.map((id, i) => {
          const column = this.columnGet(id);
          return {
            id: column.id,
            hide: column.hide,
            width: column.width,
          };
        }),
      };
    });
  }

  public columnGet(columnId: string): DataViewTableColumnManager {
    return new DataViewTableColumnManager(columnId, this);
  }

  public columnGetWidth(columnId: string): number {
    return (
      this.view.columns.find(v => v.id === columnId)?.width ??
      this.dataSource.propertyGetDefaultWidth(columnId)
    );
  }

  public columnMove(columnId: string, toAfterOfColumn: InsertPosition): void {
    this.updateView(view => {
      const columnIndex = view.columns.findIndex(v => v.id === columnId);
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

  public columnUpdateWidth(columnId: string, width: number): void {
    this.updateView(view => {
      return {
        columns: view.columns.map(v =>
          v.id === columnId
            ? {
                ...v,
                width: width,
              }
            : v
        ),
      };
    });
  }

  public get columns(): string[] {
    return this.columnsWithoutFilter.filter(id => !this.columnGetHide(id));
  }

  public get columnsWithoutFilter(): string[] {
    const needShow = new Set(this.dataSource.properties);
    const result: string[] = [];
    this.view.columns.forEach(v => {
      if (needShow.has(v.id)) {
        result.push(v.id);
        needShow.delete(v.id);
      }
    });
    result.push(...needShow);
    return result;
  }

  public isShow(rowId: string): boolean {
    if (this.filter.conditions.length) {
      const rowMap = Object.fromEntries(
        this.columnManagerList.map(column => [
          column.id,
          column.getJsonValue(rowId),
        ])
      );
      return evalFilter(this.filter, rowMap);
    }
    return true;
  }

  columnUpdateHide(columnId: string, hide: boolean): void {
    this.updateView(view => {
      return {
        columns: view.columns.map(v =>
          v.id === columnId
            ? {
                ...v,
                hide,
              }
            : v
        ),
      };
    });
  }
  columnGetHide(columnId: string): boolean {
    return this.view.columns.find(v => v.id === columnId)?.hide ?? false;
  }

  public deleteView(): void {
    this.viewSource.delete();
  }
  public get isDeleted(): boolean {
    return this.viewSource.isDeleted();
  }
}

export class DataViewTableColumnManager extends BaseDataViewColumnManager {
  constructor(
    propertyId: string,
    override dataViewManager: DataViewTableManager
  ) {
    super(propertyId, dataViewManager);
  }

  get width(): number {
    return this.dataViewManager.columnGetWidth(this.id);
  }

  updateWidth(width: number): void {
    this.dataViewManager.columnUpdateWidth(this.id, width);
  }
}
