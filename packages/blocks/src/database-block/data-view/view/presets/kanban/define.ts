import { multiSelectColumnModelConfig } from '../../../column/presets/multi-select/define.js';
import { numberColumnModelConfig } from '../../../column/presets/number/define.js';
import { selectColumnModelConfig } from '../../../column/presets/select/define.js';
import { textColumnModelConfig } from '../../../column/presets/text/define.js';
import type { FilterGroup } from '../../../common/ast.js';
import { groupByMatcher } from '../../../common/group-by/matcher.js';
import type { GroupBy, GroupProperty, Sort } from '../../../common/types.js';
import { defaultGroupBy } from '../../../common/view-manager.js';
import { type BasicViewDataType, viewType } from '../../data-view.js';
import type { Column } from '../table/types.js';
import { DataViewKanbanManager } from './kanban-view-manager.js';

export const kanbanViewType = viewType('kanban');

declare global {
  interface DataViewDataTypeMap {
    kanban: DataType;
  }
}
export type KanbanViewColumn = {
  id: string;
  hide?: boolean;
};

type DataType = {
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
export type KanbanViewData = BasicViewDataType<
  typeof kanbanViewType.type,
  DataType
>;
export const kanbanViewModel = kanbanViewType.modelConfig<KanbanViewData>({
  defaultName: 'Kanban View',
  dataViewManager: DataViewKanbanManager,
  init(columnMetaMap, model, id, name) {
    const allowList = model.columns.filter(column => {
      const type = columnMetaMap[column.type].model.dataType(column.data);
      return !!groupByMatcher.match(type) && column.type !== 'title';
    });
    const getWeight = (column: Column) => {
      if (
        [
          selectColumnModelConfig.type as string,
          multiSelectColumnModelConfig.type,
        ].includes(column.type)
      ) {
        return 3;
      }
      if (
        [
          numberColumnModelConfig.type as string,
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
