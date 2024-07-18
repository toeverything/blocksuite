// related component

import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createRef } from 'lit/directives/ref.js';
import { html } from 'lit/static-html.js';

import type {
  CellRenderProps,
  DataViewCellLifeCycle,
} from '../../../column/index.js';
import type {
  DataViewKanbanColumnManager,
  DataViewKanbanManager,
} from './kanban-view-manager.js';
import type { KanbanViewSelection } from './types.js';

import { renderUniLit } from '../../../utils/uni-component/uni-component.js';

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
  private _cell = createRef<DataViewCellLifeCycle>();

  static override styles = styles;

  selectCurrentCell = (editing: boolean) => {
    const selectionView = this.closest(
      'affine-data-view-kanban'
    )?.selectionController;
    if (!selectionView) return;
    if (selectionView) {
      const selection = selectionView.selection;
      if (selection && this.isSelected(selection) && editing) {
        selectionView.selection = {
          selectionType: 'cell',
          groupKey: this.groupKey,
          cardId: this.cardId,
          columnId: this.column.id,
          isEditing: true,
        };
      } else {
        selectionView.selection = {
          selectionType: 'cell',
          groupKey: this.groupKey,
          cardId: this.cardId,
          columnId: this.column.id,
          isEditing: false,
        };
      }
    }
  };

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.addFromEvent(this, 'click', e => {
      if (e.shiftKey) {
        return;
      }
      e.stopPropagation();
      const selectionElement = this.closest(
        'affine-data-view-kanban'
      )?.selectionController;
      if (!selectionElement) return;
      if (e.shiftKey) return;

      if (!this.editing) {
        this.selectCurrentCell(!this.column.readonly);
      }
    });
  }

  isSelected(selection: KanbanViewSelection) {
    if (
      selection.selectionType !== 'cell' ||
      selection.groupKey !== this.groupKey
    ) {
      return;
    }
    return (
      selection.cardId === this.cardId && selection.columnId === this.column.id
    );
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
      style: { display: 'block', flex: '1', overflow: 'hidden' },
    })}`;
  }

  renderIcon() {
    if (this.contentOnly) {
      return;
    }
    return html` <uni-lit class="icon" .uni="${this.column.icon}"></uni-lit>`;
  }

  get cell(): DataViewCellLifeCycle | undefined {
    return this._cell.value;
  }

  get selection() {
    return this.closest('affine-data-view-kanban')?.selectionController;
  }

  @property({ attribute: false })
  accessor cardId!: string;

  @property({ attribute: false })
  accessor column!: DataViewKanbanColumnManager;

  @property({ attribute: false })
  accessor contentOnly = false;

  @state()
  accessor editing = false;

  @property({ attribute: false })
  accessor groupKey!: string;

  @state()
  accessor isFocus = false;

  @property({ attribute: false })
  accessor view!: DataViewKanbanManager;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view-kanban-cell': KanbanCell;
  }
}
