import type { ViewMeta } from '../data-view/index.js';

import { viewPresets } from '../data-view/index.js';

export const databaseBlockViews: ViewMeta[] = [
  viewPresets.tableViewConfig,
  viewPresets.kanbanViewConfig,
];

export const databaseBlockViewMap = Object.fromEntries(
  databaseBlockViews.map(view => [view.type, view])
);
