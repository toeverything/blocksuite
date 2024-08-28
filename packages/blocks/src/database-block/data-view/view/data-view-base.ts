import type { InsertToPosition } from '@blocksuite/affine-shared/utils';
import type {
  BlockStdScope,
  EventName,
  UIEventHandler,
} from '@blocksuite/block-std';
import type { Disposable } from '@blocksuite/global/utils';

import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { type ReadonlySignal, SignalWatcher } from '@lit-labs/preact-signals';
import { property } from 'lit/decorators.js';

import type { DataSource } from '../common/data-source/base.js';
import type { DataViewRenderer } from '../data-view.js';
import type { DataViewSelection } from '../types.js';
import type { SingleView } from '../view-manager/single-view.js';
import type { ViewManager } from '../view-manager/view-manager.js';
import type { DataViewWidget } from '../widget/types.js';
import type { DataViewExpose, DataViewProps } from './data-view.js';

export abstract class DataViewBase<
    T extends SingleView = SingleView,
    Selection extends DataViewSelection = DataViewSelection,
  >
  extends SignalWatcher(WithDisposable(ShadowlessElement))
  implements DataViewProps<T, Selection>, DataViewExpose
{
  addRow?(position: InsertToPosition): void;

  @property({ attribute: false })
  accessor bindHotkey!: (hotkeys: Record<string, UIEventHandler>) => Disposable;

  @property({ attribute: false })
  accessor dataSource!: DataSource;

  @property({ attribute: false })
  accessor dataViewEle!: DataViewRenderer;

  abstract focusFirstCell(): void;

  abstract getSelection(): Selection | undefined;

  @property({ attribute: false })
  accessor handleEvent!: (
    name: EventName,
    handler: UIEventHandler
  ) => Disposable;

  @property({ attribute: false })
  accessor headerWidget!: DataViewWidget;

  @property({ attribute: false })
  accessor modalMode: boolean | undefined = undefined;

  @property({ attribute: false })
  accessor onDrag: ((evt: MouseEvent, id: string) => () => void) | undefined =
    undefined;

  @property({ attribute: false })
  accessor selection$!: ReadonlySignal<Selection | undefined>;

  @property({ attribute: false })
  accessor setSelection!: (selection?: Selection) => void;

  @property({ attribute: false })
  accessor std!: BlockStdScope;

  @property({ attribute: false })
  accessor view!: T;

  @property({ attribute: false })
  accessor viewSource!: ViewManager;
}
