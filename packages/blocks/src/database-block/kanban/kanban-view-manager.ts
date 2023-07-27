import type { DataSource } from '../../__internal__/datasource/base.js';
import type { FilterGroup } from '../common/ast.js';
import { groupByMatcher } from '../common/columns/group.js';
import type { DataViewManager } from '../common/data-view-manager.js';
import {
  BaseDataViewColumnManager,
  BaseDataViewManager,
} from '../common/data-view-manager.js';
import type { GroupBy, KanbanViewData } from '../common/view-manager.js';
import { defaultGroupBy } from '../common/view-manager.js';
import type { ViewSource } from '../common/view-source.js';
import { evalFilter } from '../logical/eval-filter.js';
import type { TType } from '../logical/typesystem.js';
import type { InsertPosition } from '../types.js';
import { insertPositionToIndex } from '../utils/insert.js';

export type KanbanGroupData = {
  key: string;
  helper: GroupHelper;
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

  checkGroup(columnId: string, type: TType, target: TType): boolean {
    if (!groupByMatcher.isMatched(type, target)) {
      this.changeGroup(columnId);
      return false;
    }
    return true;
  }

  changeGroup(columnId: string) {
    const column = this.columnGet(columnId);
    this.updateView(view => {
      return {
        groupBy: defaultGroupBy(column.id, column.type, column.data),
      };
    });
  }

  public get groups(): KanbanGroupData[] | undefined {
    const groupBy = this.view.groupBy;
    if (!groupBy) {
      return;
    }
    const helper = new GroupHelper(groupBy, this);
    const result = groupByMatcher.find(v => v.data.name === groupBy.name);
    if (!result) {
      return;
    }
    const groupByConfig = result.data;
    const type = this.columnGetDataType(groupBy.columnId);
    if (!this.checkGroup(groupBy.columnId, result.type, type)) {
      // reset groupBy config
      return this.groups;
    }
    const groupMap: Record<string, KanbanGroupData> = Object.fromEntries(
      groupByConfig.defaultKeys(type).map(({ key, value }) => [
        key,
        {
          key,
          helper,
          type,
          value,
          rows: [],
        },
      ])
    );
    this.rows.forEach(id => {
      const value = this.cellGetFilterValue(id, groupBy.columnId);
      const keys = groupByConfig.valuesGroup(value, type);
      keys.forEach(({ key, value }) => {
        if (!groupMap[key]) {
          groupMap[key] = {
            key,
            helper,
            value,
            rows: [],
            type,
          };
        }
        groupMap[key].rows.push(id);
      });
    });
    return Object.values(groupMap);
  }

  public addCard(position: InsertPosition, group: KanbanGroupData) {
    const id = this.rowAdd(position);
    group.helper.addToGroup(id, group.value);
  }
}

export class DataViewKanbanColumnManager extends BaseDataViewColumnManager {
  constructor(propertyId: string, override viewManager: DataViewKanbanManager) {
    super(propertyId, viewManager);
  }
}

class GroupHelper {
  get dataType() {
    return this.viewManager.columnGetDataType(this.groupBy.columnId);
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

  constructor(private groupBy: GroupBy, private viewManager: DataViewManager) {}

  groupData() {
    return groupByMatcher.findData(v => v.name === this.groupBy.name);
  }

  addToGroup(rowId: string, value: unknown) {
    const columnId = this.columnId;
    const addTo = this.groupData()?.addToGroup ?? (value => value);
    const newValue = addTo(
      value,
      this.viewManager.cellGetFilterValue(rowId, columnId)
    );
    this.viewManager.cellUpdateValue(rowId, columnId, newValue);
  }

  removeFromGroup(rowId: string, value: unknown) {
    //
  }

  moveTo(rowId: string, fromGroupValue: unknown, toGroupValue: unknown) {
    this.removeFromGroup(rowId, fromGroupValue);
    this.addToGroup(rowId, toGroupValue);
  }
}
