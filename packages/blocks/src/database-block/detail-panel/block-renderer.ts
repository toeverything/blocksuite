import type { EditorHost } from '@blocksuite/block-std';
import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { IS_MAC } from '@blocksuite/global/env';
import { css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import type { RichText } from '../../_common/components/index.js';
import type { DetailSlotProps } from '../data-view/common/data-source/base.js';
import type { DataViewKanbanManager } from '../data-view/view/presets/kanban/kanban-view-manager.js';
import type { DataViewTableManager } from '../data-view/view/presets/table/table-view-manager.js';
import type { DatabaseBlockComponent } from '../database-block.js';

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

    database-datasource-block-renderer .tips-placeholder {
      display: none;
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
  host?: EditorHost;

  @query('rich-text')
  private _richTextElem?: RichText;

  get model() {
    return this.host?.doc.getBlockById(this.rowId);
  }

  get topContenteditableElement() {
    const databaseBlock =
      this.closest<DatabaseBlockComponent>('affine-database');
    return databaseBlock?.topContenteditableElement;
  }

  public override connectedCallback() {
    super.connectedCallback();

    this.host = this.closest('editor-host') ?? undefined;
    this._disposables.addFromEvent(
      this.topContenteditableElement ?? this,
      'keydown',
      e => {
        if (e.key === 'a' && (IS_MAC ? e.metaKey : e.ctrlKey)) {
          e.stopPropagation();
          e.preventDefault();
          const inlineEditor = this._richTextElem?.inlineEditor;
          inlineEditor?.selectAll();
          return;
        }

        if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
          e.stopPropagation();
          e.preventDefault();
          return;
        }
        if (
          e.key === 'Backspace' &&
          !e.shiftKey &&
          !e.metaKey &&
          this.model?.text?.length === 0
        ) {
          e.stopPropagation();
          e.preventDefault();
          return;
        }
      }
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
    const model = this.model;
    if (!model) {
      return;
    }
    return html` ${this.host?.renderModel(model)} ${this.renderIcon()} `;
  }
}
