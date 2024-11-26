import { createUniComponentFromWebComponent } from '../../core/index.js';
import { createIcon } from '../../core/utils/uni-icon.js';
import { kanbanViewModel } from './define.js';
import { MobileDataViewKanban } from './mobile/kanban-view.js';
import { DataViewKanban } from './pc/kanban-view.js';

export const kanbanViewMeta = kanbanViewModel.createMeta({
  icon: createIcon('DatabaseKanbanViewIcon'),
  view: createUniComponentFromWebComponent(DataViewKanban),
  mobileView: createUniComponentFromWebComponent(MobileDataViewKanban),
});
