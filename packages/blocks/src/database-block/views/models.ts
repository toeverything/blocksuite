import type { ViewMeta } from '@blocksuite/data-view';

import { viewPresets } from '@blocksuite/data-view/view-presets';

export const databaseBlockViews: ViewMeta[] = [
  viewPresets.tableViewConfig,
  viewPresets.kanbanViewConfig,
];

export const databaseBlockViewMap = Object.fromEntries(
  databaseBlockViews.map(view => [view.type, view])
);
