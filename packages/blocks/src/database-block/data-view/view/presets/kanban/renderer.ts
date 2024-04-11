import { createUniComponentFromWebComponent } from '../../../utils/uni-component/index.js';
import { createIcon } from '../../../utils/uni-icon.js';
import { kanbanViewModel } from './define.js';
import { DataViewKanban } from './kanban-view.js';

export const kanbanViewConfig = kanbanViewModel.rendererConfig({
  icon: createIcon('DatabaseKanbanViewIcon'),
  view: createUniComponentFromWebComponent(DataViewKanban),
});
