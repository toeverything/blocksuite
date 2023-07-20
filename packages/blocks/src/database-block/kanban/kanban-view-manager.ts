import type { Slot } from '@blocksuite/store';

import type { DataSource } from '../../__internal__/datasource/base.js';
import type { FilterGroup } from '../common/ast.js';
import {
  BaseDataViewColumnManager,
  BaseDataViewManager,
} from '../common/data-view-manager.js';
import type { KanbanViewData } from '../common/view-manager.js';
import { evalFilter } from '../logical/eval-filter.js';
import type { InsertPosition } from '../types.js';
import { insertPositionToIndex } from '../utils/insert.js';

export class DataViewKanbanManager extends BaseDataViewManager {
  private readonly updateView: (
    updater: (view: KanbanViewData) => Partial<KanbanViewData>
  ) => void;

  constructor(
    private getView: () => KanbanViewData,
    private ____updateView: (
      updater: (view: KanbanViewData) => Partial<KanbanViewData>
    ) => void,
    viewUpdatedSlot: Slot,
    dataSource: DataSource
  ) {
    super(dataSource);
    this.updateView = updater => {
      this.syncView();
      ____updateView(updater);
    };
    viewUpdatedSlot.pipe(this.slots.update);
  }

  get filter(): FilterGroup {
    return this.getView().filter;
  }

  get id() {
    return this.getView().id;
  }

  get name(): string {
    return this.getView().name;
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
    if (this.getView().columns.length === this.columns.length) {
      return;
    }
    this.____updateView(view => {
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
    this.getView().columns.forEach(v => {
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

  public get groups(): {
    type: string;
    value: unknown;
  }[] {
    return [];
  }
}

export class DataViewKanbanColumnManager extends BaseDataViewColumnManager {
  constructor(propertyId: string, override viewManager: DataViewKanbanManager) {
    super(propertyId, viewManager);
  }
}
