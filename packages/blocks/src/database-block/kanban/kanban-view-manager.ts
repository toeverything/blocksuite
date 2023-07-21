import type { DataSource } from '../../__internal__/datasource/base.js';
import type { FilterGroup, VariableOrProperty } from '../common/ast.js';
import type { DataViewManager } from '../common/data-view-manager.js';
import {
  BaseDataViewColumnManager,
  BaseDataViewManager,
} from '../common/data-view-manager.js';
import type { KanbanViewData } from '../common/view-manager.js';
import type { ViewSource } from '../common/view-source.js';
import { evalFilter } from '../logical/eval-filter.js';
import type { TType } from '../logical/typesystem.js';
import { isTArray } from '../logical/typesystem.js';
import { defaultKey, value2key } from '../logical/value2key.js';
import type { InsertPosition } from '../types.js';
import { insertPositionToIndex } from '../utils/insert.js';

export type KanbanGroupData = {
  type: TType;
  value: unknown;
  rows: string[];
};

export class DataViewKanbanManager extends BaseDataViewManager {
  private readonly updateView: (
    updater: (view: KanbanViewData) => Partial<KanbanViewData>
  ) => void;

  constructor(
    private viewSource: ViewSource<KanbanViewData>,
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
        columns: this.columnManagerList.map((column, i) => ({
          id: column.id,
          hide: column.hide,
        })),
      };
    });
  }

  public columnGet(columnId: string): DataViewKanbanColumnManager {
    return new DataViewKanbanColumnManager(columnId, this);
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

  public get columns(): string[] {
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
          column.getFilterValue(rowId),
        ])
      );
      return evalFilter(this.filter, rowMap);
    }
    return true;
  }

  cache?: {
    groupBy?: VariableOrProperty;
    helper?: GroupHelper;
  };

  private get groupHelper() {
    const groupBy = this.view.groupBy;
    if (this.cache?.groupBy !== groupBy) {
      this.cache = {
        groupBy,
        helper: groupBy ? new GroupHelper(groupBy, this) : undefined,
      };
    }
    return this.cache?.helper;
  }

  public get groups(): KanbanGroupData[] | undefined {
    const groupBy = this.view.groupBy;
    if (!groupBy) {
      return;
    }
    if (groupBy.type === 'ref') {
      const type = this.columnGetDataType(groupBy.name);
      const groupMap: Record<string, KanbanGroupData> = Object.fromEntries(
        defaultKey(type).map(([key, value]) => [
          key,
          {
            type,
            value,
            rows: [],
          },
        ])
      );
      this.rows.forEach(id => {
        const columnId = groupBy.name;
        const value = this.cellGetValue(id, columnId);
        const keys = value2key(value, type);
        keys.forEach(([key, value]) => {
          if (!groupMap[key]) {
            groupMap[key] = {
              value,
              rows: [],
              type,
            };
          }
          groupMap[key].rows.push(id);
        });
      });
      console.log(groupMap);
      return Object.values(groupMap);
    }
    return [];
  }

  public addCard(position: InsertPosition, group: KanbanGroupData) {
    const id = this.rowAdd(position);
    this.groupHelper?.addToGroup(id, group.value);
  }
}

export class DataViewKanbanColumnManager extends BaseDataViewColumnManager {
  constructor(propertyId: string, override viewManager: DataViewKanbanManager) {
    super(propertyId, viewManager);
  }
}

class GroupHelper {
  private getVarType(variable: VariableOrProperty) {
    if (variable?.type === 'ref') {
      return this.viewManager.columnGetDataType(variable.name);
    }
    throw new Error('not implement yet');
  }

  get columnId() {
    if (this.groupBy.type === 'ref') {
      return this.groupBy.name;
    } else {
      throw new Error('not implement yet');
    }
  }

  constructor(
    private groupBy: VariableOrProperty,
    private viewManager: DataViewManager
  ) {}

  addToGroup(rowId: string, value: unknown) {
    const columnId = this.columnId;
    const newValue = methodByType(this.getVarType(this.groupBy))?.addToGroup(
      this.viewManager.cellGetFilterValue(rowId, columnId),
      value
    );
    this.viewManager.cellUpdateValue(rowId, columnId, newValue);
  }

  removeFromGroup(rowId: string, value: unknown) {
    //
  }
}

export interface GroupByMethod {
  addToGroup(oldValue: unknown, groupValue: unknown): unknown;

  removeFromGroup(oldValue: unknown, groupValue: unknown): unknown;
}

export const methodByType = (type: TType): GroupByMethod | undefined => {
  if (isTArray(type)) {
    const ele = methodByType(type.ele);
    if (!ele) {
      throw new Error('this is a bug');
    }
    return new TArrayMethod(ele);
  }
  return new DefaultMethod();
};

class TArrayMethod implements GroupByMethod {
  public addToGroup(oldValue: unknown, groupValue: unknown): unknown {
    console.log(groupValue);
    const old = Array.isArray(oldValue) ? oldValue : [];
    return [...old, groupValue];
  }

  public removeFromGroup(oldValue: unknown, groupValue: unknown): unknown {
    const old = Array.isArray(oldValue) ? oldValue : [];
    return old.filter(v => v !== groupValue);
  }

  constructor(private eleMethod: GroupByMethod) {}
}

class DefaultMethod implements GroupByMethod {
  public addToGroup(oldValue: unknown, groupValue: unknown): unknown {
    return groupValue;
  }

  public removeFromGroup(oldValue: unknown, groupValue: unknown): unknown {
    return undefined;
  }
}
