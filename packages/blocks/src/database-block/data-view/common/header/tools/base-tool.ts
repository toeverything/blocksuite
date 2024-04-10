import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { property } from 'lit/decorators.js';

import type {
  DataViewExpose,
  DataViewToolsProps,
} from '../../../view/data-view.js';
import type { DataViewManager } from '../../../view/data-view-manager.js';

export class BaseTool<Manager extends DataViewManager = DataViewManager>
  extends WithDisposable(ShadowlessElement)
  implements DataViewToolsProps<Manager>
{
  @property({ attribute: false })
  public view!: Manager;
  @property({ attribute: false })
  public viewMethod!: DataViewExpose;
}
