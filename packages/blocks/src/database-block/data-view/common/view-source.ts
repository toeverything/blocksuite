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
  get readonly(): boolean;
  readonly view: View;
  readonly updateView: (updater: (view: View) => Partial<View>) => void;

  updateSlot: Slot<{ viewId: string }>;

  delete(): void;

  isDeleted(): boolean;
  duplicate(): void;
}

export interface ViewSource {
  get readonly(): boolean;
  get currentViewId(): string;
  get currentView(): SingleViewSource;
  allViewMeta: ViewMeta[];
  selectView: (id: string) => void;
  views: SingleViewSource[];
  updateSlot: Slot<{ viewId?: string }>;
  checkViewDataUpdate(): void;
  getViewMeta(type: string): ViewMeta;
  viewGet(id: string): SingleViewSource;
  viewAdd(type: DataViewTypes): string;

  moveTo(id: string, position: InsertToPosition): void;
  duplicate(id: string): void;
}
