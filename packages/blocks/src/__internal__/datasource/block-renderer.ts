import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { DataViewKanbanManager } from '../../database-block/kanban/kanban-view-manager.js';
import type { DataViewTableManager } from '../../database-block/table/table-view-manager.js';
import type { DetailSlotProps } from './base.js';

@customElement('database-datasource-block-renderer')
export class BlockRenderer
  extends WithDisposable(ShadowlessElement)
  implements DetailSlotProps
{
  static override styles = css`
    database-datasource-block-renderer {
      padding-bottom: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 4px;
      border-bottom: 1px solid var(--affine-border-color);
      font-size: var(--affine-font-base);
      line-height: var(--affine-line-height);
    }
    .database-block-detail-header-icon {
      width: 20px;
      height: 20px;
      padding: 2px;
      border-radius: 4px;
      background-color: var(--affine-background-secondary-color);
    }
    .database-block-detail-header-icon svg {
      width: 16px;
      height: 16px;
    }
  `;
  @property({ attribute: false })
  public view!: DataViewTableManager | DataViewKanbanManager;
  @property({ attribute: false })
  public rowId!: string;

  public override connectedCallback() {
    super.connectedCallback();
    this._disposables.addFromEvent(
      this,
      'keydown',
      e => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.stopPropagation();
          e.preventDefault();
          return;
        }
      },
      true
    );
  }

  renderIcon() {
    const iconColumn = this.view.header.iconColumn;
    if (!iconColumn) {
      return;
    }
    return html` <div class="database-block-detail-header-icon">
      ${this.view.cellGetValue(this.rowId, iconColumn)}
    </div>`;
  }

  protected override render(): unknown {
    const root = this.closest('block-suite-root');
    if (!root) {
      return;
    }
    const model = root.page.getBlockById(this.rowId);
    if (!model) {
      return;
    }
    return html` ${root.renderModel(model)} ${this.renderIcon()} `;
  }
}
