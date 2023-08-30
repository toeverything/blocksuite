import { createIcon } from '../../components/icon/uni-icon.js';
import { createUniComponentFromWebComponent } from '../../components/uni-component/uni-component.js';
import { viewRendererManager } from '../common/data-view.js';
import { DataViewHeaderToolsFilter } from '../common/header/tools/filter.js';
import { DataViewHeaderToolsSearch } from '../common/header/tools/search.js';
import { DataViewHeaderToolsViewOptions } from '../common/header/tools/view-options.js';
import { DataViewKanban } from './kanban-view.js';

viewRendererManager.register('kanban', {
  icon: createIcon('DatabaseKanbanViewIcon'),
  view: createUniComponentFromWebComponent(DataViewKanban),
  tools: [
    createUniComponentFromWebComponent(DataViewHeaderToolsFilter),
    createUniComponentFromWebComponent(DataViewHeaderToolsSearch),
    createUniComponentFromWebComponent(DataViewHeaderToolsViewOptions),
  ],
});
