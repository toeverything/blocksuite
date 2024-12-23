import type { ViewMeta } from '@blocksuite/microsheet-data-view';

import { viewPresets } from '@blocksuite/microsheet-data-view/view-presets';

export const blockQueryViews: ViewMeta[] = [viewPresets.tableViewMeta];

export const blockQueryViewMap = Object.fromEntries(
  blockQueryViews.map(view => [view.type, view])
);
