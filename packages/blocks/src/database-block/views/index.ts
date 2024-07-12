import type { ViewMeta } from '../data-view/view/data-view.js';

import { viewPresets } from '../data-view/view/index.js';

export const databaseBlockViews: ViewMeta[] = [
  viewPresets.tableViewConfig,
  viewPresets.kanbanViewConfig,
];

export const databaseBlockViewMap = Object.fromEntries(
  databaseBlockViews.map(view => [view.type, view])
);
