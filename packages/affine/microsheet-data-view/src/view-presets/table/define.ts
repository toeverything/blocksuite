import type { FilterGroup } from '../../core/common/ast.js';
import type { GroupBy, GroupProperty, Sort } from '../../core/common/types.js';

import { type BasicViewDataType, viewType } from '../../core/view/data-view.js';
import { TableSingleView } from './table-view-manager.js';

export const tableViewType = viewType('table');

export type TableViewColumn = {
  id: string;
  width: number;
  statCalcType?: string;
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
export const tableViewModel = tableViewType.createModel<TableViewData>({
  defaultName: 'Table View',
  dataViewManager: TableSingleView,
  defaultData: viewManager => {
    return {
      mode: 'table',
      columns: [],
      filter: {
        type: 'group',
        op: 'and',
        conditions: [],
      },
      header: {
        titleColumn: viewManager.dataSource.properties$.value.find(
          id => viewManager.dataSource.propertyTypeGet(id) === 'title'
        ),
        iconColumn: 'type',
      },
    };
  },
});
