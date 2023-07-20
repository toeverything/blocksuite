import type { DatabaseBlockModel } from '../database-model.js';
import { DEFAULT_COLUMN_WIDTH } from '../table/consts.js';
import type { Column, InsertPosition } from '../types.js';
import { insertPositionToIndex } from '../utils/insert.js';
import type { FilterGroup } from './ast.js';

export type TableViewColumn = {
  id: string;
  width: number;
  hide?: boolean;
};

export type KanbanViewColumn = {
  id: string;
  hide?: boolean;
};
export type DatabaseModeMap = {
  table: {
    columns: TableViewColumn[];
    filter: FilterGroup;
  };
  kanban: {
    columns: KanbanViewColumn[];
    filter: FilterGroup;
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
export const ViewOperationMap: {
  [K in keyof DatabaseViewDataMap]: ViewOperation<DatabaseViewDataMap[K]>;
} = {
  kanban: {
    init(model, id, name) {
      return {
        id,
        name,
        mode: 'kanban',
        columns: model.columns.map(v => ({ id: v.id, hide: false })),
        filter: { type: 'group', op: 'and', conditions: [] },
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
