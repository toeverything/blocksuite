import { multiSelectPureColumnConfig } from '../../column/presets/multi-select/define.js';
import { numberPureColumnConfig } from '../../column/presets/number/define.js';
import { selectColumnModelConfig } from '../../column/presets/select/define.js';
import { textColumnModelConfig } from '../../column/presets/text/define.js';
import type { FilterGroup } from '../../common/ast.js';
import { viewManager } from '../../common/data-view.js';
import { groupByMatcher } from '../../common/group-by/matcher.js';
import type { GroupBy, GroupProperty, Sort } from '../../common/types.js';
import { defaultGroupBy } from '../../common/view-manager.js';
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
  init(columnMetaMap, model, id, name) {
    const allowList = model.columns.filter(column => {
      const type = columnMetaMap[column.type].model.dataType(column.data);
      return !!groupByMatcher.match(type) && column.type !== 'title';
    });
    const getWeight = (column: Column) => {
      if (
        [
          selectColumnModelConfig.type as string,
          multiSelectPureColumnConfig.type,
        ].includes(column.type)
      ) {
        return 3;
      }
      if (
        [
          numberPureColumnConfig.type as string,
          textColumnModelConfig.type,
        ].includes(column.type)
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
      groupBy: defaultGroupBy(
        columnMetaMap[column.type],
        column.id,
        column.data
      ),
      header: {
        titleColumn: model.columns.find(v => v.type === 'title')?.id,
        iconColumn: 'type',
      },
      groupProperties: [],
    };
  },
});
