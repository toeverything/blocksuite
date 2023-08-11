import type { FilterGroup } from '../common/ast.js';
import { columnManager } from '../common/columns/manager.js';
import { viewManager } from '../common/data-view.js';
import { defaultGroupBy } from '../common/groupBy/util.js';
import type { GroupBy } from '../common/types.js';
import { tTag } from '../logical/data-type.js';
import { isTArray } from '../logical/typesystem.js';

declare global {
  interface DataViewDataTypeMap {
    kanban: KanbanViewData;
  }
}
export type KanbanViewColumn = {
  id: string;
  hide?: boolean;
};

export type KanbanViewData = {
  columns: KanbanViewColumn[];
  filter: FilterGroup;
  groupBy?: GroupBy;
};

viewManager.register('kanban', {
  defaultName: 'Kanban View',
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
});
