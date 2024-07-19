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
  static override styles = css`
    database-datasource-block-renderer {
      padding-top: 36px;
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

    database-datasource-block-renderer rich-text {
      font-size: 15px;
      line-height: 24px;
    }

    database-datasource-block-renderer.empty rich-text::before {
      content: 'Untitled';
      position: absolute;
      color: var(--affine-text-disable-color);
      font-size: 15px;
      line-height: 24px;
      user-select: none;
      pointer-events: none;
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

  override connectedCallback() {
    super.connectedCallback();
    if (this.model && this.model.text) {
      const cb = () => {
        if (this.model?.text?.length == 0) {
          // eslint-disable-next-line wc/no-self-class
          this.classList.add('empty');
        } else {
          // eslint-disable-next-line wc/no-self-class
          this.classList.remove('empty');
        }
      };
      this.model.text.yText.observe(cb);
      this.disposables.add(() => {
        this.model?.text?.yText.unobserve(cb);
      });
    }
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

  renderIcon() {
    const iconColumn = this.view.header.iconColumn;
    if (!iconColumn) {
      return;
    }
    return html` <div class="database-block-detail-header-icon">
      ${this.view.cellGetValue(this.rowId, iconColumn)}
    </div>`;
  }

  get attributeRenderer() {
    return this.inlineManager.getRenderer();
  }

  get attributesSchema() {
    return this.inlineManager.getSchema();
  }

  get inlineManager() {
    return this.service.inlineManager;
  }

  get model() {
    return this.host?.doc.getBlock(this.rowId)?.model;
  }

  get service() {
    return this.host.std.spec.getService('affine:database');
  }

  @property({ attribute: false })
  accessor host!: EditorHost;

  @property({ attribute: false })
  accessor rowId!: string;

  @property({ attribute: false })
  accessor view!: DataViewTableManager | DataViewKanbanManager;
}
