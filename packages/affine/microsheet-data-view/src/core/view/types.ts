import type { InsertToPosition } from '@blocksuite/affine-shared/utils';
import type {
  BlockStdScope,
  EventName,
  UIEventHandler,
} from '@blocksuite/block-std';
import type { Disposable } from '@blocksuite/global/utils';
import type { ReadonlySignal } from '@preact/signals-core';

import type { DataSource } from '../common/index.js';
import type { DataViewRenderer } from '../data-view.js';
import type { MicrosheetDataViewSelection } from '../types.js';
import type { SingleView } from '../view-manager/index.js';
import type { MicrosheetDataViewWidget } from '../widget/index.js';

export interface DataViewProps<
  T extends SingleView = SingleView,
  Selection extends MicrosheetDataViewSelection = MicrosheetDataViewSelection,
> {
  dataViewEle: DataViewRenderer;

  headerWidget?: MicrosheetDataViewWidget;

  view: T;
  dataSource: DataSource;

  bindHotkey: (hotkeys: Record<string, UIEventHandler>) => Disposable;

  handleEvent: (name: EventName, handler: UIEventHandler) => Disposable;

  setSelection: (selection?: Selection) => void;

  selection$: ReadonlySignal<Selection | undefined>;

  virtualPadding$: ReadonlySignal<number>;

  onDrag?: (evt: MouseEvent, id: string) => () => void;

  std: BlockStdScope;
}

export interface DataViewExpose {
  addRow?(position: InsertToPosition | number): void;

  getSelection?(): MicrosheetDataViewSelection | undefined;

  focusFirstCell(): void;

  showIndicator?(evt: MouseEvent): boolean;

  hideIndicator?(): void;

  moveTo?(id: string, evt: MouseEvent): void;
}
