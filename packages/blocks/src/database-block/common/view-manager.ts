import type { BaseBlockModel } from '@blocksuite/store';

import { DEFAULT_COLUMN_WIDTH } from '../table/consts.js';
import type { Column } from '../types.js';
import type { FilterGroup } from './filter/index.js';

export type TableViewColumn = {
  id: string;
  width: number;
  hide?: boolean;
};
export type TableMixColumn<
  Data extends Record<string, unknown> = Record<string, unknown>
> = TableViewColumn & Column<Data>;
export type DatabaseModeMap = {
  table: {
    columns: TableViewColumn[];
    filter: FilterGroup;
  };
  kanban: {
    columns: {
      id: string;
      hide?: boolean;
    }[];
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

export type DatabaseViewData = DatabaseViewDataMap[keyof DatabaseViewDataMap];

type ViewOperation<Data> = {
  addColumn(
    model: BaseBlockModel,
    view: Data,
    newColumn: Column,
    index?: number
  ): void;
};
export const ViewOperationMap: {
  [K in keyof DatabaseViewDataMap]: ViewOperation<DatabaseViewDataMap[K]>;
} = {
  kanban: {
    addColumn(model, view, newColumn) {
      //Nothing to do
    },
  },
  table: {
    addColumn(model, view, newColumn, index) {
      if (index != null) {
        view.columns.splice(index, 0, {
          id: newColumn.id,
          width: DEFAULT_COLUMN_WIDTH,
        });
      } else {
        view.columns.push({
          id: newColumn.id,
          width: DEFAULT_COLUMN_WIDTH,
        });
      }
    },
  },
};
