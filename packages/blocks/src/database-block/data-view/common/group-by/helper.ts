import type { TType } from '../../logical/typesystem.js';
import type { InsertToPosition } from '../../types.js';
import type { DataViewManager } from '../../view/data-view-manager.js';
import type { GroupBy, GroupProperty } from '../types.js';
import type { GroupByConfig } from './matcher.js';

import { insertPositionToIndex } from '../../utils/insert.js';
import { groupByMatcher } from './matcher.js';

export type GroupData = {
  helper: GroupHelper;
  key: string;
  name: string;
  rows: string[];
  type: TType;
  value: unknown;
};

export class GroupHelper {
  readonly groupMap: Record<string, GroupData>;

  readonly groups: GroupData[];

  updateData = (data: NonNullable<unknown>) => {
    this.viewManager.columnUpdateData(this.columnId, data);
  };

  constructor(
    private groupBy: GroupBy,
    config: GroupByConfig,
    type: TType,
    private viewManager: DataViewManager,
    private ops: {
      changeGroupSort: (keys: string[]) => void;
      changeRowSort: (
        groupKeys: string[],
        groupKey: string,
        keys: string[]
      ) => void;
      sortGroup: (keys: string[]) => string[];
      sortRow: (groupKey: string, rowIds: string[]) => string[];
    }
  ) {
    this.groupMap = Object.fromEntries(
      config.defaultKeys(type).map(({ key, value }) => [
        key,
        {
          helper: this,
          key,
          name: config.groupName(type, value),
          rows: [],
          type,
          value,
        },
      ])
    );
    this.viewManager.rows.forEach(id => {
      const value = this.viewManager.cellGetJsonValue(id, groupBy.columnId);
      const keys = config.valuesGroup(value, type);
      keys.forEach(({ key, value }) => {
        if (!this.groupMap[key]) {
          this.groupMap[key] = {
            helper: this,
            key,
            name: config.groupName(type, value),
            rows: [],
            type,
            value,
          };
        }
        this.groupMap[key].rows.push(id);
      });
    });
    const sortedGroup = ops.sortGroup(Object.keys(this.groupMap));
    sortedGroup.forEach(key => {
      this.groupMap[key].rows = ops.sortRow(key, this.groupMap[key].rows);
    });
    this.groups = sortedGroup.map(key => this.groupMap[key]);
  }

  addToGroup(rowId: string, key: string) {
    const columnId = this.columnId;
    const addTo = this.groupConfig()?.addToGroup ?? (value => value);
    const newValue = addTo(
      this.groupMap[key].value,
      this.viewManager.cellGetJsonValue(rowId, columnId)
    );
    this.viewManager.cellUpdateValue(rowId, columnId, newValue);
  }

  changeCardSort(groupKey: string, cardIds: string[]) {
    this.ops.changeRowSort(
      this.groups.map(v => v.key),
      groupKey,
      cardIds
    );
  }

  changeGroupSort(keys: string[]) {
    this.ops.changeGroupSort(keys);
  }

  defaultGroupProperty(key: string): GroupProperty {
    return {
      hide: false,
      key,
      manuallyCardSort: [],
    };
  }

  groupConfig() {
    return groupByMatcher.findData(v => v.name === this.groupBy.name);
  }

  moveCardTo(
    rowId: string,
    fromGroupKey: string | undefined,
    toGroupKey: string,
    position: InsertToPosition
  ) {
    if (fromGroupKey !== toGroupKey) {
      const columnId = this.columnId;
      const remove = this.groupConfig()?.removeFromGroup ?? (() => undefined);
      const group =
        fromGroupKey != null ? this.groupMap[fromGroupKey] : undefined;
      let newValue: unknown = undefined;
      if (group) {
        newValue = remove(
          group.value,
          this.viewManager.cellGetJsonValue(rowId, columnId)
        );
      }
      const addTo = this.groupConfig()?.addToGroup ?? (value => value);
      newValue = addTo(this.groupMap[toGroupKey].value, newValue);
      this.viewManager.cellUpdateValue(rowId, columnId, newValue);
    }
    const rows = this.groupMap[toGroupKey].rows.filter(id => id !== rowId);
    const index = insertPositionToIndex(position, rows, id => id);
    rows.splice(index, 0, rowId);
    this.changeCardSort(toGroupKey, rows);
  }

  moveGroupTo(groupKey: string, position: InsertToPosition) {
    const keys = this.groups.map(v => v.key);
    keys.splice(
      keys.findIndex(key => key === groupKey),
      1
    );
    const index = insertPositionToIndex(position, keys, key => key);
    keys.splice(index, 0, groupKey);
    this.changeGroupSort(keys);
  }

  removeFromGroup(rowId: string, key: string) {
    const columnId = this.columnId;
    const remove = this.groupConfig()?.removeFromGroup ?? (() => undefined);
    const newValue = remove(
      this.groupMap[key].value,
      this.viewManager.cellGetJsonValue(rowId, columnId)
    );
    this.viewManager.cellUpdateValue(rowId, columnId, newValue);
  }

  updateValue(rows: string[], value: unknown) {
    rows.forEach(id => {
      this.viewManager.cellUpdateValue(id, this.columnId, value);
    });
  }

  get addGroup() {
    return this.viewManager.columnGetMeta(this.column.type).model.ops.addGroup;
  }

  get column() {
    return this.viewManager.columnGet(this.groupBy.columnId);
  }

  get columnId() {
    return this.groupBy.columnId;
  }

  get data() {
    return this.viewManager.columnGetData(this.columnId);
  }

  get dataType() {
    return this.viewManager.columnGetDataType(this.groupBy.columnId);
  }

  get type() {
    return this.viewManager.columnGetType(this.columnId);
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
