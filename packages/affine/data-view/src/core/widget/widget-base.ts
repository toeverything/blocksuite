import { ShadowlessElement } from '@blocksuite/block-std';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/utils';
import { property } from 'lit/decorators.js';

import type { DataViewInstance } from '../view/types.js';
import type { DataViewWidgetProps } from './types.js';

export class WidgetBase
  extends SignalWatcher(WithDisposable(ShadowlessElement))
  implements DataViewWidgetProps
{
  get dataSource() {
    return this.view.manager.dataSource;
  }

  get view() {
    return this.dataViewInstance.view;
  }

  get viewManager() {
    return this.view.manager;
  }

  get viewMethods() {
    return this.dataViewInstance;
  }

  @property({ attribute: false })
  accessor dataViewInstance!: DataViewInstance;
}
