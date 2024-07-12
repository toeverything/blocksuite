import type { FilterGroup } from '../../../common/ast.js';
import type { GroupBy, GroupProperty, Sort } from '../../../common/types.js';

import { type BasicViewDataType, viewType } from '../../data-view.js';
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
});
