import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';

import type { GroupBy, GroupProperty } from '../../core/common/types.js';
import type { FilterGroup } from '../../core/filter/types.js';
import type { Sort } from '../../core/sort/types.js';

import { defaultGroupBy, groupByMatcher, t } from '../../core/index.js';
import { type BasicViewDataType, viewType } from '../../core/view/data-view.js';
import { KanbanSingleView } from './kanban-view-manager.js';

export const kanbanViewType = viewType('kanban');

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
export const kanbanViewModel = kanbanViewType.createModel<KanbanViewData>({
  defaultName: 'Kanban View',
  dataViewManager: KanbanSingleView,
  defaultData: viewManager => {
    const columns = viewManager.dataSource.properties$.value;
    const allowList = columns.filter(columnId => {
      const dataType = viewManager.dataSource.propertyDataTypeGet(columnId);
      return dataType && !!groupByMatcher.match(dataType);
    });
    const getWeight = (columnId: string) => {
      const dataType = viewManager.dataSource.propertyDataTypeGet(columnId);
      if (!dataType || t.string.is(dataType) || t.richText.is(dataType)) {
        return 0;
      }
      if (t.tag.is(dataType)) {
        return 3;
      }
      if (t.array.is(dataType)) {
        return 2;
      }
      return 1;
    };
    const columnId = allowList.sort((a, b) => getWeight(b) - getWeight(a))[0];
    const type = viewManager.dataSource.propertyTypeGet(columnId);
    const meta = type && viewManager.dataSource.propertyMetaGet(type);
    const data = viewManager.dataSource.propertyDataGet(columnId);
    if (!columnId || !meta || !data) {
      throw new BlockSuiteError(
        ErrorCode.DatabaseBlockError,
        'not implement yet'
      );
    }
    return {
      columns: columns.map(id => ({
        id: id,
        hide: false,
      })),
      filter: {
        type: 'group',
        op: 'and',
        conditions: [],
      },
      groupBy: defaultGroupBy(meta, columnId, data),
      header: {
        titleColumn: viewManager.dataSource.properties$.value.find(
          id => viewManager.dataSource.propertyTypeGet(id) === 'title'
        ),
        iconColumn: 'type',
      },
      groupProperties: [],
    };
  },
});
