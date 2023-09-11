import type { KanbanGroupProperty } from '../../kanban/define.js';
import type { KanbanGroupData } from '../../kanban/kanban-view-manager.js';
import type { TType } from '../../logical/typesystem.js';
import type { InsertPosition } from '../../types.js';
import { insertPositionToIndex } from '../../utils/insert.js';
import type { DataViewManager } from '../data-view-manager.js';
import type { GroupBy } from '../types.js';
import type { GroupByConfig } from './matcher.js';
import { groupByMatcher } from './matcher.js';

export class GroupHelper {
  constructor(
    private groupBy: GroupBy,
    private properties: KanbanGroupProperty[],
    private _changeProperties: (properties: KanbanGroupProperty[]) => void,
    config: GroupByConfig,
    type: TType,
    private viewManager: DataViewManager
  ) {
    this.groupMap = Object.fromEntries(
      config.defaultKeys(type).map(({ key, value }) => [
        key,
        {
          key,
          name: config.groupName(type, value),
          helper: this,
          type,
          value,
          rows: [],
        },
      ])
    );
    this.viewManager.rows.forEach(id => {
      const value = this.viewManager.cellGetJsonValue(id, groupBy.columnId);
      const keys = config.valuesGroup(value, type);
      keys.forEach(({ key, value }) => {
        if (!this.groupMap[key]) {
          this.groupMap[key] = {
            key,
            name: config.groupName(type, value),
            helper: this,
            value,
            rows: [],
            type,
          };
        }
        this.groupMap[key].rows.push(id);
      });
    });
    const keys = new Set(Object.keys(this.groupMap));
    const groups: string[] = [];
    const processRowsSort = (key: string) => {
      const rowIds = new Set(this.groupMap[key].rows);
      const rowSort =
        this.properties.find(v => v.key === key)?.manuallyCardSort ?? [];
      const result: string[] = [];
      for (const id of rowSort) {
        if (rowIds.has(id)) {
          rowIds.delete(id);
          result.push(id);
        }
      }
      result.push(...rowIds);
      this.groupMap[key].rows = result;
    };
    for (const property of this.properties) {
      if (keys.has(property.key)) {
        keys.delete(property.key);
        groups.push(property.key);
      }
    }
    groups.push(...keys);
    groups.forEach(processRowsSort);
    this.groups = groups.map(key => this.groupMap[key]);
  }

  get dataType() {
    return this.viewManager.columnGetDataType(this.groupBy.columnId);
  }

  get column() {
    return this.viewManager.columnGet(this.groupBy.columnId);
  }

  get columnId() {
    return this.groupBy.columnId;
  }

  get type() {
    return this.viewManager.columnGetType(this.columnId);
  }

  get data() {
    return this.viewManager.columnGetData(this.columnId);
  }

  updateData = (data: NonNullable<unknown>) => {
    this.viewManager.columnUpdateData(this.columnId, data);
  };

  updateValue(rows: string[], value: unknown) {
    rows.forEach(id => {
      this.viewManager.cellUpdateValue(id, this.columnId, value);
    });
  }

  public readonly groups: KanbanGroupData[];
  public readonly groupMap: Record<string, KanbanGroupData>;

  groupConfig() {
    return groupByMatcher.findData(v => v.name === this.groupBy.name);
  }

  defaultGroupProperty(key: string): KanbanGroupProperty {
    return {
      key,
      hide: false,
      manuallyCardSort: [],
    };
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

  removeFromGroup(rowId: string, key: string) {
    const columnId = this.columnId;
    const remove = this.groupConfig()?.removeFromGroup ?? (() => undefined);
    const newValue = remove(
      this.groupMap[key].value,
      this.viewManager.cellGetJsonValue(rowId, columnId)
    );
    this.viewManager.cellUpdateValue(rowId, columnId, newValue);
  }

  changeCardSort(groupKey: string, cardIds: string[]) {
    const map = new Map(this.properties.map(v => [v.key, v]));
    const group =
      this.properties.find(v => v.key === groupKey) ??
      this.defaultGroupProperty(groupKey);
    this._changeProperties(
      this.groups.map(v => {
        if (v.key === groupKey) {
          return {
            ...group,
            manuallyCardSort: cardIds,
          };
        }
        return map.get(v.key) ?? this.defaultGroupProperty(v.key);
      })
    );
  }

  changeGroupSort(keys: string[]) {
    const map = new Map(this.properties.map(v => [v.key, v]));
    const newProperties = keys.map(key => {
      const property = map.get(key);
      if (property) {
        return property;
      }
      return {
        key,
        hide: false,
        manuallyCardSort: [],
      };
    });
    this._changeProperties(newProperties);
  }

  public moveGroupTo(groupKey: string, position: InsertPosition) {
    const keys = this.groups.map(v => v.key);
    keys.splice(
      keys.findIndex(key => key === groupKey),
      1
    );
    const index = insertPositionToIndex(position, keys, key => key);
    keys.splice(index, 0, groupKey);
    this.changeGroupSort(keys);
  }

  moveCardTo(
    rowId: string,
    fromGroupKey: string,
    toGroupKey: string,
    position: InsertPosition
  ) {
    if (fromGroupKey !== toGroupKey) {
      const columnId = this.columnId;
      const remove = this.groupConfig()?.removeFromGroup ?? (() => undefined);
      let newValue = remove(
        this.groupMap[fromGroupKey].value,
        this.viewManager.cellGetJsonValue(rowId, columnId)
      );
      const addTo = this.groupConfig()?.addToGroup ?? (value => value);
      newValue = addTo(this.groupMap[toGroupKey].value, newValue);
      this.viewManager.cellUpdateValue(rowId, columnId, newValue);
    }
    const rows = this.groupMap[toGroupKey].rows.filter(id => id !== rowId);
    const index = insertPositionToIndex(position, rows, id => id);
    rows.splice(index, 0, rowId);
    this.changeCardSort(toGroupKey, rows);
  }

  get addGroup() {
    return this.viewManager.columnConfigManager.getColumn(this.column.type).ops
      .addGroup;
  }
}
