import type { Slot } from '@blocksuite/global/utils';

import type { DataViewDataType } from './data-view.js';

export interface ViewSource<View extends DataViewDataType = DataViewDataType> {
  readonly view: View;
  readonly updateView: (updater: (view: View) => Partial<View>) => void;

  delete(): void;

  get readonly(): boolean;

  updateSlot: Slot;

  isDeleted(): boolean;
}
