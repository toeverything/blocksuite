import type { FilterGroup } from '../common/ast.js';
import { viewManager } from '../common/data-view.js';

declare global {
  interface DataViewDataTypeMap {
    table: TableViewData;
  }
}
export type TableViewColumn = {
  id: string;
  width: number;
  hide?: boolean;
};

export type TableViewData = {
  columns: TableViewColumn[];
  filter: FilterGroup;
  header?: {
    titleColumn?: string;
    iconColumn?: string;
    imageColumn?: string;
  };
};
viewManager.register('table', {
  defaultName: 'Table View',
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
      header: {
        titleColumn: model.columns.find(v => v.type === 'title')?.id,
        iconColumn: 'type',
      },
    };
  },
});
