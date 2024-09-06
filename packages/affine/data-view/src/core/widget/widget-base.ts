import {
  ShadowlessElement,
  SignalWatcher,
  WithDisposable,
} from '@blocksuite/block-std';
import { property } from 'lit/decorators.js';

import type { DataViewExpose } from '../view/data-view.js';
import type { SingleView } from '../view-manager/single-view.js';
import type { DataViewWidgetProps } from './types.js';

export class WidgetBase
  extends SignalWatcher(WithDisposable(ShadowlessElement))
  implements DataViewWidgetProps
{
  get dataSource() {
    return this.view.viewManager.dataSource;
  }

  get viewManager() {
    return this.view.viewManager;
  }

  @property({ attribute: false })
  accessor view!: SingleView;

  @property({ attribute: false })
  accessor viewMethods!: DataViewExpose;
}
