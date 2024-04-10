import type { FilterGroup } from '../../../common/ast.js';
import type { GroupBy, GroupProperty, Sort } from '../../../common/types.js';
import { type BasicViewDataType, viewType } from '../../data-view.js';
import { DataViewTableManager } from './table-view-manager.js';

export const tableViewType = viewType('table');

declare global {
  interface DataViewDataTypeMap {
    table: DataType;
  }
}
export type TableViewColumn = {
  id: string;
  width: number;
  hide?: boolean;
};
type DataType = {
  columns: TableViewColumn[];
  filter: FilterGroup;
  groupBy?: GroupBy;
  groupProperties?: GroupProperty[];
  sort?: Sort;
  header?: {
    titleColumn?: string;
    iconColumn?: string;
    imageColumn?: string;
  };
};
export type TableViewData = BasicViewDataType<
  typeof tableViewType.type,
  DataType
>;
export const tableViewModel = tableViewType.modelConfig<TableViewData>({
  defaultName: 'Table View',
  dataViewManager: DataViewTableManager,
  init(_columnMetaMap, model, id, name) {
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
      header: {
        titleColumn: model.columns.find(v => v.type === 'title')?.id,
        iconColumn: 'type',
      },
    };
  },
});
