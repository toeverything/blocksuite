import type { Slot } from '@blocksuite/global/utils';

import type { DatabaseViewData } from './view-manager.js';

export interface ViewSource<View extends DatabaseViewData = DatabaseViewData> {
  readonly view: View;
  readonly updateView: (updater: (view: View) => Partial<View>) => void;
  updateSlot: Slot;
}
