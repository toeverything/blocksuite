import { ShadowlessElement } from '@blocksuite/block-std';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/utils';
import { property } from 'lit/decorators.js';

import type { DataViewExpose } from '../view/types.js';
import type { SingleView } from '../view-manager/single-view.js';
import type { DataViewWidgetProps } from './types.js';

export class WidgetBase
  extends SignalWatcher(WithDisposable(ShadowlessElement))
  implements DataViewWidgetProps
{
  get dataSource() {
    return this.view.manager.dataSource;
  }

  get viewManager() {
    return this.view.manager;
  }

  @property({ attribute: false })
  accessor view!: SingleView;

  @property({ attribute: false })
  accessor viewMethods!: DataViewExpose;
}
