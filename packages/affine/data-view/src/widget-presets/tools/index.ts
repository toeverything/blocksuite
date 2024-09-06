import type {
  DataViewWidget,
  DataViewWidgetProps,
} from '../../core/widget/types.js';

import { createUniComponentFromWebComponent } from '../../core/index.js';
import { uniMap } from '../../core/utils/uni-component/operation.js';
import { DataViewHeaderToolsFilter } from './presets/filter/filter.js';
import { DataViewHeaderToolsSearch } from './presets/search/search.js';
import { DataViewHeaderToolsAddRow } from './presets/table-add-row/add-row.js';
import { DataViewHeaderToolsViewOptions } from './presets/view-options/view-options.js';
import { DataViewHeaderTools } from './tools-renderer.js';

export const toolsWidgetPresets = {
  filter: createUniComponentFromWebComponent(DataViewHeaderToolsFilter),
  search: createUniComponentFromWebComponent(DataViewHeaderToolsSearch),
  viewOptions: createUniComponentFromWebComponent(
    DataViewHeaderToolsViewOptions
  ),
  tableAddRow: createUniComponentFromWebComponent(DataViewHeaderToolsAddRow),
};
export const createWidgetTools = (
  toolsMap: Record<string, DataViewWidget[]>
) => {
  return uniMap(
    createUniComponentFromWebComponent(DataViewHeaderTools),
    (props: DataViewWidgetProps) => ({
      ...props,
      toolsMap,
    })
  );
};
