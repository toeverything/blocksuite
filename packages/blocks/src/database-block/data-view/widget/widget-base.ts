import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { SignalWatcher } from '@lit-labs/preact-signals';
import { property } from 'lit/decorators.js';

import type { DataSource } from '../common/data-source/base.js';
import type { ViewSource } from '../common/index.js';
import type { DataViewExpose } from '../view/data-view.js';
import type { DataViewManager } from '../view/data-view-manager.js';
import type { DataViewWidgetProps } from './types.js';

export class WidgetBase
  extends SignalWatcher(WithDisposable(ShadowlessElement))
  implements DataViewWidgetProps
{
  @property({ attribute: false })
  accessor dataSource!: DataSource;

  @property({ attribute: false })
  accessor view!: DataViewManager;

  @property({ attribute: false })
  accessor viewMethods!: DataViewExpose;

  @property({ attribute: false })
  accessor viewSource!: ViewSource;
}
