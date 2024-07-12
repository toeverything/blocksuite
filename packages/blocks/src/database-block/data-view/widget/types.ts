import type { DataSource } from '../common/data-source/base.js';
import type { ViewSource } from '../common/index.js';
import type { UniComponent } from '../utils/uni-component/index.js';
import type { DataViewExpose } from '../view/data-view.js';
import type { DataViewManager } from '../view/data-view-manager.js';

export type DataViewWidgetProps = {
  dataSource: DataSource;
  view: DataViewManager;
  viewMethods: DataViewExpose;
  viewSource: ViewSource;
};
export type DataViewWidget = UniComponent<DataViewWidgetProps>;
