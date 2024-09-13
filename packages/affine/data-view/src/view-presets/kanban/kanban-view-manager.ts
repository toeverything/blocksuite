import {
  insertPositionToIndex,
  type InsertToPosition,
} from '@blocksuite/affine-shared/utils';
import { computed, type ReadonlySignal } from '@preact/signals-core';

import type { TType } from '../../core/logical/typesystem.js';
import type { KanbanViewData } from './define.js';

import { emptyFilterGroup, type FilterGroup } from '../../core/common/ast.js';
import { defaultGroupBy } from '../../core/common/group-by.js';
import {
  GroupManager,
  sortByManually,
} from '../../core/common/group-by/helper.js';
import { groupByMatcher } from '../../core/common/group-by/matcher.js';
import { evalFilter } from '../../core/logical/eval-filter.js';
import { ColumnBase } from '../../core/view-manager/column.js';
import { SingleViewBase } from '../../core/view-manager/single-view.js';

export class KanbanSingleView extends SingleViewBase<KanbanViewData> {
  columns$: ReadonlySignal<string[]> = computed(() => {
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

  groupBy$ = computed(() => {
    return this.viewData$.value?.groupBy;
  });

  groupManager = new GroupManager(this.groupBy$, this, {
    sortGroup: ids =>
      sortByManually(
        ids,
        v => v,
        this.view?.groupProperties.map(v => v.key) ?? []
      ),
    sortRow: (key, ids) => {
      const property = this.view?.groupProperties.find(v => v.key === key);
      return sortByManually(ids, v => v, property?.manuallyCardSort ?? []);
    },
    changeGroupSort: keys => {
      const map = new Map(this.view?.groupProperties.map(v => [v.key, v]));
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
      const map = new Map(this.view?.groupProperties.map(v => [v.key, v]));
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

  get columns(): string[] {
    return this.columnsWithoutFilter$.value.filter(
      id => !this.columnGetHide(id)
    );
  }

  get columnsWithoutFilter(): string[] {
    const needShow = new Set(this.dataSource.properties$.value);
    const result: string[] = [];
    this.view?.columns.forEach(v => {
      if (needShow.has(v.id)) {
        result.push(v.id);
        needShow.delete(v.id);
      }
    });
    result.push(...needShow);
    return result;
  }

  get filter(): FilterGroup {
    return this.view?.filter ?? emptyFilterGroup;
  }

  get header() {
    return this.view?.header;
  }

  get type(): string {
    return this.view?.mode ?? 'kanban';
  }

  get view() {
    return this.viewData$.value;
  }

  addCard(position: InsertToPosition, group: string) {
    const id = this.rowAdd(position);
    this.groupManager.addToGroup(id, group);
    return id;
  }

  changeGroup(columnId: string) {
    const column = this.columnGet(columnId);
    this.viewDataUpdate(_view => {
      return {
        groupBy: defaultGroupBy(
          this.columnGetMeta(column.type$.value),
          column.id,
          column.data$.value
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

  columnGet(columnId: string): KanbanColumn {
    return new KanbanColumn(this, columnId);
  }

  columnGetHide(columnId: string): boolean {
    return this.view?.columns.find(v => v.id === columnId)?.hide ?? false;
  }

  columnMove(columnId: string, toAfterOfColumn: InsertToPosition): void {
    this.viewDataUpdate(view => {
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
    this.viewDataUpdate(view => {
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

  getHeaderCover(_rowId: string): KanbanColumn | undefined {
    const columnId = this.view?.header.coverColumn;
    if (!columnId) {
      return;
    }
    return this.columnGet(columnId);
  }

  getHeaderIcon(_rowId: string): KanbanColumn | undefined {
    const columnId = this.view?.header.iconColumn;
    if (!columnId) {
      return;
    }
    return this.columnGet(columnId);
  }

  getHeaderTitle(_rowId: string): KanbanColumn | undefined {
    const columnId = this.view?.header.titleColumn;
    if (!columnId) {
      return;
    }
    return this.columnGet(columnId);
  }

  hasHeader(_rowId: string): boolean {
    const hd = this.view?.header;
    if (!hd) {
      return false;
    }
    return !!hd.titleColumn || !!hd.iconColumn || !!hd.coverColumn;
  }

  isInHeader(columnId: string) {
    const hd = this.view?.header;
    if (!hd) {
      return false;
    }
    return (
      hd.titleColumn === columnId ||
      hd.iconColumn === columnId ||
      hd.coverColumn === columnId
    );
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

  override rowGetNext(rowId: string): string {
    const index = this.rows$.value.indexOf(rowId);
    return this.rows$.value[index + 1];
  }

  override rowGetPrev(rowId: string): string {
    const index = this.rows$.value.indexOf(rowId);
    return this.rows$.value[index - 1];
  }

  override rowMove(rowId: string, position: InsertToPosition): void {
    this.dataSource.rowMove(rowId, position);
  }

  updateFilter(filter: FilterGroup): void {
    this.viewDataUpdate(() => {
      return {
        filter,
      };
    });
  }
}

export class KanbanColumn extends ColumnBase {
  constructor(dataViewManager: KanbanSingleView, columnId: string) {
    super(dataViewManager, columnId);
  }
}
