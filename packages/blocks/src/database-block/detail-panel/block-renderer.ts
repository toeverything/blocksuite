import type { EditorHost } from '@blocksuite/block-std';
import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { DetailSlotProps } from '../data-view/common/data-source/base.js';
import type { DataViewKanbanManager } from '../data-view/view/presets/kanban/kanban-view-manager.js';
import type { DataViewTableManager } from '../data-view/view/presets/table/table-view-manager.js';

@customElement('database-datasource-block-renderer')
export class BlockRenderer
  extends WithDisposable(ShadowlessElement)
  implements DetailSlotProps
{
  get model() {
    return this.host?.doc.getBlock(this.rowId)?.model;
  }

  get service() {
    return this.host.std.spec.getService('affine:database');
  }

  get inlineManager() {
    return this.service.inlineManager;
  }

  get attributesSchema() {
    return this.inlineManager.getSchema();
  }

  get attributeRenderer() {
    return this.inlineManager.getRenderer();
  }

  static override styles = css`
    database-datasource-block-renderer {
      padding-bottom: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 12px;
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
  accessor view!: DataViewTableManager | DataViewKanbanManager;

  @property({ attribute: false })
  accessor rowId!: string;

  @property({ attribute: false })
  accessor host!: EditorHost;

  protected override render(): unknown {
    const model = this.model;
    if (!model) {
      return;
    }
    return html`
      ${this.renderIcon()}
      <rich-text
        .yText=${model.text}
        .attributesSchema=${this.attributesSchema}
        .attributeRenderer=${this.attributeRenderer}
        .embedChecker=${this.inlineManager.embedChecker}
        .markdownShortcutHandler=${this.inlineManager.markdownShortcutHandler}
        class="inline-editor"
      ></rich-text>
    `;
  }

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.addFromEvent(
      this,
      'keydown',
      e => {
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
}
