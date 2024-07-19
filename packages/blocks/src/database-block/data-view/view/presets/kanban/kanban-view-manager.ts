import type { FilterGroup } from '../../../common/ast.js';
import type { TType } from '../../../logical/typesystem.js';
import type { InsertToPosition } from '../../../types.js';
import type { KanbanViewData } from './define.js';

import {
  GroupHelper,
  sortByManually,
} from '../../../common/group-by/helper.js';
import { groupByMatcher } from '../../../common/group-by/matcher.js';
import { defaultGroupBy } from '../../../common/view-manager.js';
import { evalFilter } from '../../../logical/eval-filter.js';
import { insertPositionToIndex } from '../../../utils/insert.js';
import {
  DataViewColumnManagerBase,
  DataViewManagerBase,
} from '../../data-view-manager.js';

export class DataViewKanbanManager extends DataViewManagerBase<KanbanViewData> {
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
          };
        }),
      };
    });
  }

  private updateView(
    updater: (view: KanbanViewData) => Partial<KanbanViewData>
  ) {
    this.syncView();
    this.viewSource.updateView(updater);
  }

  addCard(position: InsertToPosition, group: string) {
    const id = this.rowAdd(position);
    this.groupHelper?.addToGroup(id, group);
    return id;
  }

  changeGroup(columnId: string) {
    const column = this.columnGet(columnId);
    this.updateView(_view => {
      return {
        groupBy: defaultGroupBy(
          this.columnGetMeta(column.type),
          column.id,
          column.data
        ),
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

  columnGet(columnId: string): DataViewKanbanColumnManager {
    return new DataViewKanbanColumnManager(columnId, this);
  }

  columnGetHide(columnId: string): boolean {
    return this.view.columns.find(v => v.id === columnId)?.hide ?? false;
  }

  columnMove(columnId: string, toAfterOfColumn: InsertToPosition): void {
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

  deleteView(): void {
    this.viewSource.delete();
  }

  duplicateView(): void {
    this.viewSource.duplicate();
  }

  getHeaderCover(_rowId: string): DataViewKanbanColumnManager | undefined {
    const columnId = this.view.header.coverColumn;
    if (!columnId) {
      return;
    }
    return this.columnGet(columnId);
  }

  getHeaderIcon(_rowId: string): DataViewKanbanColumnManager | undefined {
    const columnId = this.view.header.iconColumn;
    if (!columnId) {
      return;
    }
    return this.columnGet(columnId);
  }

  getHeaderTitle(_rowId: string): DataViewKanbanColumnManager | undefined {
    const columnId = this.view.header.titleColumn;
    if (!columnId) {
      return;
    }
    return this.columnGet(columnId);
  }

  hasHeader(_rowId: string): boolean {
    const hd = this.view.header;
    return !!hd.titleColumn || !!hd.iconColumn || !!hd.coverColumn;
  }

  isInHeader(columnId: string) {
    const hd = this.view.header;

    return (
      hd.titleColumn === columnId ||
      hd.iconColumn === columnId ||
      hd.coverColumn === columnId
    );
  }

  isShow(rowId: string): boolean {
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

  override rowGetNext(rowId: string): string {
    const index = this.rows.indexOf(rowId);
    return this.rows[index + 1];
  }

  override rowGetPrev(rowId: string): string {
    const index = this.rows.indexOf(rowId);
    return this.rows[index - 1];
  }

  override rowMove(rowId: string, position: InsertToPosition): void {
    this.dataSource.rowMove(rowId, position);
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

  get columns(): string[] {
    return this.columnsWithoutFilter.filter(id => !this.columnGetHide(id));
  }

  get columnsWithoutFilter(): string[] {
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

  get detailColumns(): string[] {
    return this.columnsWithoutFilter.filter(
      id => this.columnGetType(id) !== 'title'
    );
  }

  get filter(): FilterGroup {
    return this.view.filter;
  }

  get groupHelper(): GroupHelper | undefined {
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
          this.view.groupProperties.map(v => v.key)
        ),
      sortRow: (key, ids) => {
        const property = this.view.groupProperties.find(v => v.key === key);
        return sortByManually(ids, v => v, property?.manuallyCardSort ?? []);
      },
      changeGroupSort: keys => {
        const map = new Map(this.view.groupProperties.map(v => [v.key, v]));
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
        const map = new Map(this.view.groupProperties.map(v => [v.key, v]));
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

  get header() {
    return this.view.header;
  }

  get id() {
    return this.view.id;
  }

  get isDeleted(): boolean {
    return this.viewSource.isDeleted();
  }

  get name(): string {
    return this.view.name;
  }

  override get readonly(): boolean {
    return this.viewSource.readonly;
  }

  get type(): string {
    return this.view.mode;
  }

  get view() {
    return this.viewSource.view;
  }
}

export class DataViewKanbanColumnManager extends DataViewColumnManagerBase {
  constructor(
    propertyId: string,
    override dataViewManager: DataViewKanbanManager
  ) {
    super(propertyId, dataViewManager);
  }
}
