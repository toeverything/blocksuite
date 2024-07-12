import type { DataViewWidget, DataViewWidgetProps } from '../types.js';

import { ExpandDatabaseBlockModal } from '../../../widgets/expand/index.js';
import { createUniComponentFromWebComponent } from '../../utils/uni-component/index.js';
import { map } from '../../utils/uni-component/operation.js';
import { DataViewHeaderToolsFilter } from './presets/filter/filter.js';
import { DataViewHeaderToolsSearch } from './presets/search/search.js';
import { DataViewHeaderToolsAddRow } from './presets/table-add-row/add-row.js';
import { DataViewHeaderToolsViewOptions } from './presets/view-options/view-options.js';
import { DataViewHeaderTools } from './tools-renderer.js';

export const toolsWidgetPresets = {
  filter: createUniComponentFromWebComponent(DataViewHeaderToolsFilter),
  expand: createUniComponentFromWebComponent(ExpandDatabaseBlockModal),
  search: createUniComponentFromWebComponent(DataViewHeaderToolsSearch),
  viewOptions: createUniComponentFromWebComponent(
    DataViewHeaderToolsViewOptions
  ),
  tableAddRow: createUniComponentFromWebComponent(DataViewHeaderToolsAddRow),
};
export const createWidgetTools = (
  toolsMap: Record<string, DataViewWidget[]>
) => {
  return map(
    createUniComponentFromWebComponent(DataViewHeaderTools),
    (props: DataViewWidgetProps) => ({
      ...props,
      toolsMap,
    })
  );
};
