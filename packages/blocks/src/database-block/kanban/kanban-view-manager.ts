import type { DataSource } from '../../__internal__/datasource/base.js';
import type { FilterGroup } from '../common/ast.js';
import type { CellRenderer } from '../common/columns/manager.js';
import type { RealDataViewDataTypeMap } from '../common/data-view.js';
import {
  BaseDataViewColumnManager,
  BaseDataViewManager,
} from '../common/data-view-manager.js';
import { GroupHelper } from '../common/group-by/helper.js';
import { groupByMatcher } from '../common/group-by/matcher.js';
import { defaultGroupBy } from '../common/group-by/util.js';
import type { SingleViewSource } from '../common/view-source.js';
import { evalFilter } from '../logical/eval-filter.js';
import type { TType } from '../logical/typesystem.js';
import type { InsertPosition } from '../types.js';
import { insertPositionToIndex } from '../utils/insert.js';
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
