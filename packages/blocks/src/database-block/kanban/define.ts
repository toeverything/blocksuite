import type { FilterGroup } from '../common/ast.js';
import { columnManager } from '../common/columns/manager.js';
import { multiSelectPureColumnConfig } from '../common/columns/multi-select/define.js';
import { numberPureColumnConfig } from '../common/columns/number/define.js';
import { selectPureColumnConfig } from '../common/columns/select/define.js';
import { textPureColumnConfig } from '../common/columns/text/define.js';
import { viewManager } from '../common/data-view.js';
import { groupByMatcher } from '../common/group-by/matcher.js';
import { defaultGroupBy } from '../common/group-by/util.js';
import type { GroupBy, GroupProperty, Sort } from '../common/types.js';
import type { Column } from '../table/types.js';

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
  sort?: Sort;
  header: {
    titleColumn?: string;
    iconColumn?: string;
    coverColumn?: string;
  };
  groupProperties: GroupProperty[];
};

viewManager.register('kanban', {
  defaultName: 'Kanban View',
  init(model, id, name) {
    const allowList = model.columns.filter(column => {
      const type = columnManager.getColumn(column.type).dataType(column.data);
      return !!groupByMatcher.match(type) && column.type !== 'title';
    });
    const getWeight = (column: Column) => {
      if (
        [
          selectPureColumnConfig.type,
          multiSelectPureColumnConfig.type,
        ].includes(column.type)
      ) {
        return 3;
      }
      if (
        [numberPureColumnConfig.type, textPureColumnConfig.type].includes(
          column.type
        )
      ) {
        return 2;
      }
      return 1;
    };
    const column = allowList.sort((a, b) => getWeight(b) - getWeight(a))[0];
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
      header: {
        titleColumn: model.columns.find(v => v.type === 'title')?.id,
        iconColumn: 'type',
      },
      groupProperties: [],
    };
  },
});
