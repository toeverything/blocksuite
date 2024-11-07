import type { UniComponent } from '../utils/uni-component/index.js';
import type { DataViewInstance } from '../view/types.js';

export type DataViewWidgetProps = {
  dataViewInstance: DataViewInstance;
};
export type DataViewWidget = UniComponent<DataViewWidgetProps>;
