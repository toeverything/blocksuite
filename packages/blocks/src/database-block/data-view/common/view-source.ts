import type { Slot } from '@blocksuite/global/utils';

import type { InsertToPosition } from '../types.js';
import type {
  DataViewDataType,
  DataViewTypes,
  ViewMeta,
} from '../view/data-view.js';

export interface SingleViewSource<
  View extends DataViewDataType = DataViewDataType,
> {
  readonly view: View;
  readonly updateView: (updater: (view: View) => Partial<View>) => void;

  delete(): void;

  get readonly(): boolean;

  updateSlot: Slot;

  isDeleted(): boolean;
  duplicate(): void;
}

export interface ViewSource {
  allViewMeta: ViewMeta[];
  getViewMeta(type: string): ViewMeta;
  get readonly(): boolean;
  get currentViewId(): string;
  get currentView(): SingleViewSource;
  selectView: (id: string) => void;
  views: SingleViewSource[];
  viewGet(id: string): SingleViewSource;
  viewAdd(type: DataViewTypes): string;
  updateSlot: Slot;

  moveTo(id: string, position: InsertToPosition): void;
  duplicate(id: string): void;
}
