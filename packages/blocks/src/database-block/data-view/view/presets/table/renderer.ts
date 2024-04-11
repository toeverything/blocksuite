import { createUniComponentFromWebComponent } from '../../../utils/uni-component/index.js';
import { createIcon } from '../../../utils/uni-icon.js';
import { tableViewModel } from './define.js';
import { DataViewTable } from './table-view.js';

export const tableViewConfig = tableViewModel.rendererConfig({
  view: createUniComponentFromWebComponent(DataViewTable),
  icon: createIcon('DatabaseTableViewIcon'),
});
