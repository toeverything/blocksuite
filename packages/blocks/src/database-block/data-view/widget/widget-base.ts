import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { property } from 'lit/decorators.js';

import type { DataSource } from '../common/data-source/base.js';
import type { ViewSource } from '../common/index.js';
import type { DataViewExpose } from '../view/data-view.js';
import type { DataViewManager } from '../view/data-view-manager.js';
import type { DataViewWidgetProps } from './types.js';

export class WidgetBase
  extends WithDisposable(ShadowlessElement)
  implements DataViewWidgetProps
{
  @property({ attribute: false })
  public view!: DataViewManager;
  @property({ attribute: false })
  public viewMethods!: DataViewExpose;
  @property({ attribute: false })
  public viewSource!: ViewSource;
  @property({ attribute: false })
  public dataSource!: DataSource;
}
