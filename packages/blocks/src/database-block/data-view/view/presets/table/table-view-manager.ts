import { type ReadonlySignal, computed } from '@lit-labs/preact-signals';

import type { TType } from '../../../logical/typesystem.js';
import type { InsertToPosition } from '../../../types.js';
import type { ViewManager } from '../../../view-manager/view-manager.js';
import type { TableViewData } from './define.js';
import type { StatCalcOpType } from './types.js';

import { type FilterGroup, emptyFilterGroup } from '../../../common/ast.js';
import { ColumnDataStats } from '../../../common/data-stats.js';
import { defaultGroupBy } from '../../../common/group-by.js';
import {
  GroupHelper,
  sortByManually,
} from '../../../common/group-by/helper.js';
import { groupByMatcher } from '../../../common/group-by/matcher.js';
import { evalFilter } from '../../../logical/eval-filter.js';
import { insertPositionToIndex } from '../../../utils/insert.js';
import { ColumnBase } from '../../../view-manager/column.js';
import {
  type SingleView,
  SingleViewBase,
} from '../../../view-manager/single-view.js';

export class TableSingleView extends SingleViewBase<TableViewData> {
  private computedColumns$ = computed(() => {
    return this.columnsWithoutFilter$.value.map(id => {
      const column = this.columnGet(id);
      return {
        id: column.id,
        hide: column.hide,
        width: column.width$.value,
        statCalcType: column.statCalcOp,
      };
    });
  });

  columns$ = computed(() => {
    return this.columnsWithoutFilter$.value.filter(
      id => !this.columnGetHide(id)
    );
  });

  columnsWithoutFilter$ = computed(() => {
    const needShow = new Set(this.dataSource.properties$.value);
    const result: string[] = [];
    this.viewData$.value?.columns.forEach(v => {
      if (needShow.has(v.id)) {
        result.push(v.id);
        needShow.delete(v.id);
      }
    });
    result.push(...needShow);
    return result;
  });

  detailColumns$ = computed(() => {
    return this.columnsWithoutFilter$.value.filter(
      id => this.columnGetType(id) !== 'title'
    );
  });

  filter$ = computed(() => {
    return this.viewData$.value?.filter ?? emptyFilterGroup;
  });

  header$ = computed(() => {
    return (
      this.viewData$.value?.header ?? {
        titleColumn: this.columnsWithoutFilter$.value.find(
          id => this.columnGetType(id) === 'title'
        ),
        iconColumn: 'type',
      }
    );
  });

  readonly$ = computed(() => {
    return this.viewManager.readonly$.value;
  });

  constructor(viewManager: ViewManager, viewId: string) {
    super(viewManager, viewId);
  }

  changeGroup(columnId: string | undefined) {
    if (columnId == null) {
      this.viewDataUpdate(() => {
        return {
          groupBy: undefined,
        };
      });
      return;
    }
    const column = this.columnGet(columnId);
    this.viewDataUpdate(_view => {
      return {
        groupBy: defaultGroupBy(
          this.columnGetMeta(column.type),
          column.id,
          column.data$
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

  columnGet(columnId: string): TableColumn {
    return new TableColumn(this, columnId);
  }

  columnGetHide(columnId: string): boolean {
    return (
      this.viewData$.value?.columns.find(v => v.id === columnId)?.hide ?? false
    );
  }

  columnGetStatCalcOp(columnId: string): StatCalcOpType {
    return (
      this.viewData$.value?.columns.find(v => v.id === columnId)
        ?.statCalcType ?? 'none'
    );
  }

  columnGetWidth(columnId: string): number {
    return (
      this.viewData$.value?.columns.find(v => v.id === columnId)?.width ??
      this.dataSource.propertyGetDefaultWidth(columnId)
    );
  }

  columnMove(columnId: string, toAfterOfColumn: InsertToPosition): void {
    this.viewDataUpdate(() => {
      const columnIndex = this.computedColumns$.value.findIndex(
        v => v.id === columnId
      );
      if (columnIndex < 0) {
        return {};
      }
      const columns = [...this.computedColumns$.value];
      const [column] = columns.splice(columnIndex, 1);
      const index = insertPositionToIndex(toAfterOfColumn, columns);
      columns.splice(index, 0, column);
      return {
        columns,
      };
    });
  }

  columnUpdateHide(columnId: string, hide: boolean): void {
    this.viewDataUpdate(() => {
      return {
        columns: this.computedColumns$.value.map(v =>
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

  columnUpdateStatCalcOp(columnId: string, op: StatCalcOpType): void {
    this.viewDataUpdate(() => {
      return {
        columns: this.computedColumns$.value.map(v =>
          v.id === columnId
            ? {
                ...v,
                statCalcType: op,
              }
            : v
        ),
      };
    });
  }

  columnUpdateWidth(columnId: string, width: number): void {
    this.viewDataUpdate(() => {
      return {
        columns: this.computedColumns$.value.map(v =>
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

  hasHeader(rowId: string): boolean {
    return Object.values(this.header$).some(id => this.cellGetValue(rowId, id));
  }

  isInHeader(columnId: string) {
    return Object.values(this.header$).some(v => v === columnId);
  }

  isShow(rowId: string): boolean {
    if (this.filter$.value?.conditions.length) {
      const rowMap = Object.fromEntries(
        this.columnManagerList$.value.map(column => [
          column.id,
          column.cellGet(rowId).jsonValue$.value,
        ])
      );
      return evalFilter(this.filter$.value, rowMap);
    }
    return true;
  }

  override rowAdd(
    insertPosition: InsertToPosition | number,
    groupKey?: string
  ): string {
    const id = super.rowAdd(insertPosition);
    if (!groupKey) {
      return id;
    }
    this.groupHelper?.addToGroup(id, groupKey);
    return id;
  }

  override rowGetNext(rowId: string): string {
    const index = this.rows$.value.indexOf(rowId);
    return this.rows$.value[index + 1];
  }

  override rowGetPrev(rowId: string): string {
    const index = this.rows$.value.indexOf(rowId);
    return this.rows$.value[index - 1];
  }

  override rowMove(
    rowId: string,
    position: InsertToPosition,
    fromGroup?: string,
    toGroup?: string
  ) {
    if (toGroup == null) {
      super.rowMove(rowId, position);
      return;
    }
    this.groupHelper?.moveCardTo(rowId, fromGroup, toGroup, position);
  }

  updateFilter(filter: FilterGroup): void {
    this.viewDataUpdate(() => {
      return {
        filter,
      };
    });
  }

  get groupHelper(): GroupHelper | undefined {
    const groupBy = this.viewData$.value?.groupBy;
    if (!groupBy) {
      return;
    }
    const result = groupByMatcher.find(v => v.data.name === groupBy.name);
    if (!result) {
      return;
    }
    const groupByConfig = result.data;
    const type = this.columnGetDataType(groupBy.columnId);
    if (!type) {
      return;
    }
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
        this.viewDataUpdate(() => {
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
        this.viewDataUpdate(() => {
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

  get groupProperties() {
    return this.viewData$.value?.groupProperties ?? [];
  }

  get name(): string {
    return this.viewData$.value?.name ?? '';
  }

  override get type(): string {
    return this.viewData$.value?.mode ?? 'table';
  }
}

export class TableColumn extends ColumnBase {
  readonly stats = new ColumnDataStats(this);

  width$: ReadonlySignal<number> = computed(() => {
    return this.tableView.columnGetWidth(this.id);
  });

  constructor(
    private tableView: TableSingleView,
    columnId: string
  ) {
    super(tableView as SingleView, columnId);
  }

  updateStatCalcOp(type: StatCalcOpType): void {
    return this.tableView.columnUpdateStatCalcOp(this.id, type);
  }

  updateWidth(width: number): void {
    this.tableView.columnUpdateWidth(this.id, width);
  }

  get statCalcOp(): StatCalcOpType {
    return this.tableView.columnGetStatCalcOp(this.id);
  }
}
