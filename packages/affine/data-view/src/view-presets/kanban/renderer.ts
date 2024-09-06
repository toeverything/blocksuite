import { createUniComponentFromWebComponent } from '../../core/index.js';
import { createIcon } from '../../core/utils/uni-icon.js';
import { kanbanViewModel } from './define.js';
import { DataViewKanban } from './kanban-view.js';

export const kanbanViewConfig = kanbanViewModel.rendererConfig({
  icon: createIcon('DatabaseKanbanViewIcon'),
  view: createUniComponentFromWebComponent(DataViewKanban),
});
