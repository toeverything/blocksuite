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
  hide?: boolean;
  id: string;
};

type DataType = {
  columns: KanbanViewColumn[];
  filter: FilterGroup;
  groupBy?: GroupBy;
  groupProperties: GroupProperty[];
  header: {
    coverColumn?: string;
    iconColumn?: string;
    titleColumn?: string;
  };
  sort?: Sort;
};
export type KanbanViewData = BasicViewDataType<
  typeof kanbanViewType.type,
  DataType
>;
export const kanbanViewModel = kanbanViewType.modelConfig<KanbanViewData>({
  dataViewManager: DataViewKanbanManager,
  defaultName: 'Kanban View',
});
