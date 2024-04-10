import { viewRendererManager } from '../../common/data-view.js';
import { DataViewHeaderToolsAddRow } from '../../common/header/tools/add-row/add-row.js';
import { ExpandDatabaseBlockModal } from '../../common/header/tools/expand/index.js';
import { DataViewHeaderToolsFilter } from '../../common/header/tools/filter.js';
import { DataViewHeaderToolsSearch } from '../../common/header/tools/search.js';
import { DataViewHeaderToolsViewOptions } from '../../common/header/tools/view-options.js';
import { createUniComponentFromWebComponent } from '../../utils/uni-component/uni-component.js';
import { createIcon } from '../../utils/uni-icon.js';
import { DataViewTable } from './table-view.js';

viewRendererManager.register('table', {
  view: createUniComponentFromWebComponent(DataViewTable),
  icon: createIcon('DatabaseTableViewIcon'),
  tools: [
    createUniComponentFromWebComponent(DataViewHeaderToolsFilter),
    createUniComponentFromWebComponent(ExpandDatabaseBlockModal),
    createUniComponentFromWebComponent(DataViewHeaderToolsSearch),
    createUniComponentFromWebComponent(DataViewHeaderToolsViewOptions),
    createUniComponentFromWebComponent(DataViewHeaderToolsAddRow),
  ],
});
