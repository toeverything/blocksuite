import {
  createUniComponentFromWebComponent,
  type DataViewWidgetProps,
} from '../../core/index.js';
import { DataViewHeaderViews } from './views-view.js';

export const widgetViewsBar = createUniComponentFromWebComponent<
  DataViewWidgetProps & {
    onChangeView?: (viewId: string) => void;
  }
>(DataViewHeaderViews);
