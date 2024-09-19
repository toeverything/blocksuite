import { ShadowlessElement } from '@blocksuite/block-std';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/utils';
import { property } from 'lit/decorators.js';

import type { DataViewSelection } from '../types.js';
import type { SingleView } from '../view-manager/single-view.js';
import type { DataViewExpose, DataViewProps } from './types.js';

export abstract class DataViewBase<
  T extends SingleView = SingleView,
  Selection extends DataViewSelection = DataViewSelection,
> extends SignalWatcher(WithDisposable(ShadowlessElement)) {
  abstract expose: DataViewExpose;

  @property({ attribute: false })
  accessor props!: DataViewProps<T, Selection>;
}
