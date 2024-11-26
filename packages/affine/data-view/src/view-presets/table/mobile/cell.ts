import { ShadowlessElement } from '@blocksuite/block-std';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/utils';
import { computed, effect } from '@preact/signals-core';
import { css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { createRef } from 'lit/directives/ref.js';

import type { TableColumn } from '../table-view-manager.js';

import {
  type CellRenderProps,
  type DataViewCellLifeCycle,
  renderUniLit,
  type SingleView,
} from '../../../core/index.js';
import { TableAreaSelection } from '../types.js';

export class MobileTableCell extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  static override styles = css`
    mobile-table-cell {
      display: flex;
      align-items: start;
      width: 100%;
      height: 100%;
      border: none;
      outline: none;
    }

    mobile-table-cell * {
      box-sizing: border-box;
    }

    mobile-table-cell uni-lit > *:first-child {
      padding: 6px;
    }
  `;

  private _cell = createRef<DataViewCellLifeCycle>();

  @property({ attribute: false })
  accessor column!: TableColumn;

  @property({ attribute: false })
  accessor rowId!: string;

  cell$ = computed(() => {
    return this.column.cellGet(this.rowId);
  });

  isEditing$ = computed(() => {
    const selection = this.table?.props.selection$.value;
    if (selection?.selectionType !== 'area') {
      return false;
    }
    if (selection.groupKey !== this.groupKey) {
      return false;
    }
    if (selection.focus.columnIndex !== this.columnIndex) {
      return false;
    }
    if (selection.focus.rowIndex !== this.rowIndex) {
      return false;
    }
    return selection.isEditing;
  });

  selectCurrentCell = (editing: boolean) => {
    if (this.view.readonly$.value) {
      return;
    }
    const setSelection = this.table?.props.setSelection;
    const viewId = this.table?.props.view.id;
    if (setSelection && viewId) {
      if (editing && this.cell?.beforeEnterEditMode() === false) {
        return;
      }
      setSelection({
        viewId,
        type: 'table',
        ...TableAreaSelection.create({
          groupKey: this.groupKey,
          focus: {
            rowIndex: this.rowIndex,
            columnIndex: this.columnIndex,
          },
          isEditing: editing,
        }),
      });
    }
  };

  get cell(): DataViewCellLifeCycle | undefined {
    return this._cell.value;
  }

  private get groupKey() {
    return this.closest('mobile-table-group')?.group?.key;
  }

  private get readonly() {
    return this.column.readonly$.value;
  }

  private get table() {
    return this.closest('mobile-data-view-table');
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
    this.disposables.addFromEvent(this, 'click', () => {
      if (!this.isEditing) {
        this.selectCurrentCell(!this.column.readonly$.value);
      }
    });
  }

  override render() {
    const renderer = this.column.renderer$.value;
    if (!renderer) {
      return;
    }
    const { edit, view } = renderer;
    const uni = !this.readonly && this.isEditing && edit != null ? edit : view;
    this.view.lockRows(this.isEditing);
    this.dataset['editing'] = `${this.isEditing}`;
    const props: CellRenderProps = {
      cell: this.cell$.value,
      isEditing: this.isEditing,
      selectCurrentCell: this.selectCurrentCell,
    };

    return renderUniLit(uni, props, {
      ref: this._cell,
      style: {
        display: 'contents',
      },
    });
  }

  @property({ attribute: false })
  accessor columnId!: string;

  @property({ attribute: false })
  accessor columnIndex!: number;

  @state()
  accessor isEditing = false;

  @property({ attribute: false })
  accessor rowIndex!: number;

  @property({ attribute: false })
  accessor view!: SingleView;
}

declare global {
  interface HTMLElementTagNameMap {
    'mobile-table-cell': MobileTableCell;
  }
}
