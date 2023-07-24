// related component

import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { PropertyValues } from 'lit';
import { css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { keyed } from 'lit/directives/keyed.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import { columnTypeIconMap } from '../table/components/column-header/database-header-column.js';
import type {
  DataViewKanbanColumnManager,
  DataViewKanbanManager,
} from './kanban-view-manager.js';

const styles = css`
  affine-data-view-kanban-cell {
    border-radius: 4px;
    display: flex;
    padding: 2px 4px;
    min-height: 28px;
  }

  affine-data-view-kanban-cell:hover {
    background-color: var(--affine-hover-color);
  }
  affine-data-view-kanban-cell .icon {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 4px;
  }
  affine-data-view-kanban-cell .icon svg {
    width: 14px;
    height: 14px;
    fill: var(--affine-icon-color);
  }
`;

@customElement('affine-data-view-kanban-cell')
export class KanbanCell extends WithDisposable(ShadowlessElement) {
  static override styles = styles;

  @property({ attribute: false })
  view!: DataViewKanbanManager;
  @property({ attribute: false })
  cardId!: string;
  @property({ attribute: false })
  column!: DataViewKanbanColumnManager;
  @state()
  editing = false;

  protected override firstUpdated(_changedProperties: PropertyValues) {
    super.firstUpdated(_changedProperties);
    this._disposables.addFromEvent(this, 'click', e => {
      this.editing = true;
    });
    this.tabIndex = 1;
  }

  override render() {
    const props = {
      column: this.column,
      rowId: this.cardId,
      isEditing: this.editing,
      selectCurrentCell: (editing: boolean) => {
        this.editing = editing;
      },
    };
    const { view, edit } = this.column.renderer;
    const style = styleMap({
      flex: 1,
      display: 'block',
      borderRadius: '4px',
      boxShadow: this.editing
        ? '0px 0px 0px 2px rgba(30, 150, 235, 0.30)'
        : undefined,
    });
    return html` <div class="icon">${columnTypeIconMap[this.column.type]}</div>
      ${keyed(
        `${this.editing} ${this.column.type}`,
        html`<uni-lit
          .uni="${this.editing && edit ? edit : view}"
          .props="${props}"
          style="${style}"
        ></uni-lit>`
      )}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view-kanban-cell': KanbanCell;
  }
}
