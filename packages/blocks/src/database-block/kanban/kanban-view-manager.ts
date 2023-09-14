import type { DataSource } from '../../__internal__/datasource/base.js';
import type { FilterGroup } from '../common/ast.js';
import type { CellRenderer } from '../common/columns/manager.js';
import type { RealDataViewDataTypeMap } from '../common/data-view.js';
import type { DataViewManager } from '../common/data-view-manager.js';
import {
  BaseDataViewColumnManager,
  BaseDataViewManager,
} from '../common/data-view-manager.js';
import type { GroupByConfig } from '../common/group-by/matcher.js';
import { groupByMatcher } from '../common/group-by/matcher.js';
import { defaultGroupBy } from '../common/group-by/util.js';
import type { GroupBy } from '../common/types.js';
import type { SingleViewSource } from '../common/view-source.js';
import { evalFilter } from '../logical/eval-filter.js';
import type { TType } from '../logical/typesystem.js';
import type { InsertPosition } from '../types.js';
import { insertPositionToIndex } from '../utils/insert.js';
import type { KanbanGroupProperty } from './define.js';
import { headerRenderer } from './header-cell.js';

export type KanbanGroupData = {
  key: string;
  name: string;
  helper: GroupHelper;
  type: TType;
  value: unknown;
  rows: string[];
};
type KanbanViewData = RealDataViewDataTypeMap['kanban'];

export class DataViewKanbanManager extends BaseDataViewManager {
  private readonly updateView: (
    updater: (view: KanbanViewData) => Partial<KanbanViewData>
  ) => void;

  constructor(
    private viewSource: SingleViewSource<KanbanViewData>,
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
  public override rowMove(rowId: string, position: InsertPosition): void {
    this.dataSource.rowMove(rowId, position);
  }

  public get columns(): string[] {
    return this.columnsWithoutFilter.filter(id => !this.columnGetHide(id));
  }

  public get detailColumns(): string[] {
    return this.columnsWithoutFilter.filter(
      id => this.columnGetType(id) !== 'title'
    );
  }

  public get columnsWithoutFilter(): string[] {
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
          column.getJsonValue(rowId),
        ])
      );
      return evalFilter(this.filter, rowMap);
    }
    return true;
  }

  override get readonly(): boolean {
    return this.viewSource.readonly;
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
    this.updateView(_view => {
      return {
        groupBy: defaultGroupBy(column.id, column.type, column.data),
      };
    });
  }

  public get groupHelper(): GroupHelper | undefined {
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
    return new GroupHelper(
      groupBy,
      this.view.groupProperties,
      properties => {
        this.updateView(_v => {
          return {
            groupProperties: properties,
          };
        });
      },
      groupByConfig,
      type,
      this
    );
  }

  public addCard(position: InsertPosition, group: string) {
    const id = this.rowAdd(position);
    this.groupHelper?.addToGroup(id, group);
    return id;
  }

  public get type(): string {
    return this.view.mode;
  }

  public get header() {
    return this.view.header;
  }

  public isInHeader(columnId: string) {
    const hd = this.view.header;

    return (
      hd.titleColumn === columnId ||
      hd.iconColumn === columnId ||
      hd.coverColumn === columnId
    );
  }

  public hasHeader(_rowId: string): boolean {
    const hd = this.view.header;
    return !!hd.titleColumn || !!hd.iconColumn || !!hd.coverColumn;
  }

  public getHeaderTitle(
    _rowId: string
  ): DataViewKanbanColumnManager | undefined {
    const columnId = this.view.header.titleColumn;
    if (!columnId) {
      return;
    }
    return this.columnGet(columnId);
  }

  public getHeaderIcon(
    _rowId: string
  ): DataViewKanbanColumnManager | undefined {
    const columnId = this.view.header.iconColumn;
    if (!columnId) {
      return;
    }
    return this.columnGet(columnId);
  }

  public getHeaderCover(
    _rowId: string
  ): DataViewKanbanColumnManager | undefined {
    const columnId = this.view.header.coverColumn;
    if (!columnId) {
      return;
    }
    return this.columnGet(columnId);
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

  columnGetHide(columnId: string): boolean {
    return this.view.columns.find(v => v.id === columnId)?.hide ?? false;
  }

  public duplicateView(): void {
    this.viewSource.duplicate();
  }
  public deleteView(): void {
    this.viewSource.delete();
  }

  public get isDeleted(): boolean {
    return this.viewSource.isDeleted();
  }
}

export class DataViewKanbanColumnManager extends BaseDataViewColumnManager {
  constructor(
    propertyId: string,
    override dataViewManager: DataViewKanbanManager
  ) {
    super(propertyId, dataViewManager);
  }

  public override get renderer(): CellRenderer {
    if (this.id === this.dataViewManager.header.titleColumn) {
      return headerRenderer;
    }
    return super.renderer;
  }
}

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
      const group = this.groupMap[fromGroupKey];
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

  get addGroup() {
    return this.viewManager.columnConfigManager.getColumn(this.column.type).ops
      .addGroup;
  }
}
