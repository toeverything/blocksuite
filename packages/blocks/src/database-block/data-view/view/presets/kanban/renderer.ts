import { ExpandDatabaseBlockModal } from '../../../common/header/tools/expand/index.js';
import { DataViewHeaderToolsFilter } from '../../../common/header/tools/filter.js';
import { DataViewHeaderToolsSearch } from '../../../common/header/tools/search.js';
import { DataViewHeaderToolsViewOptions } from '../../../common/header/tools/view-options.js';
import { createUniComponentFromWebComponent } from '../../../utils/uni-component/index.js';
import { createIcon } from '../../../utils/uni-icon.js';
import { kanbanViewModel } from './define.js';
import { DataViewKanban } from './kanban-view.js';

export const kanbanViewConfig = kanbanViewModel.rendererConfig({
  icon: createIcon('DatabaseKanbanViewIcon'),
  view: createUniComponentFromWebComponent(DataViewKanban),
  tools: [
    createUniComponentFromWebComponent(DataViewHeaderToolsFilter),
    createUniComponentFromWebComponent(ExpandDatabaseBlockModal),
    createUniComponentFromWebComponent(DataViewHeaderToolsSearch),
    createUniComponentFromWebComponent(DataViewHeaderToolsViewOptions),
  ],
});
