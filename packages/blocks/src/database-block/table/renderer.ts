import { createIcon } from '../../components/icon/uni-icon.js';
import { createUniComponentFromWebComponent } from '../../components/uni-component/uni-component.js';
import { viewRendererManager } from '../common/data-view.js';
import { DataViewHeaderToolsAddRow } from '../common/header/tools/add-row.js';
import { DataViewHeaderToolsFilter } from '../common/header/tools/filter.js';
import { DataViewHeaderToolsSearch } from '../common/header/tools/search.js';
import { DataViewHeaderToolsViewOptions } from '../common/header/tools/view-options.js';
import { DatabaseTable } from './table-view.js';

viewRendererManager.register('table', {
  view: createUniComponentFromWebComponent(DatabaseTable),
  icon: createIcon('DatabaseTableViewIcon'),
  tools: [
    createUniComponentFromWebComponent(DataViewHeaderToolsFilter),
    createUniComponentFromWebComponent(DataViewHeaderToolsSearch),
    createUniComponentFromWebComponent(DataViewHeaderToolsViewOptions),
    createUniComponentFromWebComponent(DataViewHeaderToolsAddRow),
  ],
});
