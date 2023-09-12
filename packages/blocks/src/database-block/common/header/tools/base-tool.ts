import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { property } from 'lit/decorators.js';

import type { DataViewExpose, DataViewToolsProps } from '../../data-view.js';
import type { DataViewManager } from '../../data-view-manager.js';

export class BaseTool<Manager extends DataViewManager = DataViewManager>
  extends WithDisposable(ShadowlessElement)
  implements DataViewToolsProps<Manager>
{
  @property({ attribute: false })
  public view!: Manager;
  @property({ attribute: false })
  public viewMethod!: DataViewExpose;
}
