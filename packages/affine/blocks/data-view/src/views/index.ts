import type { ViewMeta } from '@labre/data-view';
import { viewPresets } from '@labre/data-view/view-presets';

export const blockQueryViews: ViewMeta[] = [
  viewPresets.tableViewMeta,
  viewPresets.kanbanViewMeta,
];

export const blockQueryViewMap = Object.fromEntries(
  blockQueryViews.map(view => [view.type, view])
);
