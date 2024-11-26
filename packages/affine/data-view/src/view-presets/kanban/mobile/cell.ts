// related component

import { unsafeCSSVarV2 } from '@blocksuite/affine-shared/theme';
import { ShadowlessElement } from '@blocksuite/block-std';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/utils';
import { computed, effect } from '@preact/signals-core';
import { css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { createRef } from 'lit/directives/ref.js';
import { html } from 'lit/static-html.js';

import type {
  CellRenderProps,
  DataViewCellLifeCycle,
} from '../../../core/property/index.js';
import type { Property } from '../../../core/view-manager/property.js';
import type { KanbanSingleView } from '../kanban-view-manager.js';

import { renderUniLit } from '../../../core/utils/uni-component/uni-component.js';

const styles = css`
  mobile-kanban-cell {
    border-radius: 4px;
    display: flex;
    align-items: center;
    padding: 4px;
    min-height: 20px;
    border: 1px solid transparent;
    box-sizing: border-box;
  }

  .mobile-kanban-cell {
    flex: 1;
    display: block;
    width: 196px;
  }

  .mobile-kanban-cell-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    align-self: start;
    margin-right: 12px;
    height: var(--data-view-cell-text-line-height);
    font-size: 16px;
    color: ${unsafeCSSVarV2('icon/primary')};
  }
`;

export class MobileKanbanCell extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  static override styles = styles;

  private _cell = createRef<DataViewCellLifeCycle>();

  isEditing$ = computed(() => {
    const selection = this.kanban?.props.selection$.value;
    if (selection?.selectionType !== 'cell') {
      return false;
    }
    if (selection.groupKey !== this.groupKey) {
      return false;
    }
    if (selection.cardId !== this.cardId) {
      return false;
    }
    if (selection.columnId !== this.column.id) {
      return false;
    }
    return selection.isEditing;
  });

  selectCurrentCell = (editing: boolean) => {
    if (this.view.readonly$.value) {
      return;
    }
    const setSelection = this.kanban?.props.setSelection;
    const viewId = this.kanban?.props.view.id;
    if (setSelection && viewId) {
      if (editing && this.cell?.beforeEnterEditMode() === false) {
        return;
      }
      setSelection({
        viewId,
        type: 'kanban',
        selectionType: 'cell',
        groupKey: this.groupKey,
        cardId: this.cardId,
        columnId: this.column.id,
        isEditing: editing,
      });
    }
  };

  get cell(): DataViewCellLifeCycle | undefined {
    return this._cell.value;
  }

  get kanban() {
    return this.closest('mobile-data-view-kanban');
  }

  get selection() {
    return this.closest('mobile-data-view-kanban')?.props.selection$.value;
  }

  override connectedCallback() {
    super.connectedCallback();
    if (this.column.readonly$.value) return;
    this.disposables.add(
      effect(() => {
        const isEditing = this.isEditing$.value;
        if (isEditing) {
          this.isEditing = true;
          this._cell.value?.onEnterEditMode();
        } else {
          this._cell.value?.onExitEditMode();
          this.isEditing = false;
        }
      })
    );
    this._disposables.addFromEvent(this, 'click', e => {
      e.stopPropagation();
      if (!this.isEditing) {
        this.selectCurrentCell(!this.column.readonly$.value);
      }
    });
  }

  override render() {
    const props: CellRenderProps = {
      cell: this.column.cellGet(this.cardId),
      isEditing: this.isEditing,
      selectCurrentCell: this.selectCurrentCell,
    };
    const renderer = this.column.renderer$.value;
    if (!renderer) return;
    const { view, edit } = renderer;
    this.view.lockRows(this.isEditing);
    this.dataset['editing'] = `${this.isEditing}`;
    return html` ${this.renderIcon()}
    ${renderUniLit(this.isEditing && edit ? edit : view, props, {
      ref: this._cell,
      class: 'mobile-kanban-cell',
      style: { display: 'block', flex: '1', overflow: 'hidden' },
    })}`;
  }

  renderIcon() {
    if (this.contentOnly) {
      return;
    }
    return html` <uni-lit
      class="mobile-kanban-cell-icon"
      .uni="${this.column.icon}"
    ></uni-lit>`;
  }

  @property({ attribute: false })
  accessor cardId!: string;

  @property({ attribute: false })
  accessor column!: Property;

  @property({ attribute: false })
  accessor contentOnly = false;

  @property({ attribute: false })
  accessor groupKey!: string;

  @state()
  accessor isEditing = false;

  @property({ attribute: false })
  accessor view!: KanbanSingleView;
}

declare global {
  interface HTMLElementTagNameMap {
    'mobile-kanban-cell': MobileKanbanCell;
  }
}
