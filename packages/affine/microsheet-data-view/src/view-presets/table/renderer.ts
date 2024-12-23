import { createUniComponentFromWebComponent } from '../../core/utils/uni-component/uni-component.js';
import { createIcon } from '../../core/utils/uni-icon.js';
import { tableViewModel } from './define.js';
import { DataViewTable } from './table-view.js';

export const tableViewMeta = tableViewModel.createMeta({
  view: createUniComponentFromWebComponent(DataViewTable),
  icon: createIcon('DatabaseTableViewIcon'),
});
