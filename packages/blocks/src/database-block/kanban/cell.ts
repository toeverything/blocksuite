// related component

import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createRef } from 'lit/directives/ref.js';
import { html } from 'lit/static-html.js';

import { renderUniLit } from '../../components/uni-component/uni-component.js';
import type { KanbanCellSelection } from '../../index.js';
import type {
  CellRenderProps,
  DataViewCellLifeCycle,
} from '../common/columns/manager.js';
import type {
  DataViewKanbanColumnManager,
  DataViewKanbanManager,
} from './kanban-view-manager.js';

const styles = css`
  affine-data-view-kanban-cell {
    border-radius: 4px;
    display: flex;
    align-items: center;
    padding: 4px;
    min-height: 20px;
    border: 1px solid transparent;
    box-sizing: border-box;
  }

  affine-data-view-kanban-cell:hover {
    background-color: var(--affine-hover-color);
  }

  affine-data-view-kanban-cell .icon {
    display: flex;
    align-items: center;
    justify-content: center;
    align-self: start;
    margin-right: 12px;
    height: var(--data-view-cell-text-line-height);
  }

  affine-data-view-kanban-cell .icon svg {
    width: 16px;
    height: 16px;
    fill: var(--affine-icon-color);
    color: var(--affine-icon-color);
  }

  .kanban-cell {
    flex: 1;
    display: block;
    width: 196px;
  }
`;

@customElement('affine-data-view-kanban-cell')
export class KanbanCell extends WithDisposable(ShadowlessElement) {
  static override styles = styles;

  @property({ attribute: false })
  contentOnly = false;
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

  private _cell = createRef<DataViewCellLifeCycle>();

  public get cell(): DataViewCellLifeCycle | undefined {
    return this._cell.value;
  }

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.addFromEvent(this, 'click', e => {
      if (e.shiftKey) {
        return;
      }
      e.stopPropagation();
      const selectionElement = this.closest('affine-data-view-kanban')
        ?.selection;
      if (!selectionElement) return;
      if (e.shiftKey) return;

      if (!this.editing) {
        this.selectCurrentCell(!this.column.readonly);
      }
    });
  }

  selectCurrentCell = (editing: boolean) => {
    const selectionElement = this.closest('affine-data-view-kanban')?.selection;
    if (!selectionElement) return;

    selectionElement.selection = {
      selectionType: 'cell',
      groupKey: this.groupKey,
      cardId: this.cardId,
      columnId: this.column.id,
      isEditing: editing,
    } as KanbanCellSelection;
  };

  get selection() {
    return this.closest('affine-data-view-kanban')?.selection;
  }

  renderIcon() {
    if (this.contentOnly) {
      return;
    }
    return html` <uni-lit class="icon" .uni="${this.column.icon}"></uni-lit>`;
  }

  override render() {
    const props: CellRenderProps = {
      view: this.view,
      column: this.column,
      rowId: this.cardId,
      isEditing: this.editing,
      selectCurrentCell: this.selectCurrentCell,
    };
    const { view, edit } = this.column.renderer;
    this.style.border = this.isFocus
      ? '1px solid var(--affine-primary-color)'
      : '';
    this.style.boxShadow = this.editing
      ? '0px 0px 0px 2px rgba(30, 150, 235, 0.30)'
      : '';
    return html` ${this.renderIcon()}
    ${renderUniLit(this.editing && edit ? edit : view, props, {
      ref: this._cell,
      class: 'kanban-cell',
    })}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view-kanban-cell': KanbanCell;
  }
}
