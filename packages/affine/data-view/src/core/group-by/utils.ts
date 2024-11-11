import type { SingleView } from '../view-manager/index.js';

import { KanbanSingleView, TableSingleView } from '../../view-presets/index.js';
export type CanGroupView = TableSingleView | KanbanSingleView;
export const canGroup = (view: SingleView): view is CanGroupView => {
  return view instanceof TableSingleView || view instanceof KanbanSingleView;
};
