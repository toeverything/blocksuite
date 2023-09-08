import type { Slot } from '@blocksuite/global/utils';

import type { DataViewDataType, DataViewTypes } from './data-view.js';

export interface SingleViewSource<
  View extends DataViewDataType = DataViewDataType,
> {
  readonly view: View;
  readonly updateView: (updater: (view: View) => Partial<View>) => void;

  delete(): void;

  get readonly(): boolean;

  updateSlot: Slot;

  isDeleted(): boolean;
}

export interface ViewSource {
  get readonly(): boolean;
  get currentViewId(): string;
  get currentView(): SingleViewSource;
  selectView: (id: string) => void;
  views: SingleViewSource[];
  viewGet(id: string): SingleViewSource;
  viewAdd(type: DataViewTypes): string;
  updateSlot: Slot;
}
