import type { FilterGroup } from '../../../common/ast.js';
import type { GroupBy, GroupProperty, Sort } from '../../../common/types.js';
import type { StatCalcOpType } from './types.js';

import { type BasicViewDataType, viewType } from '../../data-view.js';
import { DataViewTableManager } from './table-view-manager.js';

export const tableViewType = viewType('table');

declare global {
  interface DataViewDataTypeMap {
    table: DataType;
  }
}
export type TableViewColumn = {
  hide?: boolean;
  id: string;
  statCalcType?: StatCalcOpType;
  width: number;
};
type DataType = {
  columns: TableViewColumn[];
  filter: FilterGroup;
  groupBy?: GroupBy;
  groupProperties?: GroupProperty[];
  header?: {
    iconColumn?: string;
    imageColumn?: string;
    titleColumn?: string;
  };
  sort?: Sort;
};
export type TableViewData = BasicViewDataType<
  typeof tableViewType.type,
  DataType
>;
export const tableViewModel = tableViewType.modelConfig<TableViewData>({
  dataViewManager: DataViewTableManager,
  defaultName: 'Table View',
});
