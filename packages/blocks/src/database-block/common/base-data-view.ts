import type { EventName, UIEventHandler } from '@blocksuite/block-std';
import type { Disposable, Slot } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { Page, Text } from '@blocksuite/store';
import { property } from 'lit/decorators.js';

import type { DataViewSelection } from '../../__internal__/index.js';
import type { InsertPosition } from '../types.js';
import type { DataViewExpose, DataViewProps } from './data-view.js';
import type { DataViewManager } from './data-view-manager.js';
import type { DatabaseSelection } from './selection.js';

export abstract class BaseDataView<
    T extends DataViewManager = DataViewManager,
    Selection extends DataViewSelection = DataViewSelection
  >
  extends WithDisposable(ShadowlessElement)
  implements DataViewProps<T, Selection>, DataViewExpose
{
  @property({ attribute: false })
  view!: T;

  @property({ attribute: false })
  titleText!: Text;

  @property({ attribute: false })
  bindHotkey!: (hotkeys: Record<string, UIEventHandler>) => Disposable;

  @property({ attribute: false })
  handleEvent!: (name: EventName, handler: UIEventHandler) => Disposable;

  @property({ attribute: false })
  modalMode?: boolean;

  @property({ attribute: false })
  setSelection!: (selection?: Selection) => void;

  @property({ attribute: false })
  getSelection!: () => DatabaseSelection | undefined;

  @property({ attribute: false })
  selectionUpdated!: Slot<Selection | undefined>;

  @property({ attribute: false })
  getFlag!: Page['awarenessStore']['getFlag'];

  addRow?(position: InsertPosition): void;

  abstract focusFirstCell(): void;
}
