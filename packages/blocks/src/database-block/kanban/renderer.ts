import { createIcon } from '../../components/icon/uni-icon.js';
import { createUniComponentFromWebComponent } from '../../components/uni-component/uni-component.js';
import { viewRendererManager } from '../common/data-view.js';
import { DataViewKanban } from './kanban-view.js';

viewRendererManager.register('kanban', {
  icon: createIcon('DatabaseKanbanViewIcon'),
  view: createUniComponentFromWebComponent(DataViewKanban),
});
