import {
  insertPositionToIndex,
  type InsertToPosition,
} from '@blocksuite/affine-shared/utils';
import { computed, type ReadonlySignal } from '@preact/signals-core';

import type { TType } from '../../logical/typesystem.js';
import type { Property } from '../../view-manager/property.js';
import type { SingleView } from '../../view-manager/single-view.js';
import type { GroupBy, GroupProperty } from '../types.js';

import { groupByMatcher } from './matcher.js';

export type GroupData = {
  manager: GroupManager;
  property: Property;
  key: string;
  name: string;
  type: TType;
  value: unknown;
  rows: string[];
};

export class GroupManager {
  config$ = computed(() => {
    const groupBy = this.groupBy$.value;
    if (!groupBy) {
      return;
    }
    const result = groupByMatcher.find(v => v.data.name === groupBy.name);
    if (!result) {
      return;
    }
    return result.data;
  });

  property$ = computed(() => {
    const groupBy = this.groupBy$.value;
    if (!groupBy) {
      return;
    }
    return this.viewManager.propertyGet(groupBy.columnId);
  });

  staticGroupDataMap$ = computed<
    Record<string, Omit<GroupData, 'rows'>> | undefined
  >(() => {
    const config = this.config$.value;
    const property = this.property$.value;
    const tType = property?.dataType$.value;
    if (!config || !tType || !property) {
      return;
    }
    return Object.fromEntries(
      config.defaultKeys(tType).map(({ key, value }) => [
        key,
        {
          key,
          property,
          name: config.groupName(tType, value),
          manager: this,
          type: tType,
          value,
        },
      ])
    );
  });

  groupDataMap$ = computed<Record<string, GroupData> | undefined>(() => {
    const staticGroupMap = this.staticGroupDataMap$.value;
    const config = this.config$.value;
    const groupBy = this.groupBy$.value;
    const property = this.property$.value;
    const tType = property?.dataType$.value;
    if (!staticGroupMap || !config || !groupBy || !tType || !property) {
      return;
    }
    const groupMap: Record<string, GroupData> = Object.fromEntries(
      Object.entries(staticGroupMap).map(([k, v]) => [k, { ...v, rows: [] }])
    );
    this.viewManager.rows$.value.forEach(id => {
      const value = this.viewManager.cellJsonValueGet(id, groupBy.columnId);
      const keys = config.valuesGroup(value, tType);
      keys.forEach(({ key, value }) => {
        if (!groupMap[key]) {
          groupMap[key] = {
            key,
            property: property,
            name: config.groupName(tType, value),
            manager: this,
            value,
            rows: [],
            type: tType,
          };
        }
        groupMap[key].rows.push(id);
      });
    });
    return groupMap;
  });

  groupsDataList$ = computed(() => {
    const groupMap = this.groupDataMap$.value;
    if (!groupMap) {
      return;
    }
    const sortedGroup = this.ops.sortGroup(Object.keys(groupMap));
    sortedGroup.forEach(key => {
      groupMap[key].rows = this.ops.sortRow(key, groupMap[key].rows);
    });
    return sortedGroup.map(key => groupMap[key]);
  });

  updateData = (data: NonNullable<unknown>) => {
    const propertyId = this.propertyId;
    if (!propertyId) {
      return;
    }
    this.viewManager.propertyDataSet(propertyId, data);
  };

  get addGroup() {
    const type = this.property$.value?.type$.value;
    if (!type) {
      return;
    }
    return this.viewManager.propertyMetaGet(type)?.config.addGroup;
  }

  get propertyId() {
    return this.groupBy$.value?.columnId;
  }

  constructor(
    private groupBy$: ReadonlySignal<GroupBy | undefined>,
    private viewManager: SingleView,
    private ops: {
      sortGroup: (keys: string[]) => string[];
      sortRow: (groupKey: string, rowIds: string[]) => string[];
      changeGroupSort: (keys: string[]) => void;
      changeRowSort: (
        groupKeys: string[],
        groupKey: string,
        keys: string[]
      ) => void;
    }
  ) {}

  addToGroup(rowId: string, key: string) {
    const groupMap = this.groupDataMap$.value;
    const propertyId = this.propertyId;
    if (!groupMap || !propertyId) {
      return;
    }
    const addTo = this.config$.value?.addToGroup ?? (value => value);
    const newValue = addTo(
      groupMap[key].value,
      this.viewManager.cellJsonValueGet(rowId, propertyId)
    );
    this.viewManager.cellValueSet(rowId, propertyId, newValue);
  }

  changeCardSort(groupKey: string, cardIds: string[]) {
    const groups = this.groupsDataList$.value;
    if (!groups) {
      return;
    }
    this.ops.changeRowSort(
      groups.map(v => v.key),
      groupKey,
      cardIds
    );
  }

  changeGroupSort(keys: string[]) {
    this.ops.changeGroupSort(keys);
  }

  defaultGroupProperty(key: string): GroupProperty {
    return {
      key,
      hide: false,
      manuallyCardSort: [],
    };
  }

  moveCardTo(
    rowId: string,
    fromGroupKey: string | undefined,
    toGroupKey: string,
    position: InsertToPosition
  ) {
    const groupMap = this.groupDataMap$.value;
    if (!groupMap) {
      return;
    }
    if (fromGroupKey !== toGroupKey) {
      const propertyId = this.propertyId;
      if (!propertyId) {
        return;
      }
      const remove = this.config$.value?.removeFromGroup ?? (() => undefined);
      const group = fromGroupKey != null ? groupMap[fromGroupKey] : undefined;
      let newValue: unknown = undefined;
      if (group) {
        newValue = remove(
          group.value,
          this.viewManager.cellJsonValueGet(rowId, propertyId)
        );
      }
      const addTo = this.config$.value?.addToGroup ?? (value => value);
      newValue = addTo(groupMap[toGroupKey].value, newValue);
      this.viewManager.cellValueSet(rowId, propertyId, newValue);
    }
    const rows = groupMap[toGroupKey].rows.filter(id => id !== rowId);
    const index = insertPositionToIndex(position, rows, id => id);
    rows.splice(index, 0, rowId);
    this.changeCardSort(toGroupKey, rows);
  }

  moveGroupTo(groupKey: string, position: InsertToPosition) {
    const groups = this.groupsDataList$.value;
    if (!groups) {
      return;
    }
    const keys = groups.map(v => v.key);
    keys.splice(
      keys.findIndex(key => key === groupKey),
      1
    );
    const index = insertPositionToIndex(position, keys, key => key);
    keys.splice(index, 0, groupKey);
    this.changeGroupSort(keys);
  }

  removeFromGroup(rowId: string, key: string) {
    const groupMap = this.groupDataMap$.value;
    if (!groupMap) {
      return;
    }
    const propertyId = this.propertyId;
    if (!propertyId) {
      return;
    }
    const remove = this.config$.value?.removeFromGroup ?? (() => undefined);
    const newValue = remove(
      groupMap[key].value,
      this.viewManager.cellJsonValueGet(rowId, propertyId)
    );
    this.viewManager.cellValueSet(rowId, propertyId, newValue);
  }

  updateValue(rows: string[], value: unknown) {
    const propertyId = this.propertyId;
    if (!propertyId) {
      return;
    }
    rows.forEach(id => {
      this.viewManager.cellValueSet(id, propertyId, value);
    });
  }
}

export const sortByManually = <T>(
  arr: T[],
  getId: (v: T) => string,
  ids: string[]
) => {
  const map = new Map(arr.map(v => [getId(v), v]));
  const result: T[] = [];
  for (const id of ids) {
    const value = map.get(id);
    if (value) {
      map.delete(id);
      result.push(value);
    }
  }
  result.push(...map.values());
  return result;
};
