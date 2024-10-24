import type { SingleView } from '../view-manager/index.js';

import { TableSingleView } from '../../view-presets/index.js';

export type SortableView = TableSingleView;

export const canSort = (view: SingleView): view is SortableView => {
  return view instanceof TableSingleView;
};
