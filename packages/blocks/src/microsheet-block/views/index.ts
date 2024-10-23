import type { ViewMeta } from '@blocksuite/microsheet-data-view';

import {
  viewConverts,
  viewPresets,
} from '@blocksuite/microsheet-data-view/view-presets';

export const microsheetBlockViews: ViewMeta[] = [
  viewPresets.tableViewMeta,
  viewPresets.kanbanViewMeta,
];

export const microsheetBlockViewMap = Object.fromEntries(
  microsheetBlockViews.map(view => [view.type, view])
);
export const microsheetBlockViewConverts = [...viewConverts];
