import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { DataViewKanbanManager } from '../../database-block/kanban/kanban-view-manager.js';
import type { DataViewTableManager } from '../../database-block/table/table-view-manager.js';
import type { DetailSlotProps } from './base.js';

@customElement('database-datasource-block-renderer')
export class BlockRenderer
  extends WithDisposable(ShadowlessElement)
  implements DetailSlotProps
{
  @property({ attribute: false })
  public view!: DataViewTableManager | DataViewKanbanManager;
  @property({ attribute: false })
  public rowId!: string;

  protected override render(): unknown {
    const root = this.closest('block-suite-root');
    if (!root) {
      return;
    }
    const model = root.page.getBlockById(this.rowId);
    if (!model) {
      return;
    }
    return html` <div>${root.renderModel(model)}</div> `;
  }
}
