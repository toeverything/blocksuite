import type { UniComponent } from '../utils/uni-component/index.js';
import type { DataViewExpose } from '../view/types.js';
import type { SingleView } from '../view-manager/single-view.js';

export type DataViewWidgetProps = {
  view: SingleView;
  viewMethods: DataViewExpose;
};
export type DataViewWidget = UniComponent<DataViewWidgetProps>;
