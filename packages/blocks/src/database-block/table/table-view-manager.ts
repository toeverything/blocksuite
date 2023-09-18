import type { DataSource } from '../../__internal__/datasource/base.js';
import type { FilterGroup } from '../common/ast.js';
import type { CellRenderer } from '../common/columns/manager.js';
import type { RealDataViewDataTypeMap } from '../common/data-view.js';
import {
  BaseDataViewColumnManager,
  BaseDataViewManager,
} from '../common/data-view-manager.js';
import { GroupHelper, sortByManually } from '../common/group-by/helper.js';
import { groupByMatcher } from '../common/group-by/matcher.js';
import { defaultGroupBy } from '../common/group-by/util.js';
import type { SingleViewSource } from '../common/view-source.js';
import { evalFilter } from '../logical/eval-filter.js';
import type { TType } from '../logical/typesystem.js';
import type { InsertPosition } from '../types.js';
import { insertPositionToIndex } from '../utils/insert.js';
import { headerRenderer } from './components/header-cell.js';

type TableViewData = RealDataViewDataTypeMap['table'];

export class DataViewTableManager extends BaseDataViewManager {
  public override get type(): string {
    return this.view.mode;
  }

  private readonly updateView: (
    updater: (view: TableViewData) => Partial<TableViewData>
  ) => void;

  constructor(
    private viewSource: SingleViewSource<TableViewData>,
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
    this.viewSource.updateView(_view => {
      return {
        columns: this.columnsWithoutFilter.map(id => {
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

  public get detailColumns(): string[] {
    return this.columnsWithoutFilter.filter(
      id => this.columnGetType(id) !== 'title'
    );
  }

  public override rowAdd(
    insertPosition: InsertPosition | number,
    groupKey?: string
  ): string {
    const id = super.rowAdd(insertPosition);
    if (!groupKey) {
      return id;
    }
    this.groupHelper?.addToGroup(id, groupKey);
    return id;
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
  override get readonly(): boolean {
    return this.viewSource.readonly;
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

  public get header() {
    return (
      this.view.header ?? {
        titleColumn: this.columnsWithoutFilter.find(
          id => this.columnGetType(id) === 'title'
        ),
        iconColumn: 'type',
      }
    );
  }

  public isInHeader(columnId: string) {
    return Object.values(this.header).some(v => v === columnId);
  }

  public hasHeader(rowId: string): boolean {
    return Object.values(this.header).some(id => this.cellGetValue(rowId, id));
  }

  changeGroup(columnId: string | undefined) {
    if (columnId == null) {
      this.updateView(() => {
        return {
          groupBy: undefined,
        };
      });
      return;
    }
    const column = this.columnGet(columnId);
    this.updateView(_view => {
      return {
        groupBy: defaultGroupBy(column.id, column.type, column.data),
      };
    });
  }

  checkGroup(columnId: string, type: TType, target: TType): boolean {
    if (!groupByMatcher.isMatched(type, target)) {
      this.changeGroup(columnId);
      return false;
    }
    return true;
  }

  get groupProperties() {
    return this.view.groupProperties ?? [];
  }
  public get groupHelper(): GroupHelper | undefined {
    const groupBy = this.view.groupBy;
    if (!groupBy) {
      return;
    }
    const result = groupByMatcher.find(v => v.data.name === groupBy.name);
    if (!result) {
      return;
    }
    const groupByConfig = result.data;
    const type = this.columnGetDataType(groupBy.columnId);
    if (!this.checkGroup(groupBy.columnId, result.type, type)) {
      // reset groupBy config
      return this.groupHelper;
    }
    return new GroupHelper(groupBy, groupByConfig, type, this, {
      sortGroup: ids =>
        sortByManually(
          ids,
          v => v,
          this.groupProperties.map(v => v.key)
        ),
      sortRow: (key, ids) => {
        const property = this.groupProperties.find(v => v.key === key);
        return sortByManually(ids, v => v, property?.manuallyCardSort ?? []);
      },
      changeGroupSort: keys => {
        const map = new Map(this.groupProperties.map(v => [v.key, v]));
        this.updateView(() => {
          return {
            groupProperties: keys.map(key => {
              const property = map.get(key);
              if (property) {
                return property;
              }
              return {
                key,
                hide: false,
                manuallyCardSort: [],
              };
            }),
          };
        });
      },
      changeRowSort: (groupKeys, groupKey, keys) => {
        const map = new Map(this.groupProperties.map(v => [v.key, v]));
        this.updateView(() => {
          return {
            groupProperties: groupKeys.map(key => {
              if (key === groupKey) {
                const group = map.get(key);
                return group
                  ? {
                      ...group,
                      manuallyCardSort: keys,
                    }
                  : {
                      key,
                      hide: false,
                      manuallyCardSort: keys,
                    };
              } else {
                return (
                  map.get(key) ?? {
                    key,
                    hide: false,
                    manuallyCardSort: [],
                  }
                );
              }
            }),
          };
        });
      },
    });
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

  public override get renderer(): CellRenderer {
    if (this.id === this.dataViewManager.header.titleColumn) {
      return headerRenderer;
    }
    return super.renderer;
  }
}
