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
  delete(): void;
  duplicate(): void;
  get readonly(): boolean;

  isDeleted(): boolean;

  updateSlot: Slot<{ viewId: string }>;

  readonly updateView: (updater: (view: View) => Partial<View>) => void;
  readonly view: View;
}

export interface ViewSource {
  allViewMeta: ViewMeta[];
  checkViewDataUpdate(): void;
  duplicate(id: string): void;
  get currentView(): SingleViewSource;
  get currentViewId(): string;
  get readonly(): boolean;
  getViewMeta(type: string): ViewMeta;
  moveTo(id: string, position: InsertToPosition): void;
  selectView: (id: string) => void;
  updateSlot: Slot<{ viewId?: string }>;
  viewAdd(type: DataViewTypes): string;

  viewGet(id: string): SingleViewSource;
  views: SingleViewSource[];
}
