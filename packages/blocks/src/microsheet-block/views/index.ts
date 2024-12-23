import type { ViewMeta } from '@blocksuite/microsheet-data-view';

import { viewPresets } from '@blocksuite/microsheet-data-view/view-presets';

export const microsheetBlockViews: ViewMeta[] = [viewPresets.tableViewMeta];

export const microsheetBlockViewMap = Object.fromEntries(
  microsheetBlockViews.map(view => [view.type, view])
);
