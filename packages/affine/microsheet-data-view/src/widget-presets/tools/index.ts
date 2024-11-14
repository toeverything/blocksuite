import type {
  MicrosheetDataViewWidget,
  MicrosheetDataViewWidgetProps,
} from '../../core/widget/types.js';

import { createUniComponentFromWebComponent } from '../../core/index.js';
import { uniMap } from '../../core/utils/uni-component/operation.js';
import { DataViewHeaderTools } from './tools-renderer.js';

export const toolsWidgetPresets = {};
export const createWidgetTools = (
  toolsMap: Record<string, MicrosheetDataViewWidget[]>
) => {
  return uniMap(
    createUniComponentFromWebComponent(DataViewHeaderTools),
    (props: MicrosheetDataViewWidgetProps) => ({
      ...props,
      toolsMap,
    })
  );
};
