import type {
  BlockStdScope,
  EventName,
  UIEventHandler,
} from '@blocksuite/block-std';
import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import type { Disposable, Slot } from '@blocksuite/global/utils';
import type { Doc } from '@blocksuite/store';
import { property } from 'lit/decorators.js';

import type { DataSource } from '../common/data-source/base.js';
import type { ViewSource } from '../common/index.js';
import type { DataViewRenderer } from '../data-view.js';
import type { DataViewSelection, InsertToPosition } from '../types.js';
import type { DataViewWidget } from '../widget/types.js';
import type { DataViewExpose, DataViewProps } from './data-view.js';
import type { DataViewManager } from './data-view-manager.js';

export abstract class DataViewBase<
    T extends DataViewManager = DataViewManager,
    Selection extends DataViewSelection = DataViewSelection,
  >
  extends WithDisposable(ShadowlessElement)
  implements DataViewProps<T, Selection>, DataViewExpose
{
  @property({ attribute: false })
  std!: BlockStdScope;

  @property({ attribute: false })
  headerWidget!: DataViewWidget;

  @property({ attribute: false })
  dataViewEle!: DataViewRenderer;

  @property({ attribute: false })
  view!: T;
  @property({ attribute: false })
  viewSource!: ViewSource;
  @property({ attribute: false })
  dataSource!: DataSource;

  @property({ attribute: false })
  bindHotkey!: (hotkeys: Record<string, UIEventHandler>) => Disposable;

  @property({ attribute: false })
  handleEvent!: (name: EventName, handler: UIEventHandler) => Disposable;

  @property({ attribute: false })
  modalMode?: boolean;

  @property({ attribute: false })
  setSelection!: (selection?: Selection) => void;

  @property({ attribute: false })
  selectionUpdated!: Slot<Selection | undefined>;

  @property({ attribute: false })
  onDrag?: (evt: MouseEvent, id: string) => () => void;

  @property({ attribute: false })
  getFlag!: Doc['awarenessStore']['getFlag'];

  addRow?(position: InsertToPosition): void;

  abstract focusFirstCell(): void;
  abstract getSelection(): Selection | undefined;
}
