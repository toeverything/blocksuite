import type {
  BlockStdScope,
  EventName,
  UIEventHandler,
} from '@blocksuite/block-std';
import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import type { Disposable, Slot } from '@blocksuite/global/utils';
import type { Doc } from '@blocksuite/store';
import { property } from 'lit/decorators.js';

import type { UniComponent } from '../../_common/components/uni-component/uni-component.js';
import type { DataViewSelection } from '../../_common/utils/index.js';
import type { InsertToPosition } from '../types.js';
import type { DataViewExpose, DataViewProps } from './data-view.js';
import type { DataViewManager } from './data-view-manager.js';

export abstract class BaseDataView<
    T extends DataViewManager = DataViewManager,
    Selection extends DataViewSelection = DataViewSelection,
  >
  extends WithDisposable(ShadowlessElement)
  implements DataViewProps<T, Selection>, DataViewExpose
{
  @property({ attribute: false })
  std!: BlockStdScope;

  @property({ attribute: false })
  header!: UniComponent<{ viewMethods: DataViewExpose; view: T }>;

  @property({ attribute: false })
  view!: T;

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
