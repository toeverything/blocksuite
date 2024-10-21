import type { ViewMeta } from '@blocksuite/data-view';

import { viewConverts, viewPresets } from '@blocksuite/data-view/view-presets';

export const microsheetBlockViews: ViewMeta[] = [
  viewPresets.tableViewMeta,
  viewPresets.kanbanViewMeta,
];

export const microsheetBlockViewMap = Object.fromEntries(
  microsheetBlockViews.map(view => [view.type, view])
);
export const microsheetBlockViewConverts = [...viewConverts];
