import { createIcon } from '../../components/icon/uni-icon.js';
import { createUniComponentFromWebComponent } from '../../components/uni-component/uni-component.js';
import type { FilterGroup } from '../common/ast.js';
import { viewManager } from '../common/data-view.js';
import { DatabaseTable } from './table-view.js';

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
};
viewManager.register('table', {
  view: createUniComponentFromWebComponent(DatabaseTable),
  icon: createIcon('DatabaseTableViewIcon'),
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
    };
  },
});
