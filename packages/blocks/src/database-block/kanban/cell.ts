// related component

import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { PropertyValues } from 'lit';
import { css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { keyed } from 'lit/directives/keyed.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { html } from 'lit/static-html.js';

import type { UniLit } from '../../components/uni-component/uni-component.js';
import type { DataViewCellLifeCycle } from '../common/columns/manager.js';
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
    border: 2px solid transparent;
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

  .kanban-cell {
    flex: 1;
    display: block;
  }
`;

@customElement('affine-data-view-kanban-cell')
export class KanbanCell extends WithDisposable(ShadowlessElement) {
  static override styles = styles;

  @property({ attribute: false })
  view!: DataViewKanbanManager;
  @property({ attribute: false })
  groupKey!: string;
  @property({ attribute: false })
  cardId!: string;
  @property({ attribute: false })
  column!: DataViewKanbanColumnManager;
  @state()
  isFocus = false;

  @state()
  editing = false;

  private _cell = createRef<UniLit<DataViewCellLifeCycle>>();

  public get cell(): DataViewCellLifeCycle | undefined {
    return this._cell.value?.expose;
  }

  protected override firstUpdated(_changedProperties: PropertyValues) {
    super.firstUpdated(_changedProperties);
    this._disposables.addFromEvent(this, 'click', e => {
      if (!this.editing) {
        this.selectCurrentCell(true);
      }
    });
  }

  selectCurrentCell = (editing: boolean) => {
    const selection = this.closest('affine-data-view-kanban')?.selection;
    if (!selection) {
      return;
    }
    selection.selection = {
      groupKey: this.groupKey,
      cardId: this.cardId,
      focus: {
        columnId: this.column.id,
        isEditing: editing,
      },
    };
  };

  get selection() {
    return this.closest('affine-data-view-kanban')?.selection;
  }

  override render() {
    const props = {
      column: this.column,
      rowId: this.cardId,
      isEditing: this.editing,
      selectCurrentCell: this.selectCurrentCell,
    };
    const { view, edit } = this.column.renderer;
    this.style.border = this.isFocus
      ? '2px solid var(--affine-primary-color)'
      : '';
    this.style.boxShadow = this.editing
      ? '0px 0px 0px 2px rgba(30, 150, 235, 0.30)'
      : '';
    return html` <div class="icon">${columnTypeIconMap[this.column.type]}</div>
      ${keyed(
        `${this.editing} ${this.column.type}`,
        html` <uni-lit
          ${ref(this._cell)}
          class="kanban-cell"
          .uni="${this.editing && edit ? edit : view}"
          .props="${props}"
        ></uni-lit>`
      )}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view-kanban-cell': KanbanCell;
  }
}
