import { createUniComponentFromWebComponent } from '../../core/index.js';
import { createIcon } from '../../core/utils/uni-icon.js';
import { kanbanViewModel } from './define.js';
import { DataViewKanban } from './kanban-view.js';

export const kanbanViewMeta = kanbanViewModel.createMeta({
  icon: createIcon('DatabaseKanbanViewIcon'),
  view: createUniComponentFromWebComponent(DataViewKanban),
});
