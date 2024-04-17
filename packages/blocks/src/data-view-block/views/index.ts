import {
  type ViewMeta,
  viewPresets,
} from '../../database-block/data-view/index.js';

export const blockQueryViews: ViewMeta[] = [
  viewPresets.tableViewConfig,
  viewPresets.kanbanViewConfig,
];

export const blockQueryViewMap = Object.fromEntries(
  blockQueryViews.map(view => [view.type, view])
);
