import type { DatabaseBlockModel } from '../database-model.js';
import { tTag } from '../logical/data-type.js';
import { isTArray } from '../logical/typesystem.js';
import { DEFAULT_COLUMN_WIDTH } from '../table/consts.js';
import type { Column, InsertPosition } from '../types.js';
import { insertPositionToIndex } from '../utils/insert.js';
import type { FilterGroup } from './ast.js';
import { columnManager } from './columns/manager.js';
import { groupByMatcher } from './groupBy/matcher.js';

export type TableViewColumn = {
  id: string;
  width: number;
  hide?: boolean;
};

export type KanbanViewColumn = {
  id: string;
  hide?: boolean;
};
export type GroupBy = {
  type: 'groupBy';
  columnId: string;
  name: string;
};
export type DatabaseModeMap = {
  table: {
    columns: TableViewColumn[];
    filter: FilterGroup;
  };
  kanban: {
    columns: KanbanViewColumn[];
    filter: FilterGroup;
    groupBy?: GroupBy;
  };
};
export type DatabaseViewDataMap = {
  [K in keyof DatabaseModeMap]: DatabaseModeMap[K] & {
    id: string;
    name: string;
    mode: K;
  };
};
type Pretty<T> = { [K in keyof T]: T[K] };
export type TableViewData = Pretty<DatabaseViewDataMap['table']>;
export type KanbanViewData = Pretty<DatabaseViewDataMap['kanban']>;

export type DatabaseViewData = DatabaseViewDataMap[keyof DatabaseViewDataMap];

type ViewOperation<Data> = {
  init(model: DatabaseBlockModel, id: string, name: string): Data;
  addColumn(
    model: DatabaseBlockModel,
    view: Data,
    newColumn: Column,
    position: InsertPosition
  ): void;
  deleteColumn(model: DatabaseBlockModel, view: Data, id: string): void;
};

export const defaultGroupBy = (
  columnId: string,
  type: string,
  data: NonNullable<unknown>
): GroupBy | undefined => {
  const name = groupByMatcher.match(
    columnManager.getColumn(type).dataType(data)
  )?.name;
  return name != null
    ? {
        type: 'groupBy',
        columnId: columnId,
        name: name,
      }
    : undefined;
};
export const ViewOperationMap: {
  [K in keyof DatabaseViewDataMap]: ViewOperation<DatabaseViewDataMap[K]>;
} = {
  kanban: {
    init(model, id, name) {
      const column = model.columns.find(column => {
        const type = columnManager.getColumn(column.type).dataType(column.data);
        return !!(tTag.is(type) || (isTArray(type) && tTag.is(type.ele)));
      });
      if (!column) {
        throw new Error('not implement yet');
      }
      return {
        id,
        name,
        mode: 'kanban',
        columns: model.columns.map(v => ({
          id: v.id,
          hide: false,
        })),
        filter: {
          type: 'group',
          op: 'and',
          conditions: [],
        },
        groupBy: defaultGroupBy(column.id, column.type, column.data),
      };
    },
    addColumn(model, view, newColumn) {
      //Nothing to do
    },
    deleteColumn(model, view, id) {
      //Nothing to do
    },
  },
  table: {
    init(model, id, name) {
      return {
        id,
        name,
        mode: 'table',
        columns: [],
        filter: {
          type: 'group',
          op: 'and',
          conditions: [],
        },
      };
    },
    addColumn(model, view, newColumn, position) {
      view.columns.splice(insertPositionToIndex(position, view.columns), 0, {
        id: newColumn.id,
        width: DEFAULT_COLUMN_WIDTH,
      });
    },
    deleteColumn(model, view, id) {
      const index = view.columns.findIndex(c => c.id === id);
      if (index >= 0) {
        view.columns.splice(index, 1);
      }
    },
  },
};
