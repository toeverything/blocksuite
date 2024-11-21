import { createUniComponentFromWebComponent } from '../../core/utils/uni-component/uni-component.js';
import { createIcon } from '../../core/utils/uni-icon.js';
import { tableViewModel } from './define.js';
import { MobileDataViewTable } from './mobile/table-view.js';
import { DataViewTable } from './pc/table-view.js';

export const tableViewMeta = tableViewModel.createMeta({
  view: createUniComponentFromWebComponent(DataViewTable),
  mobileView: createUniComponentFromWebComponent(MobileDataViewTable),
  icon: createIcon('DatabaseTableViewIcon'),
});
