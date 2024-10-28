import type { SingleView } from '../view-manager/index.js';

import { KanbanSingleView, TableSingleView } from '../../view-presets/index.js';

export const canGroup = (
  view: SingleView
): view is TableSingleView | KanbanSingleView => {
  return view instanceof TableSingleView || view instanceof KanbanSingleView;
};
