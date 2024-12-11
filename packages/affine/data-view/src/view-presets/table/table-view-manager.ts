import {
  insertPositionToIndex,
  type InsertToPosition,
} from '@blocksuite/affine-shared/utils';
import { computed, type ReadonlySignal } from '@preact/signals-core';

import type { FilterGroup } from '../../core/filter/types.js';
import type { ViewManager } from '../../core/view-manager/view-manager.js';
import type { TableViewData } from './define.js';
import type { StatCalcOpType } from './types.js';

import { evalFilter } from '../../core/filter/eval.js';
import { generateDefaultValues } from '../../core/filter/generate-default-values.js';
import { FilterTrait, filterTraitKey } from '../../core/filter/trait.js';
import { emptyFilterGroup } from '../../core/filter/utils.js';
import {
  GroupTrait,
  groupTraitKey,
  sortByManually,
} from '../../core/group-by/trait.js';
import { SortManager, sortTraitKey } from '../../core/sort/manager.js';
import { PropertyBase } from '../../core/view-manager/property.js';
import {
  type SingleView,
  SingleViewBase,
} from '../../core/view-manager/single-view.js';
import { DEFAULT_COLUMN_MIN_WIDTH, DEFAULT_COLUMN_WIDTH } from './consts.js';

export class TableSingleView extends SingleViewBase<TableViewData> {
  propertiesWithoutFilter$ = computed(() => {
    const needShow = new Set(this.dataSource.properties$.value);
    const result: string[] = [];
    this.data$.value?.columns.forEach(v => {
      if (needShow.has(v.id)) {
        result.push(v.id);
        needShow.delete(v.id);
      }
    });
    result.push(...needShow);
    return result;
  });

  private computedColumns$ = computed(() => {
    return this.propertiesWithoutFilter$.value.map(id => {
      const column = this.propertyGet(id);
      return {
        id: column.id,
        hide: column.hide$.value,
        width: column.width$.value,
        statCalcType: column.statCalcOp$.value,
      };
    });
  });

  private filter$ = computed(() => {
    return this.data$.value?.filter ?? emptyFilterGroup;
  });

  private groupBy$ = computed(() => {
    return this.data$.value?.groupBy;
  });

  private sortList$ = computed(() => {
    return this.data$.value?.sort;
  });

  private sortManager = this.traitSet(
    sortTraitKey,
    new SortManager(this.sortList$, this, {
      setSortList: sortList => {
        this.dataUpdate(data => {
          return {
            sort: {
              ...data.sort,
              ...sortList,
            },
          };
        });
      },
    })
  );

  detailProperties$ = computed(() => {
    return this.propertiesWithoutFilter$.value.filter(
      id => this.propertyTypeGet(id) !== 'title'
    );
  });

  filterTrait = this.traitSet(
    filterTraitKey,
    new FilterTrait(this.filter$, this, {
      filterSet: (filter: FilterGroup) => {
        this.dataUpdate(() => {
          return {
            filter,
          };
        });
      },
    })
  );

  groupTrait = this.traitSet(
    groupTraitKey,
    new GroupTrait(this.groupBy$, this, {
      groupBySet: groupBy => {
        this.dataUpdate(() => {
          return {
            groupBy,
          };
        });
      },
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
        this.dataUpdate(() => {
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
        this.dataUpdate(() => {
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
    })
  );

  mainProperties$ = computed(() => {
    return (
      this.data$.value?.header ?? {
        titleColumn: this.propertiesWithoutFilter$.value.find(
          id => this.propertyTypeGet(id) === 'title'
        ),
        iconColumn: 'type',
      }
    );
  });

  propertyIds$ = computed(() => {
    return this.propertiesWithoutFilter$.value.filter(
      id => !this.propertyHideGet(id)
    );
  });

  readonly$ = computed(() => {
    return this.manager.readonly$.value;
  });

  get groupProperties() {
    return this.data$.value?.groupProperties ?? [];
  }

  get name(): string {
    return this.data$.value?.name ?? '';
  }

  override get type(): string {
    return this.data$.value?.mode ?? 'table';
  }

  constructor(viewManager: ViewManager, viewId: string) {
    super(viewManager, viewId);
  }

  columnGetStatCalcOp(columnId: string): StatCalcOpType {
    return this.data$.value?.columns.find(v => v.id === columnId)?.statCalcType;
  }

  columnGetWidth(columnId: string): number {
    const column = this.data$.value?.columns.find(v => v.id === columnId);
    if (column?.width != null) {
      return column.width;
    }
    const type = this.propertyTypeGet(columnId);
    if (type === 'title') {
      return 260;
    }
    return DEFAULT_COLUMN_WIDTH;
  }

  columnUpdateStatCalcOp(columnId: string, op?: string): void {
    this.dataUpdate(() => {
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
    this.dataUpdate(() => {
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

  isShow(rowId: string): boolean {
    if (this.filter$.value?.conditions.length) {
      const rowMap = Object.fromEntries(
        this.properties$.value.map(column => [
          column.id,
          column.cellGet(rowId).jsonValue$.value,
        ])
      );
      return evalFilter(this.filter$.value, rowMap);
    }
    return true;
  }

  minWidthGet(type: string): number {
    return (
      this.propertyMetaGet(type)?.config.minWidth ?? DEFAULT_COLUMN_MIN_WIDTH
    );
  }

  propertyGet(columnId: string): TableColumn {
    return new TableColumn(this, columnId);
  }

  propertyHideGet(columnId: string): boolean {
    return (
      this.data$.value?.columns.find(v => v.id === columnId)?.hide ?? false
    );
  }

  propertyHideSet(columnId: string, hide: boolean): void {
    this.dataUpdate(() => {
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

  propertyMove(columnId: string, toAfterOfColumn: InsertToPosition): void {
    this.dataUpdate(() => {
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

  override rowAdd(
    insertPosition: InsertToPosition | number,
    groupKey?: string
  ): string {
    const id = super.rowAdd(insertPosition);

    const filter = this.filter$.value;
    if (filter.conditions.length > 0) {
      const defaultValues = generateDefaultValues(filter, this.vars$.value);
      Object.entries(defaultValues).forEach(([propertyId, jsonValue]) => {
        const property = this.propertyGet(propertyId);
        const propertyMeta = this.propertyMetaGet(property.type$.value);
        if (propertyMeta?.config.cellFromJson) {
          const value = propertyMeta.config.cellFromJson({
            value: jsonValue,
            data: property.data$.value,
            dataSource: this.dataSource,
          });
          this.cellValueSet(id, propertyId, value);
        }
      });
    }

    if (groupKey) {
      this.groupTrait.addToGroup(id, groupKey);
    }
    return id;
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
    this.groupTrait.moveCardTo(rowId, fromGroup, toGroup, position);
  }

  override rowNextGet(rowId: string): string {
    const index = this.rows$.value.indexOf(rowId);
    return this.rows$.value[index + 1];
  }

  override rowPrevGet(rowId: string): string {
    const index = this.rows$.value.indexOf(rowId);
    return this.rows$.value[index - 1];
  }

  override rowsMapping(rows: string[]) {
    return this.sortManager.sort(super.rowsMapping(rows));
  }
}

export class TableColumn extends PropertyBase {
  statCalcOp$ = computed(() => {
    return this.tableView.columnGetStatCalcOp(this.id);
  });

  width$: ReadonlySignal<number> = computed(() => {
    return this.tableView.columnGetWidth(this.id);
  });

  get minWidth() {
    return this.tableView.minWidthGet(this.type$.value);
  }

  constructor(
    private tableView: TableSingleView,
    columnId: string
  ) {
    super(tableView as SingleView, columnId);
  }

  updateStatCalcOp(type?: string): void {
    return this.tableView.columnUpdateStatCalcOp(this.id, type);
  }

  updateWidth(width: number): void {
    this.tableView.columnUpdateWidth(this.id, width);
  }
}
