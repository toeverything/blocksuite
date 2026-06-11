import type {
  DatabaseAllViewEvents,
  EventTraceFn,
} from '@labre/affine-shared/services';
import type { InsertToPosition } from '@labre/affine-shared/utils';
import type { Disposable } from '@labre/global/disposable';
import type { EventName, UIEventHandler } from '@labre/std';
import type { ReadonlySignal } from '@preact/signals-core';

import type { DataViewSelection } from '../types.js';
import type { SingleView } from '../view-manager/index.js';
import type { DataViewWidget } from '../widget/index.js';

export interface DataViewProps<
  Selection extends DataViewSelection = DataViewSelection,
> {
  headerWidget?: DataViewWidget;
  bindHotkey: (hotkeys: Record<string, UIEventHandler>) => Disposable;
  handleEvent: (name: EventName, handler: UIEventHandler) => Disposable;
  setSelection: (selection?: Selection) => void;
  selection$: ReadonlySignal<Selection | undefined>;
  eventTrace: EventTraceFn<DatabaseAllViewEvents>;
}

export interface DataViewInstance<T extends SingleView = SingleView> {
  addRow?(position: InsertToPosition | number): void;

  getSelection?(): DataViewSelection | undefined;

  focusFirstCell(): void;

  showIndicator?(evt: MouseEvent): boolean;

  hideIndicator?(): void;

  moveTo?(id: string, evt: MouseEvent): void;

  view: T;

  eventTrace: EventTraceFn<DatabaseAllViewEvents>;

  clearSelection(): void;
}
