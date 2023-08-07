import type { EventName, UIEventHandler } from '@blocksuite/block-std';
import type { Disposable, Slot } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { Page } from '@blocksuite/store';
import { property } from 'lit/decorators.js';

import type { DataViewSelection } from '../../__internal__/index.js';
import type { InsertPosition } from '../types.js';
import type { DataViewManager } from './data-view-manager.js';

export class BaseDataView<
  T extends DataViewManager = DataViewManager,
  Selection extends DataViewSelection = DataViewSelection
> extends WithDisposable(ShadowlessElement) {
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
  selectionUpdated!: Slot<Selection | undefined>;

  @property({ attribute: false })
  getFlag!: Page['awarenessStore']['getFlag'];

  addRow?(position: InsertPosition): void;
}
