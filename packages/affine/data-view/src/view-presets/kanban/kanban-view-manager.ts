import {
  insertPositionToIndex,
  type InsertToPosition,
} from '@blocksuite/affine-shared/utils';
import { computed, type ReadonlySignal } from '@preact/signals-core';

import type { FilterGroup } from '../../core/filter/types.js';
import type { KanbanViewData } from './define.js';

import { evalFilter } from '../../core/filter/eval.js';
import { generateDefaultValues } from '../../core/filter/generate-default-values.js';
import { FilterTrait, filterTraitKey } from '../../core/filter/trait.js';
import { emptyFilterGroup } from '../../core/filter/utils.js';
import {
  GroupTrait,
  groupTraitKey,
  sortByManually,
} from '../../core/group-by/trait.js';
import { PropertyBase } from '../../core/view-manager/property.js';
import { SingleViewBase } from '../../core/view-manager/single-view.js';

export class KanbanSingleView extends SingleViewBase<KanbanViewData> {
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

  detailProperties$ = computed(() => {
    return this.propertiesWithoutFilter$.value.filter(
      id => this.propertyTypeGet(id) !== 'title'
    );
  });

  filter$ = computed(() => {
    return this.data$.value?.filter ?? emptyFilterGroup;
  });

  filterTrait = this.traitSet(
    filterTraitKey,
    new FilterTrait(this.filter$, this, {
      filterSet: filter => {
        this.dataUpdate(() => {
          return {
            filter,
          };
        });
      },
    })
  );

  groupBy$ = computed(() => {
    return this.data$.value?.groupBy;
  });

  groupTrait = this.traitSet(
    groupTraitKey,
    new GroupTrait(this.groupBy$, this, {
      groupBySet: groupBy => {
        this.dataUpdate(() => {
          return {
            groupBy: groupBy,
          };
        });
      },
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
        const map = new Map(this.view?.groupProperties.map(v => [v.key, v]));
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

  propertyIds$: ReadonlySignal<string[]> = computed(() => {
    return this.propertiesWithoutFilter$.value.filter(
      id => !this.propertyHideGet(id)
    );
  });

  readonly$ = computed(() => {
    return this.manager.readonly$.value;
  });

  get columns(): string[] {
    return this.propertiesWithoutFilter$.value.filter(
      id => !this.propertyHideGet(id)
    );
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
    return this.data$.value;
  }

  addCard(position: InsertToPosition, group: string) {
    const id = this.rowAdd(position);
    this.groupTrait.addToGroup(id, group);

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

    return id;
  }

  getHeaderCover(_rowId: string): KanbanColumn | undefined {
    const columnId = this.view?.header.coverColumn;
    if (!columnId) {
      return;
    }
    return this.propertyGet(columnId);
  }

  getHeaderIcon(_rowId: string): KanbanColumn | undefined {
    const columnId = this.view?.header.iconColumn;
    if (!columnId) {
      return;
    }
    return this.propertyGet(columnId);
  }

  getHeaderTitle(_rowId: string): KanbanColumn | undefined {
    const columnId = this.view?.header.titleColumn;
    if (!columnId) {
      return;
    }
    return this.propertyGet(columnId);
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
        this.properties$.value.map(column => [
          column.id,
          column.cellGet(rowId).jsonValue$.value,
        ])
      );
      return evalFilter(this.filter$.value, rowMap);
    }
    return true;
  }

  propertyGet(columnId: string): KanbanColumn {
    return new KanbanColumn(this, columnId);
  }

  propertyHideGet(columnId: string): boolean {
    return this.view?.columns.find(v => v.id === columnId)?.hide ?? false;
  }

  propertyHideSet(columnId: string, hide: boolean): void {
    this.dataUpdate(view => {
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

  propertyMove(columnId: string, toAfterOfColumn: InsertToPosition): void {
    this.dataUpdate(view => {
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

  override rowMove(rowId: string, position: InsertToPosition): void {
    this.dataSource.rowMove(rowId, position);
  }

  override rowNextGet(rowId: string): string {
    const index = this.rows$.value.indexOf(rowId);
    return this.rows$.value[index + 1];
  }

  override rowPrevGet(rowId: string): string {
    const index = this.rows$.value.indexOf(rowId);
    return this.rows$.value[index - 1];
  }
}

export class KanbanColumn extends PropertyBase {
  constructor(dataViewManager: KanbanSingleView, columnId: string) {
    super(dataViewManager, columnId);
  }
}
